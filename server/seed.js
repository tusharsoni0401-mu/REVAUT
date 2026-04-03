/**
 * RevAut — Database Seed Script
 *
 * Populates Supabase with the same data that's currently in mockData.ts.
 * Run once after creating the schema:
 *
 *   cd server
 *   node seed.js
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Seed data (mirrors mockData.ts exactly) ─────────────────────────

const locations = [
  { id: "loc-1", name: "La Bella Italia",           address: "123 Main Street, New York, NY 10001",   cuisine_type: "italian", gbp_connected: false },
  { id: "loc-2", name: "La Bella Italia - Brooklyn", address: "456 Court Street, Brooklyn, NY 11231",  cuisine_type: "italian", gbp_connected: false },
  { id: "loc-3", name: "La Bella Italia - Queens",   address: "789 Queens Blvd, Queens, NY 11375",     cuisine_type: "italian", gbp_connected: false },
];

function seededRandom(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
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

const topicSets = [
  ["food", "pasta"], ["service", "staff"], ["ambience", "atmosphere"],
  ["food", "pizza"], ["price", "value"], ["food", "dessert"],
  ["service", "wait-time"], ["food", "seafood"], ["ambience", "noise"],
  ["food", "freshness"], ["service", "management"], ["cleanliness"],
  ["food", "presentation"], ["drinks", "cocktails"], ["food", "portions"],
];

const PLATFORMS = ["google", "tripadvisor"];

function generateReviews() {
  const positiveRatings = [5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5, 5, 4, 5, 5];
  const negativeRatings = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  const allReviews = [
    ...positiveReviews.map((text, i) => ({ text, sentiment: "positive", rating: positiveRatings[i] })),
    ...neutralReviews.map((text)      => ({ text, sentiment: "neutral",  rating: 3 })),
    ...negativeReviews.map((text, i)  => ({ text, sentiment: "negative", rating: negativeRatings[i] })),
  ];
  const statuses = ["pending", "approved", "posted", "rejected"];
  const daysAgoValues = [1,3,2,5,7,4,8,10,6,12,14,9,15,18,11,20,22,16,25,13,28,30,19,32,35,21,38,40,24,42,45,27,48,50,33];
  const reviews = [];

  allReviews.forEach((r, i) => {
    const daysAgo = daysAgoValues[i % daysAgoValues.length];
    const date = new Date(2026, 3, 3);
    date.setDate(date.getDate() - daysAgo);
    const priority = r.rating <= 1 ? "CRITICAL" : r.rating === 2 ? "HIGH" : r.rating === 3 ? "MEDIUM" : "LOW";
    reviews.push({
      id:          `review-${i + 1}`,
      location_id: locations[i % locations.length].id,
      author:      authors[i % authors.length],
      avatar:      authors[i % authors.length].charAt(0),
      rating:      r.rating,
      date:        date.toISOString(),
      text:        r.text,
      sentiment:   r.sentiment,
      platform:    PLATFORMS[i % PLATFORMS.length],
      status:      i < 12 ? "pending" : statuses[i % statuses.length],
      topics:      topicSets[i % topicSets.length],
      priority,
      is_backfill: daysAgo > 30,
    });
  });

  return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
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

function generateResponses(reviews) {
  const responses = [];
  reviews.forEach((review, i) => {
    if (i > 30) return;
    const templates = responseTemplates[review.sentiment];
    const template = templates[i % templates.length];
    const topic = review.topics[0] || "your experience";
    const text = template.replace("{author}", review.author).replace("{topic}", topic);
    const baseConfidence = review.sentiment === "positive" ? 0.88 : review.sentiment === "neutral" ? 0.79 : 0.72;
    const confidence = Math.min(0.98, baseConfidence + seededRandom(i * 7 + 1) * 0.1);
    responses.push({
      id:               `response-${i + 1}`,
      review_id:        review.id,
      text,
      confidence_score: Math.round(confidence * 100) / 100,
      evaluator_scores: {
        brandVoice:  Math.round((0.7  + seededRandom(i * 7 + 2) * 0.28) * 100) / 100,
        specificity: Math.round((0.6  + seededRandom(i * 7 + 3) * 0.35) * 100) / 100,
        safety:      Math.round((0.85 + seededRandom(i * 7 + 4) * 0.14) * 100) / 100,
        length:      Math.round((0.7  + seededRandom(i * 7 + 5) * 0.25) * 100) / 100,
      },
      version: 1,
      created_at: new Date().toISOString(),
    });
  });
  return responses;
}

// ── Run seed ─────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding RevAut database...\n");

  // 1. Locations
  console.log("→ Inserting locations...");
  const { error: locErr } = await supabase
    .from("locations")
    .upsert(locations, { onConflict: "id" });
  if (locErr) { console.error("  locations error:", locErr.message); process.exit(1); }
  console.log(`  ✓ ${locations.length} locations`);

  // 2. Reviews
  const reviews = generateReviews();
  console.log("→ Inserting reviews...");
  const { error: revErr } = await supabase
    .from("reviews")
    .upsert(reviews, { onConflict: "id" });
  if (revErr) { console.error("  reviews error:", revErr.message); process.exit(1); }
  console.log(`  ✓ ${reviews.length} reviews`);

  // 3. AI responses
  const responses = generateResponses(reviews);
  console.log("→ Inserting AI responses...");
  const { error: resErr } = await supabase
    .from("ai_responses")
    .upsert(responses, { onConflict: "id" });
  if (resErr) { console.error("  ai_responses error:", resErr.message); process.exit(1); }
  console.log(`  ✓ ${responses.length} AI responses`);

  console.log("\nSeed complete.");
}

seed();
