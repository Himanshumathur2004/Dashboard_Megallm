// ─────────────────────────────────────────────────────────────
// CONFIGURATION — Edit this file before running
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  // MegaLLM API (or any OpenAI-compatible API)
  apiKey: process.env.MEGALLM_API_KEY,
  apiBaseUrl: process.env.MEGALLM_BASE_URL,
  model: process.env.MODEL,

  // Fallback configuration (when primary model is overloaded/unavailable)
  fallback: {
    apiKey: process.env.MEGALLM_FALLBACK_KEY || process.env.MEGALLM_API_KEY,
    baseUrl: process.env.MEGALLM_FALLBACK_BASE_URL || process.env.MEGALLM_BASE_URL,
    model: process.env.MEGALLM_FALLBACK_MODEL,
  },

  // Product context — what we're subtly building authority for
  product: {
    name: "MegaLLM",
    description: "Unified LLM API gateway — one API for 70+ AI models",
    url: "https://megallm.io",
    // IMPORTANT: The assistant should NOT mention the product in every comment.
    // Only mention it when genuinely relevant (maybe 1 in 10 comments).
    mentionRate: 0.1,
  },

  // Target subreddits to monitor and comment on (29 total)
  subreddits: [
    // Tier 1 — high value, large, directly relevant
    "LocalLLaMA",
    "LLMDevs",
    "MachineLearning",
    "artificial",
    "OpenAI",
    "ChatGPT",
    "singularity",
    // Tier 2 — medium, relevant, good engagement
    "ClaudeAI",
    "Anthropic",
    "ChatGPTCoding",
    "ArtificialIntelligence",
    "DataScience",
    "learnmachinelearning",
    "MLOps",
    "PromptEngineering",
    "ollama",
    // Tier 3 — business / startup / product
    "SaaS",
    "startups",
    "indiehackers",
    "SideProject",
    "Entrepreneur",
    // Tier 4 — developer / infra
    "Python",
    "webdev",
    "devops",
    "node",
    "CloudComputing",
    "LangChain",
    "selfhosted",
    "ExperiencedDevs",
  ],

  // Post filtering
  posts: {
    sort: "hot",             // "hot", "new", "top", "rising"
    timeFilter: "day",       // for "top": "hour", "day", "week", "month"
    minUpvotes: 5,           // skip low-engagement posts
    maxComments: 100,        // skip mega-threads (hard to stand out)
    postsPerSubreddit: 5,    // how many posts to pull per subreddit
  },

  // Comment drafting rules (based on analysis of 368 real top comments)
  comments: {
    maxPerDay: 8,            // don't over-comment
    minWords: 15,            // allow short punchy comments (median is 28 words)
    maxWords: 80,            // 52% of real comments are under 30 words
    forceLowercase: true,    // all output in lowercase
    tone: "casual redditor who knows their stuff",
    avoid: [
      "As an AI",
      "I'd be happy to",
      "Great question!",
      "Absolutely!",
      "It's worth noting",
      "In my experience as",
      "Here's the thing",
      "That being said",
      "Let me explain",
      "The key here is",
      "To be fair",
    ],
  },

  // Server
  port: process.env.PORT || 3456,
};
