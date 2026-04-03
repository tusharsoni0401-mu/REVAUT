import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sentimentBreakdown, bestResponses } from "@/data/mockData";
import { useReviewStore } from "@/stores/useReviewStore";
import { useInsightAlerts, useTopicComplaintData } from "@/hooks/useInsightAlerts";
import { AlertTriangle, TrendingUp, Lightbulb, ArrowUp, ArrowDown, Minus, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const severityColors = { high: "bg-destructive/10 text-destructive border-destructive/20", medium: "bg-warning/10 text-warning border-warning/20", low: "bg-success/10 text-success border-success/20" };
const severityIcons = { high: AlertTriangle, medium: TrendingUp, low: Lightbulb };

export default function Insights() {
  const reviews = useReviewStore((s) => s.reviews);
  const alerts = useInsightAlerts();
  const topicComplaintData = useTopicComplaintData();

  // Dynamic sentiment breakdown from store
  const dynamicSentiment = useMemo(() => {
    const total = reviews.length || 1;
    const pos = reviews.filter((r) => r.sentiment === "positive").length;
    const neu = reviews.filter((r) => r.sentiment === "neutral").length;
    const neg = reviews.filter((r) => r.sentiment === "negative").length;
    return [
      { name: "Positive", value: Math.round((pos / total) * 100), fill: "hsl(var(--success))" },
      { name: "Neutral", value: Math.round((neu / total) * 100), fill: "hsl(var(--warning))" },
      { name: "Negative", value: Math.round((neg / total) * 100), fill: "hsl(var(--destructive))" },
    ];
  }, [reviews]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">AI-powered analytics from your reviews</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = severityIcons[alert.severity];
          return (
            <Card key={alert.id} className={`border-l-4 ${alert.severity === "high" ? "border-l-destructive" : alert.severity === "medium" ? "border-l-warning" : "border-l-success"}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${alert.severity === "high" ? "text-destructive" : alert.severity === "medium" ? "text-warning" : "text-success"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  </div>
                  <Badge variant="outline" className={severityColors[alert.severity]}>{alert.severity}</Badge>
                </div>
                <div className="rounded-md bg-accent/50 p-2 text-xs flex items-start gap-1.5">
                  <Lightbulb className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                  <span>{alert.recommendation}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Top Complaint Topics</CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Last 30 days</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicComplaintData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="topic" width={80} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1">
            {topicComplaintData.map((t) => (
              <div key={t.topic} className="flex items-center justify-between text-xs">
                <span>{t.topic}</span>
                <span className={`flex items-center gap-0.5 ${t.change > 0 ? "text-destructive" : t.change < 0 ? "text-success" : "text-muted-foreground"}`}>
                  {t.change > 0 ? <ArrowUp className="h-3 w-3" /> : t.change < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {Math.abs(t.change)} vs last week
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Last 30 days</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dynamicSentiment} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                  {dynamicSentiment.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Best Performing Responses</CardTitle>
          <CardDescription>Responses with highest engagement scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {bestResponses.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success font-bold text-sm">
                {r.engagementScore}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 flex-1">{r.responseSnippet}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Response Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center rounded-lg border p-3">
              <p className="text-2xl font-bold text-success">+0.3</p>
              <p className="text-xs text-muted-foreground">Avg rating boost from responding</p>
            </div>
            <div className="text-center rounded-lg border p-3">
              <p className="text-2xl font-bold text-primary">4.2h</p>
              <p className="text-xs text-muted-foreground">Avg response time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
