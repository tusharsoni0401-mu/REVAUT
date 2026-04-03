import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "@/components/StarRating";
import { SentimentBadge, StatusBadge, PriorityBadge } from "@/components/ReviewBadges";
import { Badge } from "@/components/ui/badge";
import { PLATFORMS } from "@/data/mockData";
import { useReviewStore } from "@/stores/useReviewStore";
import { Search } from "lucide-react";

export default function Reviews() {
  const [params, setParams] = useSearchParams();

  const search = params.get("search") ?? "";
  const sentimentFilter = params.get("sentiment") ?? "all";
  const statusFilter = params.get("status") ?? "all";
  const ratingFilter = params.get("rating") ?? "all";
  const platformFilter = params.get("platform") ?? "all";

  function setFilter(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "all" || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  }

  const filtered = useReviewStore((s) =>
    s.reviewsByFilters({
      search,
      platform: platformFilter,
      sentiment: sentimentFilter,
      status: statusFilter,
      rating: ratingFilter,
    })
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} reviews found</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            className="pl-9"
            value={search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Platform filter — was missing from original */}
          <Select value={platformFilter} onValueChange={(v) => setFilter("platform", v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform === "tripadvisor" ? "TripAdvisor" : "Google"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sentimentFilter} onValueChange={(v) => setFilter("sentiment", v)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setFilter("status", v)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ratingFilter} onValueChange={(v) => setFilter("rating", v)}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Stars" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>{r}★</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No reviews match your filters.
          </p>
        )}
        {filtered.map((review) => (
          <Link to={`/reviews/${review.id}`} key={review.id}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {review.avatar}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{review.author}</span>
                        <StarRating rating={review.rating} size={12} />
                      </div>
                      <PriorityBadge priority={review.priority} />
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{review.text}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <SentimentBadge sentiment={review.sentiment} />
                      <StatusBadge status={review.status} />
                      <Badge variant="outline" className="text-xs capitalize">
                        {review.platform}
                      </Badge>
                      {review.topics.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
