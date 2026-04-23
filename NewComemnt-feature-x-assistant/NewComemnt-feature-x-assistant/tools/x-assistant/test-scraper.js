import "../shared/load-root-env.js";
import { CONFIG } from "./config.js";

function normalizeApiBaseUrl(rawBaseUrl) {
  const withoutInlineComment = String(rawBaseUrl || "").split(/\s+#/)[0];
  const value = withoutInlineComment.trim().replace(/\/+$/, "");
  if (!value) throw new Error("X_SCRAPER_API_URL is empty");
  if (!/^https?:\/\//i.test(value)) return `https://${value}`;
  return value;
}

async function runTest() {
  const baseUrl = normalizeApiBaseUrl(CONFIG.xScraperApiUrl);
  const key = String(CONFIG.xScraperApiKey || "").replace(/\s+#.*$/, "").trim();

  const headers = { "User-Agent": "XAssistant/1.0" };
  if (key) headers.Authorization = `Bearer ${key}`;

  const query = "llm api gateway lang:en";
  const searchUrl = new URL(`${baseUrl}/api/search`);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("limit", "3");

  const started = Date.now();

  const rootRes = await fetch(baseUrl, { headers: { "User-Agent": "XAssistant/1.0" } });
  const rootBody = await rootRes.text();

  const searchRes = await fetch(searchUrl.toString(), { headers });
  const searchBody = await searchRes.text();

  let tweets = [];
  try {
    tweets = JSON.parse(searchBody)?.tweets || [];
  } catch {
    tweets = [];
  }

  console.log("\nX Scraper Smoke Test");
  console.log(`BASE_URL=${baseUrl}`);
  console.log(`API_KEY_PRESENT=${key ? "yes" : "no"}`);
  console.log(`ROOT_STATUS=${rootRes.status}`);
  console.log(`SEARCH_STATUS=${searchRes.status}`);
  console.log(`LATENCY_MS=${Date.now() - started}`);
  console.log(`TWEETS_RETURNED=${tweets.length}`);

  if (tweets[0]) {
    console.log(`SAMPLE_TWEET_ID=${tweets[0].id || ""}`);
    console.log(`SAMPLE_AUTHOR=${tweets[0].username || ""}`);
  }

  if (!rootRes.ok) {
    console.log(`ROOT_BODY=${rootBody.slice(0, 300)}`);
    process.exitCode = 1;
    return;
  }

  if (!searchRes.ok) {
    console.log(`SEARCH_BODY=${searchBody.slice(0, 600)}`);
    process.exitCode = 2;
    return;
  }

  console.log("RESULT=OK");
}

runTest().catch((err) => {
  console.error(`RESULT=FAIL ${err.message}`);
  process.exit(3);
});
