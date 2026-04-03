import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in server/.env");
  process.exit(1);
}

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// ── Helper: call Gemini ─────────────────────────────────────────────
async function callGemini(prompt, temperature = 0.7) {
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in Gemini response");
  return text.trim();
}

// ── Helper: build the generation prompt ─────────────────────────────
function buildPrompt(review, brandVoice) {
  const toneDesc = [
    `Formality: ${brandVoice.tone.formality[0]}% (0=very formal, 100=very casual)`,
    `Playfulness: ${brandVoice.tone.playfulness[0]}% (0=serious, 100=playful)`,
    `Brevity: ${brandVoice.tone.brevity[0]}% (0=brief, 100=detailed)`,
  ].join("\n");

  const examplesSection =
    brandVoice.examples.length > 0
      ? `\n\nHere are example responses to learn from:\n${brandVoice.examples.map((ex, i) => `Example ${i + 1}: "${ex}"`).join("\n")}`
      : "";

  const keywordsSection = [
    brandVoice.includeKeywords.length > 0
      ? `Keywords to naturally include: ${brandVoice.includeKeywords.join(", ")}`
      : "",
    brandVoice.avoidKeywords.length > 0
      ? `Words/phrases to NEVER use: ${brandVoice.avoidKeywords.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `You are an AI review response generator for a restaurant/hospitality business.

PERSONA: ${brandVoice.persona}

TONE SETTINGS:
${toneDesc}
${examplesSection}

${keywordsSection}

---

Write a response to the following customer review. The response should:
1. Address the reviewer by first name
2. Reference specific details from their review
3. Match the tone settings above
4. Be appropriate for the sentiment (${review.sentiment}) and rating (${review.rating}/5)
5. For negative reviews: acknowledge concerns, apologize sincerely, offer concrete next steps
6. For positive reviews: express genuine gratitude, reinforce what they enjoyed
7. For neutral reviews: thank them, acknowledge both positive and negative points, invite them back
8. Keep the response between 2-4 sentences for brief tone, 4-6 for detailed tone

CUSTOMER REVIEW:
Author: ${review.author}
Rating: ${review.rating}/5
Sentiment: ${review.sentiment}
Topics: ${review.topics.join(", ")}
Review: "${review.text}"

Respond with ONLY the review response text. No quotes, no preamble, no explanation.`;
}

// ── Helper: build evaluator prompt ──────────────────────────────────
function buildEvaluatorPrompt(review, response, brandVoice) {
  return `You are an AI response evaluator. Score the following review response on 4 criteria, each from 0.0 to 1.0.

BRAND VOICE SETTINGS:
- Persona: ${brandVoice.persona}
- Tone: Formality ${brandVoice.tone.formality[0]}%, Playfulness ${brandVoice.tone.playfulness[0]}%, Brevity ${brandVoice.tone.brevity[0]}%
- Include keywords: ${brandVoice.includeKeywords.join(", ")}
- Avoid keywords: ${brandVoice.avoidKeywords.join(", ")}

ORIGINAL REVIEW:
"${review.text}" (${review.rating}/5, ${review.sentiment})

GENERATED RESPONSE:
"${response}"

Score these criteria:
1. brandVoice (0-1): How well does the response match the persona and tone settings?
2. specificity (0-1): Does it reference specific details from the review rather than being generic?
3. safety (0-1): Is it professional, non-offensive, avoids promises that can't be kept?
4. length (0-1): Is the length appropriate for the brevity setting?

Respond with ONLY a JSON object, no markdown, no explanation:
{"brandVoice": 0.0, "specificity": 0.0, "safety": 0.0, "length": 0.0}`;
}

// ── Helper: parse evaluator scores safely ───────────────────────────
function parseEvaluatorScores(raw) {
  try {
    const cleaned = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      brandVoice: Math.max(0, Math.min(1, Number(parsed.brandVoice) || 0.7)),
      specificity: Math.max(0, Math.min(1, Number(parsed.specificity) || 0.6)),
      safety: Math.max(0, Math.min(1, Number(parsed.safety) || 0.9)),
      length: Math.max(0, Math.min(1, Number(parsed.length) || 0.7)),
    };
  } catch {
    return { brandVoice: 0.75, specificity: 0.7, safety: 0.9, length: 0.75 };
  }
}

// ── Helper: compute confidence ──────────────────────────────────────
function computeConfidence(scores) {
  return (
    Math.round(
      (scores.brandVoice * 0.3 +
        scores.specificity * 0.3 +
        scores.safety * 0.25 +
        scores.length * 0.15) *
        100
    ) / 100
  );
}

// ━━ POST /api/generate-response ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Accepts { review, brandVoice } — generates a draft, evaluates it,
// auto-retries once if confidence < 0.8, returns best result.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post("/api/generate-response", async (req, res) => {
  try {
    const { review, brandVoice } = req.body;

    if (!review || !brandVoice) {
      return res.status(400).json({ error: "review and brandVoice are required" });
    }

    // Step 1: Generate
    const draftResponse = await callGemini(buildPrompt(review, brandVoice));

    // Step 2: Evaluate
    const evalRaw = await callGemini(buildEvaluatorPrompt(review, draftResponse, brandVoice));
    const evaluatorScores = parseEvaluatorScores(evalRaw);
    const confidenceScore = computeConfidence(evaluatorScores);

    // Step 3: Retry once if low confidence
    if (confidenceScore < 0.8) {
      const retryPrompt =
        buildPrompt(review, brandVoice) +
        "\n\nPREVIOUS ATTEMPT SCORED LOW. Improve specificity and brand voice adherence.";
      const retryResponse = await callGemini(retryPrompt);
      const retryEvalRaw = await callGemini(
        buildEvaluatorPrompt(review, retryResponse, brandVoice)
      );
      const retryScores = parseEvaluatorScores(retryEvalRaw);
      const retryConfidence = computeConfidence(retryScores);

      if (retryConfidence > confidenceScore) {
        return res.json({
          draftResponse: retryResponse,
          evaluatorScores: retryScores,
          confidenceScore: retryConfidence,
          regenerated: true,
        });
      }
    }

    return res.json({
      draftResponse,
      evaluatorScores,
      confidenceScore,
      regenerated: false,
    });
  } catch (err) {
    console.error("generate-response error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ━━ POST /api/evaluate-response ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Accepts { review, responseText, brandVoice }
// Scores an existing response without regenerating it.
// Used when a user edits the AI draft manually and wants fresh scores.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post("/api/evaluate-response", async (req, res) => {
  try {
    const { review, responseText, brandVoice } = req.body;

    if (!review || !responseText || !brandVoice) {
      return res
        .status(400)
        .json({ error: "review, responseText, and brandVoice are required" });
    }

    const evalRaw = await callGemini(
      buildEvaluatorPrompt(review, responseText, brandVoice)
    );
    const evaluatorScores = parseEvaluatorScores(evalRaw);
    const confidenceScore = computeConfidence(evaluatorScores);

    return res.json({ evaluatorScores, confidenceScore });
  } catch (err) {
    console.error("evaluate-response error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Health check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`RevAut API server running on http://localhost:${PORT}`);
});
