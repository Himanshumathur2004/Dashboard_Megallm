// ─────────────────────────────────────────────────────────────
// LLM Fallback Utility - Handles model fallback chain
// Primary → Fallback Models → Chutes API
// ─────────────────────────────────────────────────────────────

/**
 * Makes an LLM API call with automatic fallback chain
 * Tries: Primary model → Fallback models → Chutes API
 *
 * @param {Object} config - Config object with apiKey, apiBaseUrl, model, fallbackModels, chutes
 * @param {string} systemPrompt - System prompt for the LLM
 * @param {string} userPrompt - User prompt for the LLM
 * @param {Object} options - Additional options (maxTokens, temperature)
 * @returns {Promise<string>} - The generated text response
 */
export async function callLLMWithFallback(config, systemPrompt, userPrompt, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;

  // Build the list of providers to try in order
  const providers = [];

  // 1. Primary MegaLLM provider with primary model
  if (config.apiKey && config.apiBaseUrl) {
    providers.push({
      name: `MegaLLM (${config.model})`,
      apiKey: config.apiKey,
      baseUrl: config.apiBaseUrl,
      model: config.model,
    });

    // 2. MegaLLM with fallback models
    if (config.fallbackModels && config.fallbackModels.length > 0) {
      for (const fallbackModel of config.fallbackModels) {
        if (fallbackModel) {
          providers.push({
            name: `MegaLLM fallback (${fallbackModel})`,
            apiKey: config.apiKey,
            baseUrl: config.apiBaseUrl,
            model: fallbackModel,
          });
        }
      }
    }
  }

  // 3. Chutes API as final fallback
  if (config.chutes?.apiKey && config.chutes?.apiBaseUrl) {
    providers.push({
      name: `Chutes (${config.chutes.model})`,
      apiKey: config.chutes.apiKey,
      baseUrl: config.chutes.apiBaseUrl,
      model: config.chutes.model,
    });
  }

  if (providers.length === 0) {
    throw new Error("No LLM API configured. Set MEGALLM_API_KEY or CHUTES_API_TOKEN.");
  }

  const errors = [];

  for (const provider of providers) {
    try {
      console.log(`  🤖 Trying ${provider.name}...`);

      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("Empty response from LLM");
      }

      console.log(`  ✓ ${provider.name} succeeded`);
      return content;

    } catch (error) {
      const errorMsg = error.message || String(error);
      errors.push(`${provider.name}: ${errorMsg}`);
      console.log(`  ✗ ${provider.name} failed: ${errorMsg.slice(0, 100)}`);

      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  const allErrors = errors.join("\n  ");
  throw new Error(`All LLM providers failed:\n  ${allErrors}`);
}

/**
 * Check if a response indicates rate limiting
 */
function isRateLimited(response) {
  return response.status === 429 ||
         response.headers?.get('x-ratelimit-remaining') === '0';
}