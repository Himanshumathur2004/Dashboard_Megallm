// ─────────────────────────────────────────────────────────────
// X (Twitter) Assistant Configuration
// Uses Chutes API (https://chutes.ai/app)
// ─────────────────────────────────────────────────────────────

import "./load-env.js"; // Load .env before reading environment variables
import { getAllSearchQueries, getFilters } from "./orchestration.js";

export const CONFIG = {
  // Chutes API (for drafting replies)
  apiKey: process.env.MEGALLM_API_KEY,
  apiBaseUrl: process.env.MEGALLM_BASE_URL,
  model: process.env.MODEL, // Fast, capable model from Chutes

  // Fallback configuration (when primary model is overloaded/unavailable)
  fallback: {
    apiKey: process.env.MEGALLM_FALLBACK_KEY || process.env.MEGALLM_API_KEY,
    baseUrl: process.env.MEGALLM_FALLBACK_BASE_URL || process.env.MEGALLM_BASE_URL,
    model: process.env.MEGALLM_FALLBACK_MODEL || "meta-llama/Llama-3.1-8B-Instruct",
  },

  // Alternative models available on Chutes:
  // - "deepseek-ai/DeepSeek-R1": Advanced reasoning (for complex analysis)
  // - "unsloth/Llama-3.2-1B-Instruct": Lightweight, fast
  // - "meta-llama/Llama-3.1-70B": High capability
  // - "mistralai/Mistral-7B-Instruct": Good balance of speed/quality
  // - "deepseek-ai/deepseek-coder-6.7b-instruct": Code-focused replies

  product: {
    name: "MegaLLM",
    description: "Unified LLM API gateway — one API for 70+ AI models",
    url: "https://megallm.io",
    mentionRate: 0.1,
  },

  // X Scraper API
  xScraperApiKey: process.env.X_SCRAPER_API_KEY || "",
  xScraperApiUrl: process.env.X_SCRAPER_API_URL || "https://api.xscraper.io",

  // Tweet fetching - using smart orchestration
  tweets: {
    // Enhanced queries with advanced Twitter search operators
    // Format: "topic -filter:nativeretweets min_faves:5 -filter:videos filter:safe lang:en since:YYYY-MM-DD"
    // NOTE: Update 'since' date to last 7 days for recent tweets
    searchQueries: [
      "llm api gateway -filter:nativeretweets min_faves:1 filter:safe lang:en since:2026-03-30",
      "unified llm api -filter:videos filter:safe lang:en since:2026-03-30",
      "llm routing min_faves:1 -filter:nativeretweets lang:en since:2026-03-30",
      "groq api llm -filter:nativeretweets lang:en since:2026-03-30",
      "api gateway alternative -filter:videos lang:en since:2026-03-30",
      "ai agents llm -filter:nativeretweets lang:en since:2026-03-30",
      "machine learning api lang:en since:2026-03-30",
      "python programming lang:en since:2026-03-30",
      "web development lang:en since:2026-03-30",
      "devops automation lang:en since:2026-03-30",
    ],
    maxResults: 25,                        // per query - increased from 4
    minLikes: 1,                           // Quality filter: minimum 1 like - increased from 5
    minReplies: 0,                         // Get all tweets with engagement
  },
  
  // Rate limiting configuration for API calls
  rateLimiting: {
    backoffMultiplier: 2,                  // Exponential: 15s → 30s → 60s
    initialWaitMs: 15000,                  // Start with 15s on first rate limit
    maxRetries: 3,                         // Max attempts before giving up
    delayBetweenTweetsMs: 8000,           // Delay between processing tweets (prevents hammering API)
  },

  // Reply drafting rules
  replies: {
    maxPerDay: 6,              // don't over-reply
    minWords: 10,               // short replies are okay on X
    maxWords: 280,              // X limit is 280 chars
    tone: "casual x reader — conversational, witty if appropriate",
    avoid: [
      "As an AI",
      "I'd be happy to",
      "Great question!",
      "Absolutely!",
      "It's worth noting",
      "Here's the thing",
      "That being said",
      "Let me explain",
      "The key here is",
      "To be fair",
      "As a developer",
    ],
  },

  // Server
  port: parseInt(process.env.X_ASSISTANT_PORT || process.env.PORT || "3459", 10),
};

export function validateXScraperApi() {
  // API key optional for local development
  if (!CONFIG.xScraperApiUrl) {
    throw new Error("X_SCRAPER_API_URL not configured");
  }
}

export function validateLlm() {
  if (!CONFIG.apiKey) {
    throw new Error("MEGALLM_API_KEY not configured for drafting");
  }
}
