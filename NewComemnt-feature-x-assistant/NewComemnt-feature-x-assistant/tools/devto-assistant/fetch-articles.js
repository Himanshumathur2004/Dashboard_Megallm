// ─────────────────────────────────────────────────────────────
// Fetch top articles from Dev.to for target tags (public API)
// ─────────────────────────────────────────────────────────────

import "./load-env.js";
import { CONFIG } from "./config.js";
import { readFile, writeFile, mkdir } from "fs/promises";
import { DATA_DIR, POSTS_FILE } from "./paths.js";

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "DevToCommentAssistant/1.0 (educational tool)",
};

function flattenComments(nodes, depth = 0, max = 5, out = []) {
  if (!nodes || !Array.isArray(nodes) || out.length >= max) return out;
  for (const c of nodes) {
    if (out.length >= max) break;
    if (c?.type_of === "comment" && c.body_markdown) {
      out.push({
        body: String(c.body_markdown).slice(0, 500),
        ups: c.public_reactions_count ?? 0,
        author: c.user?.username ?? "?",
      });
    }
    if (c.children?.length && out.length < max) {
      flattenComments(c.children, depth + 1, max, out);
    }
  }
  return out;
}

async function fetchCommentsForArticle(articleId) {
  const url = `https://dev.to/api/comments?a_id=${articleId}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    return flattenComments(list, 0, 5);
  } catch {
    return [];
  }
}

async function fetchTag(tag) {
  const { topDays, minReactions, maxComments, articlesPerTag } = CONFIG.posts;
  const perPage = Math.min(50, articlesPerTag * 3); // Fetch more to account for filtering
  
  // Use 'published' parameter to get recent articles, not 'top' (which gets trending)
  // See: https://developers.forem.com/api
  // &state=published gets published articles, &page=1 to sort by published date
  const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&page=1&per_page=${perPage}&state=published`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.error(`  ✗ #${tag}: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const posts = (Array.isArray(data) ? data : [])
      .filter((a) => {
        if (!a?.id) return false;
        const reactions = a.positive_reactions_count ?? 0;
        const cc = a.comments_count ?? 0;
        // For recent articles, be more lenient with reaction threshold
        if (reactions < Math.max(0, minReactions - 2)) return false; // Lower bar for recent
        if (cc > maxComments) return false;
        return true;
      })
      .slice(0, articlesPerTag)
      .map((a) => {
        const published = a.published_at || a.created_at;
        const ts = published ? Math.floor(new Date(published).getTime() / 1000) : Date.now() / 1000;
        const tagList = Array.isArray(a.tag_list)
          ? a.tag_list
          : typeof a.tag_list === "string"
            ? a.tag_list.split(",").map((t) => t.trim())
            : [];

        return {
          id: String(a.id),
          primaryTag: tag,
          tags: tagList,
          title: a.title || "",
          description: (a.description || "").slice(0, 2000),
          url: a.url || `https://dev.to${a.path || ""}`,
          ups: a.positive_reactions_count ?? 0,
          numComments: a.comments_count ?? 0,
          createdUtc: ts,
          isQuestion:
            String(a.title || "").includes("?") ||
            /\b(how|what|why|when|which|who)\b/i.test(a.title || ""),
        };
      });

    const filtered = (Array.isArray(data) ? data : []).length;
    const kept = posts.length;
    console.log(`  ✓ #${tag}: ${kept}/${filtered} recent articles (min reactions lowered for recency)`);
    return posts;
  } catch (err) {
    console.error(`  ✗ #${tag}: ${err.message}`);
    return [];
  }
}

export async function fetchAllArticles() {
  await mkdir(DATA_DIR, { recursive: true });

  console.log(`\n📚 Fetching RECENT articles from ${CONFIG.tags.length} tags...\n`);
  console.log(`⚙️  Settings:`);
  console.log(`   • Min reactions: ${CONFIG.posts.minReactions} (lowered for recency)`);
  console.log(`   • Max comments: ${CONFIG.posts.maxComments}`);
  console.log(`   • Per tag: ${CONFIG.posts.articlesPerTag} articles\n`);

  const allPosts = [];
  const seenIds = new Set(); // Track article IDs to avoid duplicates

  for (const tag of CONFIG.tags) {
    const posts = await fetchTag(tag);
    for (const post of posts) {
      // Skip duplicate articles (same ID across multiple tags)
      if (seenIds.has(post.id)) {
        console.log(`     (duplicate: ${post.title.slice(0, 40)}...)`);
        continue;
      }
      
      seenIds.add(post.id);
      post.topComments = await fetchCommentsForArticle(post.id);
      allPosts.push(post);
      await new Promise((r) => setTimeout(r, 800));
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Sort by newest first (for recent articles), then by engagement
  allPosts.sort((a, b) => {
    if (a.isQuestion && !b.isQuestion) return -1;
    if (!a.isQuestion && b.isQuestion) return 1;
    return b.createdUtc - a.createdUtc; // Newest first
  });

  await writeFile(POSTS_FILE, JSON.stringify(allPosts, null, 2));
  console.log(`\n✅ Saved ${allPosts.length} UNIQUE RECENT articles to ${POSTS_FILE}\n`);
  console.log(`📊 Stats: Fetched ${seenIds.size} unique articles from ${CONFIG.tags.length} tags\n`);
  return allPosts;
}

if (process.argv[1]?.includes("fetch-articles")) {
  fetchAllArticles().catch(console.error);
}
