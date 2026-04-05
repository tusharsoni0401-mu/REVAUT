import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StarRating } from "@/components/StarRating";
import { SentimentBadge, StatusBadge, PriorityBadge } from "@/components/ReviewBadges";
import { useReviewStore } from "@/stores/useReviewStore";
import { generateReviewResponse, toAIResponse } from "@/services/geminiService";
import {
  ArrowLeft, Check, Edit3, X, RefreshCw, Bot, Shield,
  Target, Type, Ruler, Clock, AlertCircle, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReviewDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const storeLoading = useReviewStore((s) => s.loading);
  const review = useReviewStore((s) => s.getReview(id ?? ""));
  const response = useReviewStore((s) => s.getAIResponse(id ?? ""));
  const updateReviewStatus = useReviewStore((s) => s.updateReviewStatus);
  const updateAIResponse = useReviewStore((s) => s.updateAIResponse);
  const addAIResponse = useReviewStore((s) => s.addAIResponse);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(response?.text ?? "");
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">Review not found</p>
        <Link to="/reviews">
          <Button variant="outline">Back to Reviews</Button>
        </Link>
      </div>
    );
  }

  const handleAction = (action: "approve" | "reject") => {
    const newStatus = action === "approve" ? "approved" : "rejected";
    updateReviewStatus(review.id, newStatus);
    if (action === "approve" && editText !== response?.text) {
      updateAIResponse(review.id, editText);
    }
    const label = action === "approve" ? "approved" : "rejected";
    toast({
      title: `Response ${label}`,
      description: `The AI response has been ${label} successfully.`,
    });
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const result = await generateReviewResponse({ review });
      const newResponse = toAIResponse(review.id, result, response?.version ?? 0);

      if (response) {
        updateAIResponse(review.id, newResponse.text);
      } else {
        addAIResponse(newResponse);
      }
      setEditText(newResponse.text);

      toast({
        title: result.regenerated ? "Response regenerated (2nd attempt)" : "Response generated",
        description: `Confidence: ${Math.round(result.confidenceScore * 100)}% — powered by Gemini`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast({
        title: "Generation failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const evaluatorItems = response
    ? [
        { label: "Brand Voice", score: response.evaluatorScores.brandVoice, icon: Target },
        { label: "Specificity",  score: response.evaluatorScores.specificity, icon: Type },
        { label: "Safety",       score: response.evaluatorScores.safety,      icon: Shield },
        { label: "Length",       score: response.evaluatorScores.length,       icon: Ruler },
      ]
    : [];

  return (
    <div className="space-y-4">
      <Link
        to="/reviews"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Reviews
      </Link>

      {/* Review card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                {review.avatar}
              </div>
              <div>
                <CardTitle className="text-base">{review.author}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} size={14} />
                  <span className="text-xs text-muted-foreground capitalize">{review.platform}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <PriorityBadge priority={review.priority} />
              <StatusBadge status={review.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">{review.text}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <SentimentBadge sentiment={review.sentiment} />
            {review.topics.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(review.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI response card */}
      {response && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">AI Response</CardTitle>
              </div>
              <Badge
                variant={response.confidenceScore >= 0.85 ? "default" : "outline"}
                className={response.confidenceScore >= 0.85 ? "bg-success text-success-foreground" : ""}
              >
                {Math.round(response.confidenceScore * 100)}% confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[120px]"
              />
            ) : (
              <p className="text-sm leading-relaxed rounded-lg bg-accent/50 p-3 border">
                {editText || response.text}
              </p>
            )}

            {/* Evaluator scores */}
            <div className="grid grid-cols-2 gap-3">
              {evaluatorItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <item.icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium">{Math.round(item.score * 100)}%</span>
                  </div>
                  <Progress value={item.score * 100} className="h-1.5" />
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {!editing ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAction("approve")}
                    disabled={review.status === "approved" || review.status === "posted"}
                    className="bg-success hover:bg-success/90"
                  >
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Edit3 className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction("reject")}
                    disabled={review.status === "rejected"}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" /> Reject
                  </Button>
                  {/* Fix: Regenerate now does something */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
                    {regenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => { setEditing(false); handleAction("approve"); }}
                    className="bg-success hover:bg-success/90"
                  >
                    <Check className="h-3 w-3" /> Save & Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">
                Version {response.version} • Generated {new Date(response.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No response state */}
      {!response && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <Bot className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">No AI response generated yet</p>
            <p className="text-xs text-muted-foreground">
              Click below to generate a response using Gemini AI.
            </p>
            <Button
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Generating..." : "Generate Response"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Generation Error</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
