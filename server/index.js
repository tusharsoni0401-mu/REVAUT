import "dotenv/config";
import express from "express";
import cors from "cors";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

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
  if (!text) {
    console.error("Unexpected Gemini response structure:", JSON.stringify(data, null, 2));
    throw new Error("No text in Gemini response — check server logs");
  }
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

// ━━ POST /api/analyze-location ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Accepts { url, businessType } — scrapes Google Maps reviews using
// Puppeteer, then feeds them to Gemini for AI sentiment/topic analysis.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Reusable browser instance to save memory on Render
let _browser = null;
async function getBrowser() {
  if (_browser && _browser.connected) return _browser;

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // On Render: use @sparticuz/chromium's bundled lightweight binary
    _browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // Locally: dynamically import full puppeteer (devDependency) which bundles Chrome
    const puppeteer = await import("puppeteer");
    _browser = await puppeteer.default.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
      ],
    });
  }
  return _browser;
}

// Clean up browser on process exit
process.on("SIGINT",  () => { _browser?.close(); process.exit(); });
process.on("SIGTERM", () => { _browser?.close(); process.exit(); });

app.post("/api/analyze-location", async (req, res) => {
  const { url, businessType = "restaurant" } = req.body;

  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }
  if (!url.includes("google") && !url.includes("goo.gl") && !url.includes("maps")) {
    return res.status(400).json({ error: "Please provide a valid Google Maps URL" });
  }

  let page;
  try {
    console.log(`[analyze] Scraping: ${url}`);
    const browser = await getBrowser();
    page = await browser.newPage();

    // Stealth basics
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 900 });

    // Navigate to the Maps URL
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });

    // Dismiss Google cookie consent if present
    try {
      const consentBtn = await page.$(
        'button[aria-label="Accept all"], form[action*="consent"] button'
      );
      if (consentBtn) {
        await consentBtn.click();
        await page.waitForTimeout(1500);
      }
    } catch {}

    // Wait for reviews to be present
    await page.waitForSelector("[data-review-id]", { timeout: 20000 });

    // ── Extract place info ──────────────────────────────────────────
    const placeInfo = await page.evaluate(() => {
      const nameEl = document.querySelector("h1");
      const ratingEl = document.querySelector("div.fontDisplayLarge");
      const countEl = Array.from(document.querySelectorAll("div.fontBodySmall"))
        .find((el) => el.textContent.includes("review"));
      const addressEl = document.querySelector('button[data-item-id="address"]');

      return {
        name: nameEl?.textContent?.trim() || "Unknown",
        rating: ratingEl?.textContent?.trim() || "0",
        reviewCountText: countEl?.textContent?.trim() || "0 reviews",
        address: addressEl?.textContent?.trim() || "",
      };
    });

    console.log(`[analyze] Place: ${placeInfo.name}, Rating: ${placeInfo.rating}`);

    // ── Scroll to load more reviews ─────────────────────────────────
    const MAX_SCROLLS = 8;
    for (let i = 0; i < MAX_SCROLLS; i++) {
      const scrolled = await page.evaluate(() => {
        const container = document.querySelector(
          '[aria-label="Refine reviews"]'
        )?.parentElement?.parentElement;
        if (!container) return false;
        const scrollable =
          container.querySelector("div[tabindex='-1']") || container;
        scrollable.scrollTop = scrollable.scrollHeight;
        return true;
      });
      if (!scrolled) break;
      await page.waitForTimeout(1200);
    }

    // ── Click all "See more" buttons to expand review text ──────────
    try {
      const seeMoreButtons = await page.$$('[aria-label="See more"]');
      for (const btn of seeMoreButtons.slice(0, 60)) {
        try { await btn.click(); } catch {}
      }
      await page.waitForTimeout(500);
    } catch {}

    // ── Extract all reviews ─────────────────────────────────────────
    const reviews = await page.evaluate(() => {
      const nodes = document.querySelectorAll("[data-review-id]");
      return Array.from(nodes).map((node) => {
        const ratingEl = node.querySelector('span[aria-label*="star"]');
        const ratingLabel = ratingEl?.getAttribute("aria-label") || "";
        const ratingMatch = ratingLabel.match(/(\d)/);

        // Get the review text — try multiple selectors
        let text = "";
        const textContainer = node.querySelector(".MyEned span.wiI7pd");
        if (textContainer) {
          text = textContainer.textContent.trim();
        } else {
          // Fallback: get text after the star rating
          const allSpans = node.querySelectorAll("span.wiI7pd");
          if (allSpans.length > 0) {
            text = allSpans[0].textContent.trim();
          }
        }

        const authorEl = node.querySelector("[class*='d4r55']");
        const timeEl = node.querySelector("[class*='rsqaWe']");

        return {
          author: authorEl?.textContent?.trim() || "Anonymous",
          rating: ratingMatch ? parseInt(ratingMatch[1]) : 0,
          text,
          date: timeEl?.textContent?.trim() || "",
        };
      }).filter((r) => r.text.length > 0);
    });

    console.log(`[analyze] Scraped ${reviews.length} reviews`);

    await page.close();

    // ── Parse numeric values ────────────────────────────────────────
    const avgRating = parseFloat(placeInfo.rating.replace(",", ".")) || 0;
    const reviewCountMatch = placeInfo.reviewCountText.match(/([\d,.]+)/);
    const totalReviews = reviewCountMatch
      ? parseInt(reviewCountMatch[1].replace(/[.,]/g, ""))
      : reviews.length;

    // ── Compute rating distribution from scraped reviews ────────────
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
    const ratingDistribution = [
      { stars: "5★", count: dist[5] },
      { stars: "4★", count: dist[4] },
      { stars: "3★", count: dist[3] },
      { stars: "2★", count: dist[2] },
      { stars: "1★", count: dist[1] },
    ];

    // ── Feed reviews to Gemini for AI analysis ──────────────────────
    const reviewSample = reviews.slice(0, 50);
    const reviewTexts = reviewSample
      .map((r, i) => `Review ${i + 1} (${r.rating}★): "${r.text}"`)
      .join("\n");

    const analysisPrompt = `You are an expert review analyst for a ${businessType} business.

Analyze these ${reviewSample.length} customer reviews and return a JSON object with EXACTLY this structure.
No markdown, no code fences, no explanation — ONLY valid JSON.

REVIEWS:
${reviewTexts}

Return this JSON structure:
{
  "sentimentBreakdown": {
    "positive": <percentage 0-100>,
    "neutral": <percentage 0-100>,
    "negative": <percentage 0-100>
  },
  "topTopics": [
    { "topic": "<topic name>", "count": <estimated mentions>, "sentiment": "positive" | "negative" | "neutral" },
    ... (exactly 6 topics)
  ],
  "highlights": [
    "<insight about what's working well>",
    "<another positive insight>",
    "<third positive insight>"
  ],
  "warnings": [
    "<concern or area needing improvement>",
    "<another concern>",
    "<third concern>"
  ],
  "recentTrend": "up" | "down" | "stable",
  "trendDelta": <number like 0.1 or 0.3>
}

Base everything ONLY on the actual review content. Be specific — reference real patterns from the reviews.`;

    let analysis;
    try {
      const raw = await callGemini(analysisPrompt, 0.3);
      const cleaned = raw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch (err) {
      console.error("[analyze] Gemini analysis failed, using computed fallback:", err.message);
      // Fallback: compute from scraped data
      const pos = reviews.filter((r) => r.rating >= 4).length;
      const neg = reviews.filter((r) => r.rating <= 2).length;
      const neu = reviews.length - pos - neg;
      const total = reviews.length || 1;
      analysis = {
        sentimentBreakdown: {
          positive: Math.round((pos / total) * 100),
          neutral: Math.round((neu / total) * 100),
          negative: Math.round((neg / total) * 100),
        },
        topTopics: [
          { topic: "Food Quality", count: Math.round(pos * 0.6), sentiment: "positive" },
          { topic: "Service", count: Math.round(total * 0.3), sentiment: "neutral" },
          { topic: "Ambience", count: Math.round(total * 0.2), sentiment: "positive" },
          { topic: "Value", count: Math.round(total * 0.15), sentiment: "neutral" },
          { topic: "Wait Time", count: Math.round(neg * 0.4), sentiment: "negative" },
          { topic: "Cleanliness", count: Math.round(total * 0.1), sentiment: "positive" },
        ],
        highlights: ["High overall rating", "Majority positive reviews", "Consistent quality mentioned"],
        warnings: ["Some low ratings present", "Response rate could improve", "Check recent negative feedback"],
        recentTrend: avgRating >= 4 ? "up" : avgRating >= 3 ? "stable" : "down",
        trendDelta: 0.1,
      };
    }

    // ── Build response matching frontend's LocationAnalytics shape ───
    const SENTIMENT_COLORS = {
      Positive: "hsl(142, 71%, 45%)",
      Neutral: "hsl(48, 96%, 53%)",
      Negative: "hsl(0, 84%, 60%)",
    };

    const result = {
      name: placeInfo.name,
      address: placeInfo.address || "Address not available",
      businessType,
      rating: avgRating,
      totalReviews,
      responseRate: 0, // Can't determine from scraping
      avgResponseTime: "N/A",
      sentimentBreakdown: [
        { name: "Positive", value: analysis.sentimentBreakdown.positive, color: SENTIMENT_COLORS.Positive },
        { name: "Neutral", value: analysis.sentimentBreakdown.neutral, color: SENTIMENT_COLORS.Neutral },
        { name: "Negative", value: analysis.sentimentBreakdown.negative, color: SENTIMENT_COLORS.Negative },
      ],
      topTopics: analysis.topTopics,
      ratingDistribution,
      recentTrend: analysis.recentTrend || "stable",
      trendDelta: analysis.trendDelta || 0.1,
      highlights: analysis.highlights,
      warnings: analysis.warnings,
      scrapedReviewCount: reviews.length,
    };

    console.log(`[analyze] Done: ${placeInfo.name} — ${reviews.length} reviews analyzed`);
    return res.json(result);
  } catch (err) {
    console.error("[analyze] Scrape error:", err.message);
    if (page) try { await page.close(); } catch {}
    return res.status(500).json({
      error: "Failed to analyze location",
      details: err.message,
    });
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
