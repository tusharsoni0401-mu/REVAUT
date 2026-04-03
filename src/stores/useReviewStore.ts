import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Review, AIResponse, ReviewStatus, Priority } from "@/data/mockData";

interface ReviewStore {
  reviews: Review[];
  aiResponses: AIResponse[];
  postedToday: number;
  dailyLimit: number;
  loading: boolean;
  error: string | null;

  // Data loading
  fetchAll: () => Promise<void>;

  // Review mutations
  updateReviewStatus: (id: string, status: ReviewStatus) => Promise<void>;
  batchUpdateStatus:  (ids: string[], status: ReviewStatus) => Promise<void>;

  // AI response mutations
  updateAIResponse: (reviewId: string, text: string) => Promise<void>;
  addAIResponse:    (response: AIResponse) => Promise<void>;

  // Daily posting counter
  incrementPostedToday: (count: number) => void;
  resetPostedToday:     () => void;

  // Derived selectors (synchronous, read from local state)
  pendingCount:     () => number;
  backfillReviews:  () => Review[];
  reviewsByLocation:(locationId: string) => Review[];
  reviewsByFilters: (filters: {
    search?:     string;
    platform?:   string;
    sentiment?:  string;
    status?:     string;
    rating?:     string;
    locationId?: string;
  }) => Review[];
  getReview:        (id: string) => Review | undefined;
  getAIResponse:    (reviewId: string) => AIResponse | undefined;
  groupedBackfill:  (locationId?: string) => Record<Priority, Review[]>;
}

// ── DB row → frontend type mappers ──────────────────────────────────

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id:         row.id as string,
    locationId: row.location_id as string,
    author:     row.author as string,
    avatar:     row.avatar as string,
    rating:     row.rating as number,
    date:       row.date as string,
    text:       row.text as string,
    sentiment:  row.sentiment as Review["sentiment"],
    platform:   row.platform as Review["platform"],
    status:     row.status as ReviewStatus,
    topics:     row.topics as string[],
    priority:   row.priority as Priority,
    isBackfill: row.is_backfill as boolean,
  };
}

function rowToAIResponse(row: Record<string, unknown>): AIResponse {
  const scores = row.evaluator_scores as Record<string, number>;
  return {
    id:              row.id as string,
    reviewId:        row.review_id as string,
    text:            row.text as string,
    confidenceScore: Number(row.confidence_score),
    evaluatorScores: {
      brandVoice:  scores.brandVoice  ?? 0.7,
      specificity: scores.specificity ?? 0.6,
      safety:      scores.safety      ?? 0.9,
      length:      scores.length      ?? 0.7,
    },
    version:   row.version as number,
    createdAt: row.created_at as string,
  };
}

// ── Store ────────────────────────────────────────────────────────────

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews:      [],
  aiResponses:  [],
  postedToday:  0,
  dailyLimit:   10,
  loading:      false,
  error:        null,

  // ── Fetch all data from Supabase ──────────────────────────────────
  fetchAll: async () => {
    set({ loading: true, error: null });

    const [reviewsRes, responsesRes] = await Promise.all([
      supabase.from("reviews").select("*").order("date", { ascending: false }),
      supabase.from("ai_responses").select("*").order("created_at"),
    ]);

    if (reviewsRes.error) {
      set({ loading: false, error: reviewsRes.error.message });
      return;
    }
    if (responsesRes.error) {
      set({ loading: false, error: responsesRes.error.message });
      return;
    }

    set({
      reviews:     (reviewsRes.data  ?? []).map(rowToReview),
      aiResponses: (responsesRes.data ?? []).map(rowToAIResponse),
      loading:     false,
    });
  },

  // ── Mutations — write to DB then update local state ───────────────

  updateReviewStatus: async (id, status) => {
    const { error } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);

    set((state) => ({
      reviews: state.reviews.map((r) => (r.id === id ? { ...r, status } : r)),
    }));
  },

  batchUpdateStatus: async (ids, status) => {
    const { error } = await supabase
      .from("reviews")
      .update({ status })
      .in("id", ids);
    if (error) throw new Error(error.message);

    set((state) => ({
      reviews: state.reviews.map((r) =>
        ids.includes(r.id) ? { ...r, status } : r
      ),
    }));
  },

  updateAIResponse: async (reviewId, text) => {
    const existing = get().aiResponses.find((r) => r.reviewId === reviewId);
    if (!existing) return;

    const newVersion = existing.version + 1;
    const { error } = await supabase
      .from("ai_responses")
      .update({ text, version: newVersion, created_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);

    set((state) => ({
      aiResponses: state.aiResponses.map((r) =>
        r.reviewId === reviewId
          ? { ...r, text, version: newVersion, createdAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  addAIResponse: async (response) => {
    const { error } = await supabase.from("ai_responses").upsert(
      {
        id:               response.id,
        review_id:        response.reviewId,
        text:             response.text,
        confidence_score: response.confidenceScore,
        evaluator_scores: response.evaluatorScores,
        version:          response.version,
        created_at:       response.createdAt,
      },
      { onConflict: "review_id" }
    );
    if (error) throw new Error(error.message);

    set((state) => {
      const exists = state.aiResponses.some((r) => r.reviewId === response.reviewId);
      return {
        aiResponses: exists
          ? state.aiResponses.map((r) => (r.reviewId === response.reviewId ? response : r))
          : [...state.aiResponses, response],
      };
    });
  },

  // ── Daily posting counter (local only for now) ────────────────────
  incrementPostedToday: (count) =>
    set((state) => ({ postedToday: state.postedToday + count })),

  resetPostedToday: () => set({ postedToday: 0 }),

  // ── Selectors ─────────────────────────────────────────────────────
  pendingCount: () => get().reviews.filter((r) => r.status === "pending").length,

  backfillReviews: () => get().reviews.filter((r) => r.isBackfill),

  reviewsByLocation: (locationId) =>
    get().reviews.filter((r) => r.locationId === locationId),

  reviewsByFilters: (filters) => {
    let result = get().reviews;
    if (filters.locationId) result = result.filter((r) => r.locationId === filters.locationId);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) => r.author.toLowerCase().includes(q) || r.text.toLowerCase().includes(q)
      );
    }
    if (filters.platform && filters.platform !== "all")
      result = result.filter((r) => r.platform === filters.platform);
    if (filters.sentiment && filters.sentiment !== "all")
      result = result.filter((r) => r.sentiment === filters.sentiment);
    if (filters.status && filters.status !== "all")
      result = result.filter((r) => r.status === filters.status);
    if (filters.rating && filters.rating !== "all")
      result = result.filter((r) => r.rating === Number(filters.rating));
    return result;
  },

  getReview:     (id)       => get().reviews.find((r) => r.id === id),
  getAIResponse: (reviewId) => get().aiResponses.find((r) => r.reviewId === reviewId),

  groupedBackfill: (locationId) => {
    let backfill = get().reviews.filter((r) => r.isBackfill);
    if (locationId) backfill = backfill.filter((r) => r.locationId === locationId);
    return {
      CRITICAL: backfill.filter((r) => r.priority === "CRITICAL"),
      HIGH:     backfill.filter((r) => r.priority === "HIGH"),
      MEDIUM:   backfill.filter((r) => r.priority === "MEDIUM"),
      LOW:      backfill.filter((r) => r.priority === "LOW"),
    };
  },
}));
