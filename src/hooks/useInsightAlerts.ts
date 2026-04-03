import { useMemo } from "react";
import { useReviewStore } from "@/stores/useReviewStore";
import { insightAlerts as fallbackAlerts, type InsightAlert } from "@/data/mockData";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function useInsightAlerts(): InsightAlert[] {
  const reviews = useReviewStore((s) => s.reviews);

  return useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Group reviews by topic and week
    const topicsByWeek: Record<string, { thisWeek: number; lastWeek: number }> = {};

    for (const review of reviews) {
      const reviewDate = new Date(review.date);
      const weekKey = getWeekStart(reviewDate);
      const thisWeekKey = getWeekStart(thisWeekStart);
      const lastWeekKey = getWeekStart(lastWeekStart);

      for (const topic of review.topics) {
        if (!topicsByWeek[topic]) {
          topicsByWeek[topic] = { thisWeek: 0, lastWeek: 0 };
        }
        if (weekKey === thisWeekKey) {
          topicsByWeek[topic].thisWeek++;
        } else if (weekKey === lastWeekKey) {
          topicsByWeek[topic].lastWeek++;
        }
      }
    }

    // Generate velocity alerts for topics with >50% increase and count >= 3
    const dynamicAlerts: InsightAlert[] = [];
    let alertIndex = 0;

    for (const [topic, counts] of Object.entries(topicsByWeek)) {
      const { thisWeek, lastWeek } = counts;
      if (thisWeek < 3) continue;

      if (lastWeek === 0 && thisWeek >= 3) {
        // New topic appearing this week
        dynamicAlerts.push({
          id: `dynamic-alert-${alertIndex++}`,
          type: "velocity",
          title: `"${topic}" complaints emerging`,
          description: `"${topic}" mentioned ${thisWeek} times this week with no mentions last week.`,
          severity: thisWeek >= 5 ? "high" : "medium",
          recommendation: `Investigate recent "${topic}" complaints and identify root cause.`,
          date: now.toISOString(),
        });
      } else if (lastWeek > 0) {
        const increase = ((thisWeek - lastWeek) / lastWeek) * 100;
        if (increase > 50) {
          dynamicAlerts.push({
            id: `dynamic-alert-${alertIndex++}`,
            type: "velocity",
            title: `${topic} complaints spiking`,
            description: `"${topic}" mentioned ${thisWeek} times this week — up ${Math.round(increase)}% from last week (${lastWeek}).`,
            severity: increase > 100 ? "high" : "medium",
            recommendation: `Review staffing and processes related to "${topic}" during peak hours.`,
            date: now.toISOString(),
          });
        }
      }
    }

    // Check for positive trends too
    for (const [topic, counts] of Object.entries(topicsByWeek)) {
      if (counts.lastWeek >= 3 && counts.thisWeek < counts.lastWeek) {
        const decrease = ((counts.lastWeek - counts.thisWeek) / counts.lastWeek) * 100;
        if (decrease > 40) {
          dynamicAlerts.push({
            id: `dynamic-alert-${alertIndex++}`,
            type: "trend",
            title: `${topic} praise increasing`,
            description: `Positive mentions of "${topic}" up ${Math.round(decrease)}% this week.`,
            severity: "low",
            recommendation: `Feature "${topic}" more prominently in marketing. Keep up the great work!`,
            date: now.toISOString(),
          });
        }
      }
    }

    // If no dynamic alerts were generated, fall back to static ones
    return dynamicAlerts.length > 0 ? dynamicAlerts : fallbackAlerts;
  }, [reviews]);
}

export function useTopicComplaintData() {
  const reviews = useReviewStore((s) => s.reviews);

  return useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const topicCounts: Record<string, { current: number; previous: number }> = {};

    for (const review of reviews) {
      if (review.sentiment !== "negative" && review.sentiment !== "neutral") continue;

      const reviewDate = new Date(review.date);
      for (const topic of review.topics) {
        if (!topicCounts[topic]) topicCounts[topic] = { current: 0, previous: 0 };
        if (reviewDate >= oneWeekAgo) {
          topicCounts[topic].current++;
        } else if (reviewDate >= twoWeeksAgo) {
          topicCounts[topic].previous++;
        }
      }
    }

    return Object.entries(topicCounts)
      .map(([topic, counts]) => ({
        topic,
        count: counts.current + counts.previous,
        change: counts.current - counts.previous,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [reviews]);
}
