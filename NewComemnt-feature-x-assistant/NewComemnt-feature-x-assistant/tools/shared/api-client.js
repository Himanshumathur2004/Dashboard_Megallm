// ─────────────────────────────────────────────────────────────
// Shared API Client with Fallback Support
// Handles LLM API calls with automatic fallback to secondary key/model
// ─────────────────────────────────────────────────────────────

/**
 * Call LLM API with fallback support
 * @param {Object} options - Configuration object
 * @param {string} options.apiKey - Primary API key
 * @param {string} options.baseUrl - API base URL
 * @param {string} options.model - Primary model
 * @param {string} options.fallbackKey - Fallback API key (optional)
 * @param {string} options.fallbackModel - Fallback model (optional)
 * @param {Array} options.messages - Messages array
 * @param {number} options.maxTokens - Max tokens (default: 500)
 * @param {number} options.temperature - Temperature (default: 0.7)
 * @returns {Promise<Object>} API response
 */
export async function callLLMWithFallback({
  apiKey,
  baseUrl,
  model,
  fallbackKey,
  fallbackModel,
  messages,
  maxTokens = 500,
  temperature = 0.7,
}) {
  const primaryAttempt = async () => {
    console.log(`  🔵 Trying primary: ${model}`);
    return callLLMAPI({
      apiKey,
      baseUrl,
      model,
      messages,
      maxTokens,
      temperature,
    });
  };

  const fallbackAttempt = async () => {
    if (!fallbackKey || !fallbackModel) {
      throw new Error("No fallback key/model configured");
    }
    console.log(`  🟡 Falling back to: ${fallbackModel}`);
    return callLLMAPI({
      apiKey: fallbackKey,
      baseUrl,
      model: fallbackModel,
      messages,
      maxTokens,
      temperature,
    });
  };

  try {
    return await primaryAttempt();
  } catch (primaryErr) {
    console.warn(`⚠️  Primary model failed: ${primaryErr.message}`);

    if (fallbackKey && fallbackModel) {
      try {
        return await fallbackAttempt();
      } catch (fallbackErr) {
        console.error(
          `❌ Both primary and fallback failed:\n  Primary: ${primaryErr.message}\n  Fallback: ${fallbackErr.message}`
        );
        throw new Error(
          `LLM API failed: Primary (${model}) and Fallback (${fallbackModel}) both errored`
        );
      }
    } else {
      throw primaryErr;
    }
  }
}

/**
 * Direct LLM API call without fallback
 */
async function callLLMAPI({ apiKey, baseUrl, model, messages, maxTokens, temperature }) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMsg = `HTTP ${res.status}`;

    try {
      const errorData = JSON.parse(errorText);
      errorMsg = errorData.error?.message || errorMsg;
    } catch {
      // Keep original error message
    }

    if (res.status === 401) {
      throw new Error(`Auth failed: ${errorMsg} (revoked key?)`);
    } else if (res.status === 429) {
      throw new Error(`Rate limited: ${errorMsg}`);
    } else {
      throw new Error(`API error: ${errorMsg}`);
    }
  }

  const data = await res.json();
  return data;
}
