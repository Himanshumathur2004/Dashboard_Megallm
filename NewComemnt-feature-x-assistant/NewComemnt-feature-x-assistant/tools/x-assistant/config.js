// ─────────────────────────────────────────────────────────────
// X (Twitter) Assistant Configuration
// Uses Chutes API (https://chutes.ai/app) with MegaLLM fallbacks
// ─────────────────────────────────────────────────────────────

import "./load-env.js"; // Load .env before reading environment variables
import { getAllSearchQueries, getFilters } from "./orchestration.js";

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

  // X Scraper API
  xScraperApiKey: process.env.X_SCRAPER_API_KEY || "",
  xScraperApiUrl: process.env.X_SCRAPER_API_URL || "https://api.xscraper.io",

  // Tweet fetching - using smart orchestration
  tweets: {
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
    maxResults: 25,
    minLikes: 1,
    minReplies: 0,
    recencyDays: 14,
    ranking: {
      recencyWeight: 0.45,
      engagementWeight: 0.55,
      halfLifeHours: 72,
      maxTweetsToKeep: 80,
    },
  },

  // Rate limiting configuration for API calls
  rateLimiting: {
    backoffMultiplier: 2,
    initialWaitMs: 15000,
    maxRetries: 3,
    delayBetweenTweetsMs: 8000,
  },

  // Reply drafting rules
  replies: {
    maxPerDay: 6,
    minWords: 10,
    maxWords: 280,
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
  if (!CONFIG.xScraperApiUrl) {
    throw new Error("X_SCRAPER_API_URL not configured");
  }
}

export function validateLlm() {
  if (!CONFIG.apiKey) {
    throw new Error("MEGALLM_API_KEY not configured for drafting");
  }
}