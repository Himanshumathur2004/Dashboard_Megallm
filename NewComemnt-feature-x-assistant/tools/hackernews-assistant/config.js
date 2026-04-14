// ─────────────────────────────────────────────────────────────
// Hacker News assistant — ESM (fetch stories + draft comments via MegaLLM)
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  apiKey: process.env.MEGALLM_API_KEY,
  apiBaseUrl: process.env.MEGALLM_BASE_URL,
  model: process.env.MODEL,

  // Fallback configuration (when primary model is overloaded/unavailable)
  fallback: {
    apiKey: process.env.MEGALLM_FALLBACK_KEY || process.env.MEGALLM_API_KEY,
    baseUrl: process.env.MEGALLM_FALLBACK_BASE_URL || process.env.MEGALLM_BASE_URL,
    model: process.env.MEGALLM_FALLBACK_MODEL,
  },

  product: {
    name: "MegaLLM",
    description: "Unified LLM API gateway — one API for 70+ AI models",
    url: "https://megallm.io",
    mentionRate: 0.1,
  },

  /** Official HN Firebase API — no key required */
  hn: {
    list: process.env.HN_LIST || "top",
    idFetchLimit: parseInt(process.env.HN_ID_FETCH_LIMIT || "80", 10),
    minScore: parseInt(process.env.HN_MIN_SCORE || "8", 10),
    maxComments: parseInt(process.env.HN_MAX_COMMENTS || "500", 10),
    maxStories: parseInt(process.env.HN_MAX_STORIES || "30", 10),
    topLevelCommentSample: 6,
    requestDelayMs: 90,
    // Topic keywords to filter for (AI/LLM focus)
    topicKeywords: [
      // AI/LLM keywords
      "ai", "llm", "machine learning", "ml", "deep learning", "neural",
      "gpt", "claude", "gemini", "mistral", "model", "language model",
      "generative", "transformer", "lora", "fine-tuning", "inference",
      "embedding", "vector", "rag", "retrieval", "semantic",
      // LLM Applications
      "chatbot", "chat", "agent", "autonomous", "reasoning",
      "prompt", "prompting", "few-shot", "chain-of-thought",
      // LLM Services/Tools
      "openai", "anthropic", "google", "openrouter", "groq", "together",
      "huggingface", "replicate", "modal", "together ai", "colab",
      // Infrastructure
      "gpu", "cuda", "vram", "quantization", "optimiz", "caching",
      "distributed", "parallel", "inference engine", "mlops",
    ],
    // Set to true to ONLY fetch topic-related stories (strict mode)
    strictTopicFilter: process.env.HN_STRICT_TOPIC || "false" === "true",
  },

  comments: {
    maxPerDay: 8,
    minWords: 12,
    maxWords: 85,
    forceLowercase: true,
    tone: "curious hn reader — concise, technical, slightly skeptical",
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

  port: parseInt(process.env.HN_ASSISTANT_PORT || process.env.PORT || "3458", 10),
};

export function validateLlm() {
  if (!CONFIG.apiKey) {
    throw new Error("MEGALLM_API_KEY not configured for drafting");
  }
}
