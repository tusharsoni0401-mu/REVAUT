import { Star } from "lucide-react";

export function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}
