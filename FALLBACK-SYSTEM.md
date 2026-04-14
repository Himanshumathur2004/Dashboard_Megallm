# LLM Fallback System

## Overview

All assistants now support automatic fallback to a secondary LLM API when the primary model is overloaded or unavailable.

## Problem

When generating drafts, if the primary LLM API returns errors like:
- `503 Resource overloaded`
- `429 Rate limited`
- Connection timeouts

The system would fail instead of trying an alternative model/API.

## Solution

Implemented a shared fallback system in `tools/shared/api-client.js` that:
1. Tries the primary model first
2. Automatically falls back to a secondary model/API on failure
3. Logs which model is being used

## Configuration

Add these environment variables to `.env`:

```env
# Primary LLM (MegaLLM)
MEGALLM_API_KEY=your-primary-key
MEGALLM_BASE_URL=https://beta.megallm.io/v1
MODEL=glm-5

# Fallback LLM (Chutes API)
MEGALLM_FALLBACK_KEY=your-fallback-key
MEGALLM_FALLBACK_BASE_URL=https://llm.chutes.ai/v1
MEGALLM_FALLBACK_MODEL=deepseek-ai/DeepSeek-V3.1-TEE
```

## How It Works

```
Primary Request → Fallback Request → Success
     ↓                    ↓
   Error               Error → Final Error
```

1. **Primary attempt**: Uses `MEGALLM_API_KEY` + `MODEL`
2. **On failure (503, 429, etc.)**: Falls back to `MEGALLM_FALLBACK_KEY` + `MEGALLM_FALLBACK_MODEL`
3. **Logging**: Console shows `🔵 Trying primary: glm-5` then `🟡 Falling back to: deepseek-ai/DeepSeek-V3.1-TEE`

## Files Modified

### Shared Infrastructure
- `tools/shared/api-client.js` - Added `fallbackBaseUrl` parameter support

### Per-Assistant Configs
| Assistant | Config File |
|-----------|-------------|
| X/Twitter | `tools/x-assistant/config.js` |
| Reddit | `tools/reddit-assistant/config.js` |
| Dev.to | `tools/devto-assistant/config.js` |
| Hacker News | `tools/hackernews-assistant/config.js` |
| Bluesky | `tools/bluesky-assistant/config.js` |

### Per-Assistant Draft Scripts
All `draft-comments.js` files now use `callLLMWithFallback()` from the shared API client instead of direct `fetch()` calls.

## Usage Example

```javascript
import { callLLMWithFallback } from "../shared/api-client.js";

const result = await callLLMWithFallback({
  apiKey: CONFIG.apiKey,
  baseUrl: CONFIG.apiBaseUrl,
  model: CONFIG.model,
  fallbackKey: CONFIG.fallback?.apiKey,
  fallbackBaseUrl: CONFIG.fallback?.baseUrl,
  fallbackModel: CONFIG.fallback?.model,
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ],
  maxTokens: 500,
  temperature: 0.7,
});
```

## Testing

1. Start the unified assistant:
   ```bash
   cd E:\unified_dashboard\NewComemnt-feature-x-assistant
   npm run assistant:unified
   ```

2. Click "Draft" on any platform
3. Check console output for fallback messages:
   - `🔵 Trying primary: glm-5` - Primary attempt
   - `🟡 Falling back to: deepseek-ai/DeepSeek-V3.1-TEE` - Fallback triggered
   - `⚠️ Primary model failed: Resource overloaded` - Error that triggered fallback

## Real-Time Draft Streaming

Additionally implemented real-time draft streaming:
- Drafts now appear one-by-one as they're generated
- Frontend polls `/api/{platform}/drafts` every 3 seconds during generation
- Button shows "Generating... (X drafts)" with live count

See `PLAN.md` for implementation details.