import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, Search, Star, MessageSquare, TrendingUp, TrendingDown,
  ThumbsUp, ThumbsDown, AlertTriangle, Clock, Loader2, CheckCircle2,
  Utensils, Hotel, Palmtree, Coffee,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type BusinessType = "restaurant" | "hotel" | "resort" | "cafe";

interface LocationAnalytics {
  name: string;
  address: string;
  businessType: BusinessType;
  rating: number;
  totalReviews: number;
  responseRate: number;
  avgResponseTime: string;
  sentimentBreakdown: { name: string; value: number; color: string }[];
  topTopics: { topic: string; count: number; sentiment: "positive" | "negative" | "neutral" }[];
  ratingDistribution: { stars: string; count: number }[];
  recentTrend: "up" | "down" | "stable";
  trendDelta: number;
  highlights: string[];
  warnings: string[];
}

const BUSINESS_CONFIG: Record<BusinessType, {
  icon: typeof Utensils;
  label: string;
  placeholder: string;
}> = {
  restaurant: {
    icon: Utensils,
    label: "Restaurant",
    placeholder: "https://maps.google.com/maps/place/Your+Restaurant...",
  },
  hotel: {
    icon: Hotel,
    label: "Hotel",
    placeholder: "https://maps.google.com/maps/place/Your+Hotel...",
  },
  resort: {
    icon: Palmtree,
    label: "Resort",
    placeholder: "https://maps.google.com/maps/place/Your+Resort...",
  },
  cafe: {
    icon: Coffee,
    label: "Cafe",
    placeholder: "https://maps.google.com/maps/place/Your+Cafe...",
  },
};

const SENTIMENT_ICON = {
  positive: <ThumbsUp className="h-3 w-3 text-success" />,
  negative: <ThumbsDown className="h-3 w-3 text-destructive" />,
  neutral: <AlertTriangle className="h-3 w-3 text-warning" />,
};

// Validate that a URL looks like a real Google Maps link
function isValidGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "maps.google.com" ||
      host === "www.google.com" ||
      host === "goo.gl" ||
      host === "maps.app.goo.gl"
    );
  } catch {
    // Not a valid URL — also accept short "goo.gl" pasted without protocol
    return url.includes("goo.gl") || url.includes("maps.google.com");
  }
}

export function GoogleMapsAnalytics() {
  const [url, setUrl] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("restaurant");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analytics, setAnalytics] = useState<LocationAnalytics | null>(null);
  const [error, setError] = useState("");
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate progress bar while loading (slow ramp for ~20-30s scrape)
  useEffect(() => {
    if (loading) {
      setProgress(0);
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressRef.current!);
            return 90;
          }
          return prev + 2;
        });
      }, 600);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
      if (analytics) setProgress(100);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [loading, analytics]);

  const handleSubmit = async () => {
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a Google Maps link");
      return;
    }
    if (!isValidGoogleMapsUrl(trimmed)) {
      setError("Please enter a valid Google Maps URL (maps.google.com or goo.gl)");
      return;
    }
    setLoading(true);
    setAnalytics(null);

    try {
      const res = await fetch("/api/analyze-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, businessType }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setAnalytics(data as LocationAnalytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze location");
    } finally {
      setLoading(false);
    }
  };

  const config = BUSINESS_CONFIG[businessType];
  const TypeIcon = analytics ? BUSINESS_CONFIG[analytics.businessType].icon : config.icon;

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Analyze a Location
          </CardTitle>
          <CardDescription>
            Paste your Google Maps link to get instant review analytics for your restaurant, hotel, resort, or cafe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">
                  <span className="flex items-center gap-2"><Utensils className="h-3.5 w-3.5" /> Restaurant</span>
                </SelectItem>
                <SelectItem value="hotel">
                  <span className="flex items-center gap-2"><Hotel className="h-3.5 w-3.5" /> Hotel</span>
                </SelectItem>
                <SelectItem value="resort">
                  <span className="flex items-center gap-2"><Palmtree className="h-3.5 w-3.5" /> Resort</span>
                </SelectItem>
                <SelectItem value="cafe">
                  <span className="flex items-center gap-2"><Coffee className="h-3.5 w-3.5" /> Cafe</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={config.placeholder}
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1"
            />
            <Button onClick={handleSubmit} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">{loading ? "Analyzing..." : "Analyze"}</span>
            </Button>
          </div>
          {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <p className="text-sm font-medium">Scraping & analyzing {config.label.toLowerCase()} reviews...</p>
              <p className="text-xs text-muted-foreground">This takes 15-30 seconds — loading reviews from Google Maps</p>
            </div>
            {/* Fix: animated progress driven by state, not hardcoded */}
            <Progress value={progress} className="w-48 mx-auto transition-all duration-150" />
          </CardContent>
        </Card>
      )}

      {analytics && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{analytics.name}</h3>
                    <p className="text-xs text-muted-foreground">{analytics.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="gap-1">
                    {BUSINESS_CONFIG[analytics.businessType].label}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" /> Analyzed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="p-3">
                <Star className="h-4 w-4 text-warning" />
                <p className="mt-1.5 text-2xl font-bold">{analytics.rating}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  {analytics.recentTrend === "up" ? (
                    <span className="text-xs text-success flex items-center">
                      <TrendingUp className="h-3 w-3" />+{analytics.trendDelta}
                    </span>
                  ) : (
                    <span className="text-xs text-destructive flex items-center">
                      <TrendingDown className="h-3 w-3" />-{analytics.trendDelta}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <p className="mt-1.5 text-2xl font-bold">{analytics.totalReviews}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <p className="mt-1.5 text-2xl font-bold">{analytics.responseRate}%</p>
                <p className="text-xs text-muted-foreground">Response Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <Clock className="h-4 w-4 text-warning" />
                <p className="mt-1.5 text-lg font-bold">{analytics.avgResponseTime}</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sentiment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.sentimentBreakdown}
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={65}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {analytics.sentimentBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 -mt-2">
                  {analytics.sentimentBreakdown.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name} {s.value}%
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.ratingDistribution} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="stars" type="category" tick={{ fontSize: 11 }} width={30} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Review Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topTopics.map((t) => (
                <div key={t.topic} className="flex items-center justify-between rounded-lg border p-2.5">
                  <div className="flex items-center gap-2">
                    {SENTIMENT_ICON[t.sentiment]}
                    <span className="text-sm font-medium">{t.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t.count} mentions</span>
                    <Badge
                      variant="outline"
                      className={
                        t.sentiment === "positive" ? "border-success/30 text-success bg-success/5" :
                        t.sentiment === "negative" ? "border-destructive/30 text-destructive bg-destructive/5" :
                        "border-warning/30 text-warning bg-warning/5"
                      }
                    >
                      {t.sentiment}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-success/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-success">
                  <ThumbsUp className="h-4 w-4" /> Key Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Action Needed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
