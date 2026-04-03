import { getBrandVoiceSettings, type BrandVoiceSettings } from "@/hooks/useBrandVoice";
import type { Review, AIResponse } from "@/data/mockData";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface GenerateRequest {
  review: Review;
  brandVoice?: BrandVoiceSettings;
}

interface EvaluatorScores {
  brandVoice: number;
  specificity: number;
  safety: number;
  length: number;
}

interface GenerateResult {
  draftResponse: string;
  evaluatorScores: EvaluatorScores;
  confidenceScore: number;
  regenerated: boolean;
}

interface EvaluateRequest {
  review: Review;
  responseText: string;
  brandVoice?: BrandVoiceSettings;
}

export interface EvaluateResult {
  evaluatorScores: EvaluatorScores;
  confidenceScore: number;
}

export async function generateReviewResponse(
  request: GenerateRequest
): Promise<GenerateResult> {
  const brandVoice = request.brandVoice ?? getBrandVoiceSettings();

  const res = await fetch(`${API_BASE}/generate-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review: request.review, brandVoice }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Server error (${res.status})`);
  }

  return res.json();
}

// Scores an existing response without regenerating — use after manual edits
export async function evaluateReviewResponse(
  request: EvaluateRequest
): Promise<EvaluateResult> {
  const brandVoice = request.brandVoice ?? getBrandVoiceSettings();

  const res = await fetch(`${API_BASE}/evaluate-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      review: request.review,
      responseText: request.responseText,
      brandVoice,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Server error (${res.status})`);
  }

  return res.json();
}

// Helper to convert GenerateResult into an AIResponse object for the store
export function toAIResponse(
  reviewId: string,
  result: GenerateResult,
  existingVersion = 0
): AIResponse {
  return {
    id: `response-${reviewId}-${Date.now()}`,
    reviewId,
    text: result.draftResponse,
    confidenceScore: result.confidenceScore,
    evaluatorScores: result.evaluatorScores,
    version: existingVersion + 1,
    createdAt: new Date().toISOString(),
  };
}
