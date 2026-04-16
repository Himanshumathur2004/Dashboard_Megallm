// Bluesky assistant — public AppView API (no Bluesky login required for fetch)

export const CONFIG = {
  // Primary API (MegaLLM gateway)
  apiKey: process.env.MEGALLM_API_KEY,
  apiBaseUrl: process.env.MEGALLM_BASE_URL,
  model: process.env.MODEL || "glm-4.7",

  // Fallback models (tried in order if primary fails)
  fallbackModels: [
    process.env.MEGALLM_FALLBACK_MODEL_1 || "google-gemma-4-6b",
    process.env.MEGALLM_FALLBACK_MODEL_2 || "claude-opus-4-6b",
    process.env.MEGALLM_FALLBACK_MODEL_3 || "gpt-4o",
  ],

  // Secondary fallback provider (Chutes)
  chutes: {
    apiKey: process.env.CHUTES_API_TOKEN,
    apiBaseUrl: process.env.CHUTES_BASE_URL || "https://llm.chutes.ai/v1",
    model: process.env.CHUTES_MODEL || "deepseek-ai/DeepSeek-V3.1-TEE",
  },

  product: {
    name: "MegaLLM",
    description: "Unified LLM API gateway — one API for 70+ AI models",
    url: "https://megallm.io",
    mentionRate: 0.1,
  },

  /** Public XRPC — https://docs.bsky.app/docs/advanced-guides/api-directory */
  bsky: {
    publicApi: (process.env.BSKY_PUBLIC_API || "https://public.api.bsky.app").replace(/\/$/, ""),
    // Use a simple feed that doesn't require special handling
    feedUri:
      process.env.BSKY_FEED_URI ||
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
    feedPages: parseInt(process.env.BSKY_FEED_PAGES || "5", 10),
    pageLimit: Math.min(100, parseInt(process.env.BSKY_FEED_PAGE_LIMIT || "100", 10)),
    minLikes: parseInt(process.env.BSKY_MIN_LIKES || "0", 10),
    maxReplies: parseInt(process.env.BSKY_MAX_REPLIES || "10000", 10),
    maxPosts: parseInt(process.env.BSKY_MAX_POSTS || "35", 10),
    threadDepth: 0,  // Disable reply fetching to avoid 404 errors
    replySample: 0,  // Disable reply sampling
    requestDelayMs: parseInt(process.env.BSKY_REQUEST_DELAY_MS || "200", 10),
  },

  // Target tags / topics for relevance filtering — Expanded like Reddit
  relevanceTags: [
    // Tier 1 — AI / LLM (primary focus)
    "ai",
    "llm",
    "machinelearning",
    "deeplearning",
    "generativeai",
    "claude",
    "anthropic",
    "openai",
    "chatgpt",
    "singularity",
    "localllama",
    "langchain",
    "mlops",
    "promptengineering",
    "datasci",
    "datascience",
    "deepseek",
    "mistral",
    "gemini",
    "grok",
    "vision",
    "nlp",
    "transformers",
    // Tier 2 — Tech / Dev / Programming Languages
    "javascript",
    "typescript",
    "python",
    "rust",
    "golang",
    "java",
    "cpp",
    "csharp",
    "kotlin",
    "swift",
    "webdev",
    "devops",
    "nodejs",
    "programming",
    "coding",
    "backend",
    "frontend",
    "fullstack",
    "cloud",
    "cloudcomputing",
    "docker",
    "kubernetes",
    "terraform",
    "cicd",
    "automation",
    // Tier 3 — Frameworks & Libraries
    "react",
    "nextjs",
    "vue",
    "angular",
    "svelte",
    "django",
    "fastapi",
    "flask",
    "express",
    "nestjs",
    "springboot",
    "laravel",
    "rails",
    "tailwind",
    "bootstrap",
    // Tier 4 — Business / Startup / Product
    "saas",
    "startup",
    "entrepreneur",
    "product",
    "innovation",
    "indiehacker",
    "sideproject",
    "buildInPublic",
    "maker",
    "shipping",
    "launch",
    // Tier 5 — Infrastructure / Tools / Platforms
    "opensource",
    "github",
    "gitlab",
    "devtools",
    "api",
    "database",
    "postgres",
    "mongodb",
    "redis",
    "elasticsearch",
    "infrastructure",
    "selfhosted",
    "vpn",
    "security",
    "cryptography",
    // Tier 6 — Web3 / Blockchain / Crypto
    "web3",
    "blockchain",
    "crypto",
    "ethereum",
    "solana",
    "nft",
    "defi",
    "smartcontracts",
    // Tier 7 — Mobile & Cross-Platform
    "mobile",
    "ios",
    "android",
    "flutter",
    "crossplatform",
    "reactnative",
    // Tier 8 — Data & Analytics
    "bigdata",
    "analytics",
    "kafka",
    "spark",
    "dataengineering",
    "sql",
    "dbt",
    // Tier 9 — DevEx & Tools
    "git",
    "vscode",
    "neovim",
    "testing",
    "jest",
    "pytest",
    "debugging",
    "logging",
  ],

  comments: {
    maxPerDay: 8,
    minWords: 8,
    maxWords: 280,
    forceLowercase: true,
    tone: "casual bluesky — short lines, sincere or dry, not corporate",
    avoid: [
      "As an AI",
      "I'd be happy to",
      "Great question!",
      "Absolutely!",
      "It's worth noting",
      "Here's the thing",
      "That being said",
      "Let me explain",
      "To be fair",
    ],
  },
};

export function validateLlm() {
  if (!CONFIG.apiKey) {
    throw new Error("MEGALLM_API_KEY not configured for drafting");
  }
}
