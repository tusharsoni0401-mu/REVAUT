export type Sentiment = "positive" | "neutral" | "negative";
export type ReviewStatus = "pending" | "approved" | "posted" | "rejected";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export const PLATFORMS = ["google", "tripadvisor"] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface Location {
  id: string;
  name: string;
  address: string;
  cuisineType: string;
  gbpConnected: boolean;
}

export const locations: Location[] = [
  { id: "loc-1", name: "La Bella Italia", address: "123 Main Street, New York, NY 10001", cuisineType: "italian", gbpConnected: false },
  { id: "loc-2", name: "La Bella Italia - Brooklyn", address: "456 Court Street, Brooklyn, NY 11231", cuisineType: "italian", gbpConnected: false },
  { id: "loc-3", name: "La Bella Italia - Queens", address: "789 Queens Blvd, Queens, NY 11375", cuisineType: "italian", gbpConnected: false },
];

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  sentiment: Sentiment;
  platform: Platform;
  status: ReviewStatus;
  topics: string[];
  priority: Priority;
  isBackfill?: boolean;
  locationId: string;
}

export interface AIResponse {
  id: string;
  reviewId: string;
  text: string;
  confidenceScore: number;
  evaluatorScores: {
    brandVoice: number;
    specificity: number;
    safety: number;
    length: number;
  };
  version: number;
  createdAt: string;
}

export interface InsightAlert {
  id: string;
  type: "velocity" | "trend" | "impact";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
  date: string;
}

const authors = [
  "Sarah M.", "James P.", "Maria G.", "David K.", "Emily R.",
  "Michael B.", "Lisa T.", "Robert W.", "Jennifer L.", "Chris H.",
  "Anna S.", "Tom D.", "Rachel F.", "Kevin N.", "Sophie C.",
  "Daniel A.", "Katie O.", "Brian J.", "Nicole V.", "Alex Z.",
  "Patricia Q.", "George U.", "Hannah I.", "Steven Y.", "Megan X.",
];

const positiveReviews = [
  "Absolutely fantastic dining experience! The pasta was cooked to perfection and the service was impeccable. Will definitely be coming back.",
  "Best Italian restaurant in the area hands down. The tiramisu is to die for and the atmosphere is so warm and inviting.",
  "We celebrated our anniversary here and it was magical. The staff went above and beyond to make it special. The wine pairing was excellent.",
  "The new seasonal menu is incredible. Every dish was beautifully presented and bursting with flavor. Chef deserves all the praise!",
  "Quick service, amazing food, and reasonable prices. The margherita pizza here rivals anything I've had in Naples. Highly recommend!",
  "Brought my family here for Sunday brunch and everyone loved it. The kids menu is thoughtful and the portions are generous.",
  "The ambience is perfect for a date night. Candlelit tables, soft music, and the food quality matches the atmosphere perfectly.",
  "I'm a regular here and the consistency is what keeps me coming back. Never had a bad meal. Staff remembers my name!",
  "Outstanding seafood risotto - possibly the best I've ever had. The ingredients are clearly fresh and locally sourced.",
  "The outdoor patio is beautiful in summer. Great cocktails, excellent appetizers, and the main courses never disappoint.",
  "Visited for the first time and was blown away. The truffle pasta alone is worth the trip. Already planning my next visit.",
  "Exceptional service from start to finish. Our waiter recommended the special and it was the highlight of our evening.",
  "The gluten-free options here are actually delicious, not just an afterthought. So grateful for a restaurant that cares about dietary needs.",
  "Perfect spot for business dinners. Professional service, quiet enough for conversation, and the food impresses every client I bring.",
  "Love the new weekend brunch menu! The eggs benedict with homemade hollandaise is heavenly. Great coffee too.",
];

const neutralReviews = [
  "Food was decent but nothing extraordinary. The pasta was good but I've had better at similar price points in the area.",
  "Nice atmosphere but the wait time was longer than expected. The food was fine when it arrived. Might give it another try.",
  "Good portion sizes and reasonable prices. The appetizers were better than the mains in my opinion. Service was adequate.",
  "It's a solid neighborhood restaurant. Not the best I've been to, but certainly not bad. The desserts were the highlight.",
  "Mixed experience - the food quality was good but the noise level was quite high. Hard to have a conversation during peak hours.",
  "Standard Italian fare done competently. Nothing wrong with the meal but nothing that really wowed me either. Clean restaurant though.",
  "The pizza was average, but the pasta dishes are where this place shines. Maybe I just ordered wrong. Will try again.",
  "Went for lunch and it was okay. Service was a bit slow but the waiter was friendly and apologetic about the wait.",
  "Some dishes hit, some miss. The risotto was great but the steak was overcooked. Inconsistent but has potential.",
  "Location is convenient and parking is easy. Food is reliable if not spectacular. Good for a casual weeknight dinner.",
];

const negativeReviews = [
  "Very disappointing experience. Waited 45 minutes for our food and when it arrived, the pasta was cold. Manager didn't seem to care.",
  "The quality has really gone downhill since my last visit. Overpriced for what you get. The portion sizes have shrunk noticeably.",
  "Found a hair in my salad and the staff barely apologized. The replacement took another 20 minutes. Won't be returning.",
  "Terrible service tonight. Our waiter forgot our drink order twice and seemed annoyed when we reminded him. Food was mediocre at best.",
  "The restaurant was filthy - sticky tables and dirty silverware. How does this place pass health inspections? Avoid at all costs.",
  "Reserved a table for 8pm and still had to wait 30 minutes to be seated. No apology, no explanation. The meal itself was underwhelming.",
  "Way too expensive for the quality. $28 for a pasta dish that tasted like it came from a jar. Save your money and go elsewhere.",
  "The music was so loud we couldn't hear each other. When we asked them to turn it down, they refused. Food was okay but ruined by the noise.",
  "Ordered the special on the waiter's recommendation and it was terrible. Bland, oversalted somehow at the same time. Very confused kitchen.",
  "Second visit was worse than the first. Seems like they've lost their good chef. The flavors are just not there anymore.",
];

const topicSets: string[][] = [
  ["food", "pasta"], ["service", "staff"], ["ambience", "atmosphere"],
  ["food", "pizza"], ["price", "value"], ["food", "dessert"],
  ["service", "wait-time"], ["food", "seafood"], ["ambience", "noise"],
  ["food", "freshness"], ["service", "management"], ["cleanliness"],
  ["food", "presentation"], ["drinks", "cocktails"], ["food", "portions"],
];

// Simple seeded random for deterministic mock data
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateReviews(): Review[] {
  const reviews: Review[] = [];
  // Deterministic ratings: most positive get 5, some get 4; negatives alternate 1/2
  const positiveRatings = [5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5, 5, 4, 5, 5];
  const negativeRatings = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  const allReviews = [
    ...positiveReviews.map((text, i) => ({ text, sentiment: "positive" as Sentiment, rating: positiveRatings[i] })),
    ...neutralReviews.map((text, i) => ({ text, sentiment: "neutral" as Sentiment, rating: 3 })),
    ...negativeReviews.map((text, i) => ({ text, sentiment: "negative" as Sentiment, rating: negativeRatings[i] })),
  ];

  const statuses: ReviewStatus[] = ["pending", "approved", "posted", "rejected"];
  // Deterministic days-ago values based on index
  const daysAgoValues = [1, 3, 2, 5, 7, 4, 8, 10, 6, 12, 14, 9, 15, 18, 11, 20, 22, 16, 25, 13, 28, 30, 19, 32, 35, 21, 38, 40, 24, 42, 45, 27, 48, 50, 33];

  allReviews.forEach((r, i) => {
    const daysAgo = daysAgoValues[i % daysAgoValues.length];
    const date = new Date(2026, 3, 3); // Fixed base date: April 3, 2026
    date.setDate(date.getDate() - daysAgo);
    const priority: Priority = r.rating <= 2 ? (r.rating === 1 ? "CRITICAL" : "HIGH") : r.rating === 3 ? "MEDIUM" : "LOW";

    reviews.push({
      id: `review-${i + 1}`,
      author: authors[i % authors.length],
      avatar: authors[i % authors.length].charAt(0),
      rating: r.rating,
      date: date.toISOString(),
      text: r.text,
      sentiment: r.sentiment,
      platform: PLATFORMS[i % PLATFORMS.length],
      status: i < 12 ? "pending" : statuses[i % statuses.length],
      topics: topicSets[i % topicSets.length],
      priority,
      isBackfill: daysAgo > 30,
      locationId: locations[i % locations.length].id,
    });
  });

  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const responseTemplates = {
  positive: [
    "Thank you so much for your wonderful review, {author}! We're thrilled to hear you enjoyed {topic}. Our team takes great pride in delivering exceptional experiences, and your kind words truly make our day. We look forward to welcoming you back soon!",
    "What a lovely review, {author}! It means the world to us that you appreciated {topic}. We work hard to maintain the highest standards and it's rewarding to know it shows. See you again soon!",
    "We're beaming with joy reading this, {author}! Your praise for {topic} is incredibly motivating for our entire team. Thank you for choosing us and we can't wait to serve you again!",
  ],
  neutral: [
    "Thank you for your honest feedback, {author}. We appreciate you taking the time to share your experience regarding {topic}. We're always looking to improve and your insights help us do just that. We'd love the chance to exceed your expectations next time!",
    "Hi {author}, thanks for visiting us and for your candid review about {topic}. We value this kind of feedback as it helps us grow. We hope to see you again and provide an even better experience!",
  ],
  negative: [
    "We sincerely apologize for your experience, {author}. Your feedback about {topic} is concerning and we take it very seriously. We've already addressed this with our team. Would you be willing to give us another chance? Please reach out to us directly so we can make it right.",
    "Thank you for bringing this to our attention, {author}. We're deeply sorry about the issues with {topic}. This falls below our standards and we're taking immediate corrective action. We'd appreciate the opportunity to restore your confidence in us.",
  ],
};

function generateResponses(reviews: Review[]): AIResponse[] {
  const responses: AIResponse[] = [];
  reviews.forEach((review, i) => {
    if (i > 30) return;
    const templates = responseTemplates[review.sentiment];
    const template = templates[i % templates.length];
    const topic = review.topics[0] || "your experience";
    const text = template.replace("{author}", review.author).replace("{topic}", topic);

    const baseConfidence = review.sentiment === "positive" ? 0.88 : review.sentiment === "neutral" ? 0.79 : 0.72;
    const confidence = Math.min(0.98, baseConfidence + seededRandom(i * 7 + 1) * 0.1);

    responses.push({
      id: `response-${i + 1}`,
      reviewId: review.id,
      text,
      confidenceScore: Math.round(confidence * 100) / 100,
      evaluatorScores: {
        brandVoice: Math.round((0.7 + seededRandom(i * 7 + 2) * 0.28) * 100) / 100,
        specificity: Math.round((0.6 + seededRandom(i * 7 + 3) * 0.35) * 100) / 100,
        safety: Math.round((0.85 + seededRandom(i * 7 + 4) * 0.14) * 100) / 100,
        length: Math.round((0.7 + seededRandom(i * 7 + 5) * 0.25) * 100) / 100,
      },
      version: 1,
      createdAt: new Date().toISOString(),
    });
  });
  return responses;
}

export const reviews = generateReviews();
export const aiResponses = generateResponses(reviews);

export const ratingTrendData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    avgRating: Math.round((3.8 + Math.sin(i / 5) * 0.6 + seededRandom(i * 13 + 99) * 0.4) * 10) / 10,
    reviewCount: Math.floor(2 + seededRandom(i * 17 + 101) * 6),
  };
});

export const topicComplaintData = [
  { topic: "Wait Time", count: 18, change: +5 },
  { topic: "Food Quality", count: 12, change: -2 },
  { topic: "Noise Level", count: 9, change: +3 },
  { topic: "Pricing", count: 8, change: 0 },
  { topic: "Cleanliness", count: 5, change: -1 },
  { topic: "Staff Attitude", count: 4, change: +2 },
];

export const sentimentBreakdown = [
  { name: "Positive", value: 58, fill: "hsl(var(--success))" },
  { name: "Neutral", value: 24, fill: "hsl(var(--warning))" },
  { name: "Negative", value: 18, fill: "hsl(var(--destructive))" },
];

export const insightAlerts: InsightAlert[] = [
  {
    id: "alert-1",
    type: "velocity",
    title: "Slow Service Complaints Spiking",
    description: '"Slow service" mentioned 5 times this week — up 150% from last week.',
    severity: "high",
    recommendation: "Review staffing levels during peak hours (Fri-Sun 7-9pm). Consider adding a runner or expediter.",
    date: new Date().toISOString(),
  },
  {
    id: "alert-2",
    type: "velocity",
    title: "Noise Complaints Increasing",
    description: '"Too loud" or "noisy" appeared in 3 reviews in the past 5 days.',
    severity: "medium",
    recommendation: "Consider adding sound-dampening panels or adjusting music volume after 8pm.",
    date: new Date().toISOString(),
  },
  {
    id: "alert-3",
    type: "trend",
    title: "Dessert Menu Getting Praise",
    description: "Positive mentions of desserts up 40% this month. Tiramisu mentioned 8 times.",
    severity: "low",
    recommendation: "Feature tiramisu more prominently on the menu. Consider a dessert tasting menu option.",
    date: new Date().toISOString(),
  },
  {
    id: "alert-4",
    type: "impact",
    title: "Response Rate Impact on Ratings",
    description: "Locations responding within 24h see 0.3 higher average rating than those responding later.",
    severity: "medium",
    recommendation: "Enable semi-auto mode to ensure all reviews get a response within 4 hours.",
    date: new Date().toISOString(),
  },
];

export const bestResponses = [
  { reviewId: "review-1", responseSnippet: "Thank you so much for your wonderful review...", engagementScore: 94 },
  { reviewId: "review-3", responseSnippet: "We're beaming with joy reading this...", engagementScore: 91 },
  { reviewId: "review-6", responseSnippet: "What a lovely review! It means the world...", engagementScore: 88 },
];

export const dashboardStats = {
  totalReviews: reviews.length,
  avgRating: Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10,
  responseRate: 72,
  pendingResponses: reviews.filter((r) => r.status === "pending").length,
};
