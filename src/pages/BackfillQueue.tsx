import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "@/components/StarRating";
import { PriorityBadge, SentimentBadge } from "@/components/ReviewBadges";
import { useReviewStore } from "@/stores/useReviewStore";
import type { Priority } from "@/data/mockData";
import { Clock, Shield, CheckSquare, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BackfillQueue() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reviews = useReviewStore((s) => s.reviews);
  const postedToday = useReviewStore((s) => s.postedToday);
  const dailyLimit = useReviewStore((s) => s.dailyLimit);
  const batchUpdateStatus = useReviewStore((s) => s.batchUpdateStatus);
  const incrementPostedToday = useReviewStore((s) => s.incrementPostedToday);

  const backfillReviews = useMemo(() => reviews.filter((r) => r.isBackfill), [reviews]);
  const grouped = useMemo(() => ({
    CRITICAL: backfillReviews.filter((r) => r.priority === "CRITICAL"),
    HIGH:     backfillReviews.filter((r) => r.priority === "HIGH"),
    MEDIUM:   backfillReviews.filter((r) => r.priority === "MEDIUM"),
    LOW:      backfillReviews.filter((r) => r.priority === "LOW"),
  }), [backfillReviews]);

  const remaining = dailyLimit - postedToday;
  const limitReached = remaining <= 0;

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectAll = (ids: string[]) => {
    const next = new Set(selected);
    const allSelected = ids.every((id) => next.has(id));
    ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
    setSelected(next);
  };

  const handleBatchApprove = () => {
    if (limitReached) {
      toast({
        title: "Daily limit reached",
        description: `You've already posted ${dailyLimit} responses today. Try again tomorrow to avoid spam detection.`,
        variant: "destructive",
      });
      return;
    }

    const idsToApprove = Array.from(selected);
    const canPost = Math.min(idsToApprove.length, remaining);
    const batch = idsToApprove.slice(0, canPost);

    batchUpdateStatus(batch, "approved");
    incrementPostedToday(batch.length);
    setSelected(new Set());

    toast({
      title: "Batch approved",
      description: `${batch.length} responses queued for posting.${
        canPost < idsToApprove.length
          ? ` ${idsToApprove.length - canPost} skipped due to daily limit.`
          : ""
      }`,
    });
  };

  // Only show pending backfill reviews (already approved/posted ones are done)
  const pendingBackfill = backfillReviews.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Backfill Queue</h1>
        <p className="text-sm text-muted-foreground">
          {pendingBackfill.length} historical reviews awaiting response
        </p>
      </div>

      {/* Anti-spam limiter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Anti-Spam Limiter</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {postedToday}/{dailyLimit} posted today
            </span>
          </div>
          <Progress value={(postedToday / dailyLimit) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {limitReached ? (
              <span className="text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Daily limit reached — posting resumes tomorrow
              </span>
            ) : (
              `${remaining} responses remaining today to avoid spam detection`
            )}
          </p>
        </CardContent>
      </Card>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <Card className="border-primary">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm">{selected.size} reviews selected</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBatchApprove}
                disabled={limitReached}
                className="bg-success hover:bg-success/90"
              >
                <CheckSquare className="h-3 w-3" /> Batch Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority groups */}
      {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((priority) => {
        const items = grouped[priority].filter((r) => r.status === "pending");
        if (items.length === 0) return null;
        const ids = items.map((r) => r.id);

        return (
          <Card key={priority}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={priority} />
                  <CardTitle className="text-sm">{items.length} reviews</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => selectAll(ids)}
                >
                  Select all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/30 transition-colors"
                >
                  <div
                    className="mt-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.has(review.id)}
                      onCheckedChange={() => toggle(review.id)}
                    />
                  </div>
                  <Link to={`/reviews/${review.id}`} className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{review.author}</span>
                      <StarRating rating={review.rating} size={11} />
                      <SentimentBadge sentiment={review.sentiment} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{review.text}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(review.date).toLocaleDateString()}
                    </div>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
