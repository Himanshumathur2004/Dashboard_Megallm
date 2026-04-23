// ─────────────────────────────────────────────────────────────
// Draft reply options for X tweets with engagement scoring
// Generates 3 options per tweet, scores for relevance + virality
// ─────────────────────────────────────────────────────────────

import "../shared/load-root-env.js"; // Load root .env before importing config
import { CONFIG } from "./config.js";
import { humanizeReply } from "./humanize.js";
import { readFile, writeFile, mkdir } from "fs/promises";
import { DATA_DIR, TWEETS_FILE, DRAFTS_FILE } from "./paths.js";
import { callLLMWithFallback } from "../shared/llm-fallback.js";

// ── Relevance scoring ───────────────────────────────

function scoreMegaLLMRelevance(reply, tweet) {
  let score = 0;
  const factors = [];
  const lower = reply.toLowerCase();

  // Direct mention
  if (lower.includes("megallm") || lower.includes("mega llm")) {
    score += 25;
    factors.push("direct mention");
  }

  // Mentions value props (gateway, routing, unified api, cost savings)
  if (/gateway|routing|unified api|single api|cost|optimization/i.test(lower)) {
    score += 15;
    factors.push("value prop mention");
  }

  // Dialogue/question response (high engagement)
  if (reply.includes("?") || lower.includes("why") || lower.includes("how")) {
    score += 8;
    factors.push("question format");
  }

  // Personal experience/insight (more credible)
  if (/tried|used|built|worked with/i.test(lower)) {
    score += 10;
    factors.push("personal experience");
  }

  // Competitive mention (OpenRouter, LiteLLM, Portkey, etc.)
  if (/openrouter|litellm|portkey|helicone|martian/i.test(lower)) {
    score += 12;
    factors.push("competitor mention");
  }

  return {
    score: Math.max(0, score),
    factors,
  };
}

// ── Engagement potential ───────────────────────────────

function detectEngagementPotential(tweet) {
  let score = 0;
  const reasons = [];

  // High engagement ratio
  if (tweet.replies > 0 && tweet.likes > 0) {
    const engagementRate = tweet.replies / tweet.likes;
    if (engagementRate > 0.5) {
      score += 3;
      reasons.push("high discussion");
    }
  }

  // Already trending (high likes)
  if (tweet.likes > 100) {
    score += 3;
    reasons.push("viral potential");
  } else if (tweet.likes > 20) {
    score += 1;
    reasons.push("gaining traction");
  }

  // Author influence
  if (tweet.authorVerified) {
    score += 2;
    reasons.push("verified author");
  }

  // Question tweets get more replies
  if (tweet.text.includes("?")) {
    score += 2;
    reasons.push("question format");
  }

  const level = score >= 5 ? "high" : score >= 2 ? "medium" : "low";
  return { score, level, reasons };
}

async function draftReplyOptions(tweet) {
  if (!CONFIG.apiKey) {
    throw new Error("MEGALLM_API_KEY not configured");
  }

  const engagement = detectEngagementPotential(tweet);

  const systemPrompt = `You are a helpful contributor on X (Twitter). Reply to tweets in a natural, conversational way.
Rule: Return ONLY valid JSON with 3 reply options. No markdown, no explanation.`;

  const userPrompt = `Generate 3 different reply options for this tweet (each under 280 characters, natural language):

Tweet: "${tweet.text}"
Author: @${tweet.authorUsername}
Context: ${tweet.topReplies.length > 0 ? tweet.topReplies.map((r) => `• @${r.author}: "${r.text}"`).join("\n") : "(no replies yet)"}

Guidelines:
- Keep it under 280 characters (fits on X)
- Be natural and conversational
- Avoid corporate/AI-sounding language
- ${CONFIG.replies.avoid.map((phrase) => `Don't say "${phrase}"`).join("; ")}

Return valid JSON ONLY:
{
  "options": [
    { "text": "...", "type": "question|insight|agreement" },
    { "text": "...", "type": "question|insight|agreement" },
    { "text": "...", "type": "question|insight|agreement" }
  ]
}`;

  // Use fallback-aware LLM call
  try {
    const text = await callLLMWithFallback(CONFIG, systemPrompt, userPrompt, {
      maxTokens: 500,
      temperature: 0.7,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(`No JSON in response for tweet ${tweet.id}`);
      return [];
    }

    const data = JSON.parse(jsonMatch[0]);
    return data.options || [];
  } catch (err) {
    console.error(`Failed to draft replies for ${tweet.id}: ${err.message}`);
    return [];
  }
}

// Progress callback type: (progress, draft) => void
// progress = { current: number, total: number, tweetId: string, status: string }
// draft = the newly created draft object (null if not yet available)

export async function draftComments(onProgress = null) {
  if (!CONFIG.apiKey) throw new Error("MEGALLM_API_KEY not set in .env");
  await mkdir(DATA_DIR, { recursive: true });

  console.log(`\nDrafting reply options for tweets...\n`);
  console.log(`⚠️  This will take ~2-3 minutes (respecting API rate limits)\n`);

  const tweetsData = await readFile(TWEETS_FILE, "utf8");
  const tweets = JSON.parse(tweetsData);

  const drafts = [];

  // Load existing drafts to preserve them
  let existingDrafts = [];
  try {
    existingDrafts = JSON.parse(await readFile(DRAFTS_FILE, "utf8"));
  } catch {
    existingDrafts = [];
  }

  const maxTweets = Math.min(tweets.length, 15);

  for (let i = 0; i < maxTweets; i++) {
    const tweet = tweets[i];
    const engagement = detectEngagementPotential(tweet);

    // Report progress: starting this tweet
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: maxTweets,
        tweetId: tweet.id,
        authorUsername: tweet.authorUsername,
        status: "processing"
      }, null);
    }

    console.log(
      `  [${i + 1}/${maxTweets}] @${tweet.authorUsername} (${tweet.likes}❤, ${engagement.level} engagement)`
    );

    const options = await draftReplyOptions(tweet);

    const tweetDrafts = [];
    for (const option of options) {
      const humanized = humanizeReply(option.text);
      const relevance = scoreMegaLLMRelevance(humanized, tweet);

      const draft = {
        id: `draft-${tweet.id}-${Date.now()}`,
        tweetId: tweet.id,
        tweetText: tweet.text.slice(0, 200),
        authorUsername: tweet.authorUsername,
        replyText: humanized,
        replyType: option.type,
        megallmScore: relevance.score,
        engagementLevel: engagement.level,
        url: tweet.url,
        status: "draft",
        createdAt: new Date().toISOString(),
      };
      drafts.push(draft);
      tweetDrafts.push(draft);
    }

    // Save drafts incrementally after each tweet
    const allDrafts = [...existingDrafts, ...drafts];
    await writeFile(DRAFTS_FILE, JSON.stringify(allDrafts, null, 2));

    // Report progress: finished this tweet, include new drafts
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: maxTweets,
        tweetId: tweet.id,
        authorUsername: tweet.authorUsername,
        status: "completed"
      }, tweetDrafts);
    }

    // Rate limit: wait between tweets (configurable)
    if (i < maxTweets - 1) {
      await new Promise((r) => setTimeout(r, CONFIG.rateLimiting.delayBetweenTweetsMs));
    }
  }

  console.log(`\n✓ Drafted ${drafts.length} reply options to ${DRAFTS_FILE}\n`);
  return drafts;
}

// Run directly
if (process.argv[1]?.includes("draft-comments")) {
  draftComments().catch(console.error);
}
