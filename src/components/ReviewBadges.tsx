import { Badge } from "@/components/ui/badge";
import type { Sentiment, Priority, ReviewStatus } from "@/data/mockData";

const sentimentColors: Record<Sentiment, string> = {
  positive: "bg-success/10 text-success border-success/20",
  neutral: "bg-warning/10 text-warning border-warning/20",
  negative: "bg-destructive/10 text-destructive border-destructive/20",
};

const priorityColors: Record<Priority, string> = {
  CRITICAL: "bg-destructive text-destructive-foreground",
  HIGH: "bg-destructive/80 text-destructive-foreground",
  MEDIUM: "bg-warning text-warning-foreground",
  LOW: "bg-muted text-muted-foreground",
};

const statusColors: Record<ReviewStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  posted: "bg-primary/10 text-primary border-primary/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <Badge variant="outline" className={sentimentColors[sentiment]}>
      {sentiment}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={priorityColors[priority]}>{priority}</Badge>;
}

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge variant="outline" className={statusColors[status]}>
      {status}
    </Badge>
  );
}
