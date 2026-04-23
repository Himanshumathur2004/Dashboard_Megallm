// ─────────────────────────────────────────────────────────────
// Fetch tweets from X Scraper API
// Uses X Scraper API endpoints to search and fetch tweets
// ─────────────────────────────────────────────────────────────

import "./load-env.js"; // Load .env before importing config
import { CONFIG, validateXScraperApi } from "./config.js";
import { writeFile, mkdir } from "fs/promises";
import { DATA_DIR, TWEETS_FILE } from "./paths.js";

// Detect if text is primarily English
function isEnglishText(text) {
  if (!text) return false;
  
  // Common English words
  const englishWords = /\b(the|and|or|a|an|is|are|to|for|of|in|that|this|with|from|by|about|at|be|was|were|have|has|do|does|did|can|could|will|would|should|may|might|must)\b/gi;
  
  // Script detection - reject primarily non-Latin scripts
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.length;
  const latinRatio = latinChars / totalChars;
  
  // If less than 30% Latin chars, likely not English
  if (latinRatio < 0.3) return false;
  
  // Check for common English word patterns
  const englishMatches = (text.match(englishWords) || []).length;
  
  // Consider it English if it has reasonable Latin ratio and some English words
  return latinRatio > 0.3 || englishMatches > 2;
}

function normalizeApiBaseUrl(rawBaseUrl) {
  const withoutInlineComment = String(rawBaseUrl || "").split(/\s+#/)[0];
  const value = withoutInlineComment.trim().replace(/\/+$/, "");
  if (!value) {
    throw new Error("X_SCRAPER_API_URL is empty");
  }
  // Accept values like "api.xscraper.io" by assuming https.
  if (!/^https?:\/\//i.test(value)) {
    return `https://${value}`;
  }
  return value;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTweetDate(rawDate) {
  if (!rawDate) return null;

  if (typeof rawDate === "number") {
    // X APIs may return seconds or milliseconds.
    const millis = rawDate > 1e12 ? rawDate : rawDate * 1000;
    return new Date(millis);
  }

  const cleaned = String(rawDate).replace(" · ", " ").trim();
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function computeBalancedTweetScore(tweet) {
  const likes = tweet.likes || 0;
  const replies = tweet.replies || 0;
  const retweets = tweet.retweets || 0;

  // Weighted engagement then compressed to avoid huge outlier dominance.
  const rawEngagement = likes + replies * 3 + retweets * 2;
  const engagementScore = clamp01(Math.log10(rawEngagement + 1) / 2.4);

  const created = parseTweetDate(tweet.createdAt);
  const ageHours = created
    ? (Date.now() - created.getTime()) / (1000 * 60 * 60)
    : CONFIG.tweets.recencyDays * 24;

  const halfLifeHours = CONFIG.tweets.ranking.halfLifeHours || 72;
  const recencyScore = clamp01(Math.exp((-Math.LN2 * Math.max(0, ageHours)) / halfLifeHours));

  const authorBonus = tweet.authorVerified ? 0.05 : 0;
  const weighted =
    engagementScore * CONFIG.tweets.ranking.engagementWeight +
    recencyScore * CONFIG.tweets.ranking.recencyWeight +
    authorBonus;

  return {
    balancedScore: Number(weighted.toFixed(4)),
    engagementScore: Number(engagementScore.toFixed(4)),
    recencyScore: Number(recencyScore.toFixed(4)),
    ageHours: Number(Math.max(0, ageHours).toFixed(1)),
  };
}

function getSinceDate(daysBack = 14) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

function withDynamicSince(query) {
  const sinceDate = getSinceDate(CONFIG.tweets.recencyDays || 14);
  if (/\bsince:\d{4}-\d{2}-\d{2}\b/i.test(query)) {
    return query.replace(/\bsince:\d{4}-\d{2}-\d{2}\b/gi, `since:${sinceDate}`);
  }
  return `${query} since:${sinceDate}`;
}

async function searchTweets(query, maxResults = 100) {
  const maxAttempts = 3;

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const baseUrl = normalizeApiBaseUrl(CONFIG.xScraperApiUrl);
      const url = new URL(`${baseUrl}/api/search`);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", Math.min(maxResults, 100));

      const headers = {
        "User-Agent": "XAssistant/1.0",
      };
      // Add auth header only if API key is configured
      if (CONFIG.xScraperApiKey) {
        headers.Authorization = `Bearer ${CONFIG.xScraperApiKey}`;
      }

      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`X Scraper API error: ${response.status} ${response.statusText}`);
        if (errorText) {
          console.error(`X Scraper response: ${errorText.slice(0, 500)}`);
        }

        const shouldRetry = response.status >= 500 && attempt < maxAttempts;
        if (shouldRetry) {
          const waitMs = 2000 * attempt;
          console.warn(`Retrying query in ${waitMs}ms (attempt ${attempt + 1}/${maxAttempts})...`);
          await wait(waitMs);
          continue;
        }

        return [];
      }

      const data = await response.json();
      const tweets = data.tweets || [];

      return tweets
        .filter((tweet) => {
          const likes = tweet.likes || tweet.stats?.likes || 0;
          const replies = tweet.stats?.replies || 0;
          const text = tweet.content || tweet.text || "";

          // Quality filters
          if (likes < CONFIG.tweets.minLikes) return false;
          if (replies < CONFIG.tweets.minReplies) return false;

          // Language filter - ENGLISH ONLY
          if (!isEnglishText(text)) return false;

          return true;
        })
        .map((tweet) => {
          return {
            id: tweet.id,
            text: tweet.content || "",
            authorId: tweet.username || "",
            authorUsername: tweet.username || "unknown",
            authorVerified: tweet.verified || false,
            createdAt: tweet.timestamp || new Date().toISOString(),
            likes: tweet.likes || tweet.stats?.likes || 0,
            replies: tweet.stats?.replies || 0,
            retweets: tweet.retweets || 0,
            conversationId: tweet.id,
            url: `https://x.com/${tweet.username}/status/${tweet.id}`,
            topReplies: [], // Populated by fetchReplies
          };
        });
    }

    return [];
  } catch (err) {
    console.error(`Error searching tweets for "${query}":`, err.message);
    console.error(`Full error:`, err);
    return [];
  }
}

async function fetchReplies(tweetId, maxDepth = 2) {
  try {
    const baseUrl = normalizeApiBaseUrl(CONFIG.xScraperApiUrl);
    const url = new URL(`${baseUrl}/api/status/${tweetId}`);

    const headers = {
      "User-Agent": "XAssistant/1.0",
    };
    // Add auth header only if API key is configured
    if (CONFIG.xScraperApiKey) {
      headers.Authorization = `Bearer ${CONFIG.xScraperApiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) return [];

    const data = await response.json();
    const replies = data.replies || data.in_reply_to || [];

    return replies
      .filter((t) => (t.like_count || t.likes || 0) > 0)
      .slice(0, 6)
      .map((t) => {
        return {
          text: (t.text || t.full_text || "").slice(0, 500),
          author: t.username || t.screen_name || "unknown",
          likes: t.like_count || t.likes || 0,
        };
      });
  } catch {
    return [];
  }
}

export async function fetchAllTweets() {
  validateXScraperApi();
  await mkdir(DATA_DIR, { recursive: true });

  console.log(`\nFetching tweets from X (${CONFIG.tweets.searchQueries.length} smart queries)...\n`);
  console.log(`📊 Orchestration Profile:`);
  console.log(`   • Quality Filter: min_faves:${CONFIG.tweets.minLikes}`);
  console.log(`   • Recency Window: last ${CONFIG.tweets.recencyDays} days`);
  console.log(
    `   • Ranking Mix: ${Math.round(CONFIG.tweets.ranking.engagementWeight * 100)}% engagement, ${Math.round(CONFIG.tweets.ranking.recencyWeight * 100)}% recency`
  );
  console.log(`   • Expected Result: 50-70 high-quality tweets`);
  console.log(`   • Fetching Comments: Yes\n`);

  const allTweetsById = new Map();

  for (let i = 0; i < CONFIG.tweets.searchQueries.length; i++) {
    const query = withDynamicSince(CONFIG.tweets.searchQueries[i]);
    console.log(`  [${i + 1}/${CONFIG.tweets.searchQueries.length}] Searching: "${query}"`);
    const tweets = await searchTweets(query, CONFIG.tweets.maxResults);

    // Fetch replies/comments for each tweet
    for (const tweet of tweets) {
      console.log(`    • ${tweet.authorUsername}: ${tweet.text.slice(0, 60)}... (${tweet.likes}❤ ${tweet.replies}💬)`);
      tweet.topReplies = await fetchReplies(tweet.id);
      // Rate limit between reply fetches
      await new Promise((r) => setTimeout(r, 500));
    }

    if (tweets.length === 0) {
      console.log(`    (0 tweets - API may be rate-limited or no matches)`);
    }

    for (const tweet of tweets) {
      const existing = allTweetsById.get(tweet.id);
      if (!existing || (tweet.likes || 0) > (existing.likes || 0)) {
        allTweetsById.set(tweet.id, tweet);
      }
    }
    
    // Minimal delay between queries for fast testing
    if (i < CONFIG.tweets.searchQueries.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const allTweets = Array.from(allTweetsById.values())
    .map((tweet) => {
      const scores = computeBalancedTweetScore(tweet);
      return {
        ...tweet,
        ...scores,
      };
    })
    .sort((a, b) => b.balancedScore - a.balancedScore)
    .slice(0, CONFIG.tweets.ranking.maxTweetsToKeep || 80);

  await writeFile(TWEETS_FILE, JSON.stringify(allTweets, null, 2));
  console.log(`\n✅ Orchestration Complete`);
  console.log(`   Saved ${allTweets.length} balanced (recent + high-engagement) tweets with comments`);
  console.log(`   File: ${TWEETS_FILE}\n`);
  return allTweets;
}

// Run directly
if (process.argv[1]?.includes("fetch-tweets")) {
  fetchAllTweets().catch(console.error);
}
