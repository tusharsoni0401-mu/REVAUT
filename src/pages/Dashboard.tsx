import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/StarRating";
import { SentimentBadge } from "@/components/ReviewBadges";
import { ratingTrendData } from "@/data/mockData";
import { useReviewStore } from "@/stores/useReviewStore";
import { MessageSquare, Star, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { GoogleMapsAnalytics } from "@/components/GoogleMapsAnalytics";

export default function Dashboard() {
  const reviews = useReviewStore((s) => s.reviews);
  const pendingCount = useReviewStore((s) => s.pendingCount());

  const totalReviews = reviews.length;
  const avgRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10;
  const responded = reviews.filter((r) => r.status === "approved" || r.status === "posted").length;
  const responseRate = totalReviews > 0 ? Math.round((responded / totalReviews) * 100) : 0;
  const recentReviews = reviews.slice(0, 5);

  const stats = [
    { label: "Total Reviews", value: totalReviews, icon: MessageSquare, color: "text-primary" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "text-warning" },
    { label: "Response Rate", value: `${responseRate}%`, icon: TrendingUp, color: "text-success" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "text-destructive", href: "/reviews?status=pending" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Review performance overview for restaurants, hotels & resorts</p>
      </div>

      {/* Google Maps Location Analytics */}
      <GoogleMapsAnalytics />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((s) => {
          const card = (
            <Card className={s.href ? "transition-colors hover:bg-accent/50" : undefined}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="mt-2 text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );

          return s.href ? (
            <Link key={s.label} to={s.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rating Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgRating"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Reviews</CardTitle>
          <Link to="/reviews" className="text-xs text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentReviews.map((review) => (
            <Link
              to={`/reviews/${review.id}`}
              key={review.id}
              className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {review.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{review.author}</span>
                  <StarRating rating={review.rating} size={12} />
                  <SentimentBadge sentiment={review.sentiment} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.text}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
