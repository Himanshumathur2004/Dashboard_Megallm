                                                                                                                                                                                                                                                                                                                          // ─────────────────────────────────────────────────────────────
// Unified dashboard: Reddit, Dev.to, Hacker News, Bluesky
// Default login: admin@megallm.io / MegaLLM@SOCIAL (override with UNIFIED_ASSISTANT_*)
// ─────────────────────────────────────────────────────────────

import "./load-env.js";
import express from "express";
import session from "express-session";
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { DRAFTS_FILE as REDDIT_DRAFTS, POSTS_FILE as REDDIT_POSTS } from "../reddit-assistant/paths.js";
import { DRAFTS_FILE as DEVTO_DRAFTS, POSTS_FILE as DEVTO_POSTS } from "../devto-assistant/paths.js";
import { DRAFTS_FILE as HN_DRAFTS, POSTS_FILE as HN_POSTS } from "../hackernews-assistant/paths.js";
import { DRAFTS_FILE as BSKY_DRAFTS, POSTS_FILE as BSKY_POSTS } from "../bluesky-assistant/paths.js";
import { DRAFTS_FILE as X_DRAFTS, TWEETS_FILE as X_TWEETS } from "../x-assistant/paths.js";

import { fetchAllPosts } from "../reddit-assistant/fetch-posts.js";
import { draftComments as draftReddit } from "../reddit-assistant/draft-comments.js";
import { fetchAllArticles } from "../devto-assistant/fetch-articles.js";
import { draftComments as draftDevto } from "../devto-assistant/draft-comments.js";
import { fetchAllStories } from "../hackernews-assistant/fetch-stories.js";
import { draftComments as draftHn } from "../hackernews-assistant/draft-comments.js";
import { fetchBlueskyFeed } from "../bluesky-assistant/fetch-feed.js";
import { draftComments as draftBluesky } from "../bluesky-assistant/draft-comments.js";
import { fetchAllTweets } from "../x-assistant/fetch-tweets.js";
import { draftComments as draftX } from "../x-assistant/draft-comments.js";

const AUTH_USER = process.env.UNIFIED_ASSISTANT_USER ?? "admin@megallm.io";
const AUTH_PASS = process.env.UNIFIED_ASSISTANT_PASSWORD ?? "MegaLLM@SOCIAL";
const SESSION_SECRET = process.env.UNIFIED_SESSION_SECRET ?? "unified-assistant-dev-secret";
const PORT = parseInt(process.env.UNIFIED_ASSISTANT_PORT || process.env.PORT || "3500", 10);

const PLATFORMS = {
  reddit: {
    label: "Reddit",
    draftsFile: REDDIT_DRAFTS,
    postsFile: REDDIT_POSTS,
    fetch: fetchAllPosts,
    draft: draftReddit,
    fetchBtn: "Fetch posts",
    draftBtn: "Draft comments (4 / post)",
    cacheLabel: "Posts cached",
    fetchedTab: "Fetched posts",
    badge: (t) => `r/${t}`,
    pointsLabel: "pts",
  },
  devto: {
    label: "Dev.to",
    draftsFile: DEVTO_DRAFTS,
    postsFile: DEVTO_POSTS,
    fetch: fetchAllArticles,
    draft: draftDevto,
    fetchBtn: "Fetch articles",
    draftBtn: "Draft comments (4 / article)",
    cacheLabel: "Articles cached",
    fetchedTab: "Fetched articles",
    badge: (t) => `#${t}`,
    pointsLabel: "❤",
  },
  hn: {
    label: "Hacker News",
    draftsFile: HN_DRAFTS,
    postsFile: HN_POSTS,
    fetch: fetchAllStories,
    draft: draftHn,
    fetchBtn: "Fetch stories",
    draftBtn: "Draft comments (4 / thread)",
    cacheLabel: "Stories cached",
    fetchedTab: "Fetched stories",
    badge: (t) => String(t || ""),
    pointsLabel: "pts",
  },
  bluesky: {
    label: "Bluesky",
    draftsFile: BSKY_DRAFTS,
    postsFile: BSKY_POSTS,
    fetch: fetchBlueskyFeed,
    draft: draftBluesky,
    fetchBtn: "Fetch posts",
    draftBtn: "Draft replies (4 / post)",
    cacheLabel: "Posts cached",
    fetchedTab: "Fetched posts",
    badge: (t) => String(t || ""),
    pointsLabel: "♥",
  },
  x: {
    label: "X (Twitter)",
    draftsFile: X_DRAFTS,
    postsFile: X_TWEETS,
    fetch: fetchAllTweets,
    draft: draftX,
    fetchBtn: "Fetch tweets",
    draftBtn: "Draft replies (3 / tweet)",
    cacheLabel: "Tweets cached",
    fetchedTab: "Fetched tweets",
    badge: (t) => `@${t}`,
    pointsLabel: "❤",
  },
};

function normalizeCacheItem(platform, row) {
  if (platform === "reddit") {
    return {
      id: String(row.id),
      title: row.title,
      url: row.url,
      primaryTag: row.subreddit,
      ups: row.ups,
      numComments: row.numComments,
    };
  }
  if (platform === "x") {
    return {
      id: String(row.id),
      title: row.text || "",
      url: row.url || `https://x.com/${row.authorUsername}/status/${row.id}`,
      primaryTag: row.authorUsername,
      ups: row.likes || 0,
      numComments: row.replies || 0,
    };
  }
  return {
    id: String(row.id),
    title: row.title,
    url: row.url,
    primaryTag: row.primaryTag,
    ups: row.ups,
    numComments: row.numComments,
  };
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" },
  })
);

function requireAuth(req, res, next) {
  if (req.session?.ok) return next();
  if (req.path.startsWith("/api")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.redirect("/login");
}

app.get("/login", (req, res) => {
  if (req.session?.ok) return res.redirect("/");
  const err = req.query.error ? "<p class=\"err\">Invalid username or password.</p>" : "";
  res.type("html").send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;background:#0a0a0a;color:#e5e5e5}
.card{width:100%;max-width:360px;padding:28px;background:#141414;border:1px solid #333;border-radius:12px}
h1{font-size:18px;margin:0 0 6px}p.sub{font-size:13px;color:#888;margin:0 0 20px}
label{display:block;font-size:12px;color:#888;margin-bottom:4px}
input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#0d0d0d;color:#e5e5e5;margin-bottom:14px}
button{width:100%;padding:10px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer}
button:hover{background:#1d4ed8}.err{color:#f87171;font-size:13px;margin-bottom:12px}</style></head><body>
<div class="card"><h1>Engagement assistants</h1><p class="sub">Reddit · Dev.to · Hacker News · Bluesky</p>${err}
<form method="post" action="/login"><label>Email</label><input name="username" type="email" autocomplete="username" required>
<label>Password</label><input type="password" name="password" autocomplete="current-password" required>
<button type="submit">Sign in</button></form></div></body></html>`);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === AUTH_USER && password === AUTH_PASS) {
    req.session.ok = true;
    return res.redirect("/");
  }
  res.redirect("/login?error=1");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.use(requireAuth);

async function readDrafts(file) {
  try {
    return JSON.parse(await readFile(file, "utf-8"));
  } catch {
    return [];
  }
}

async function writeDrafts(file, data) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
}

for (const key of Object.keys(PLATFORMS)) {
  const p = PLATFORMS[key];

  app.get(`/api/${key}/drafts`, async (req, res) => {
    let drafts = await readDrafts(p.draftsFile);
    const status = req.query.status;
    drafts = status ? drafts.filter((d) => d.status === status) : drafts;
    
    // Normalize X/Twitter drafts to common format
    if (key === 'x') {
      drafts = drafts.map((d, i) => ({
        _i: i,
        comment: d.replyText,
        optionStyle: d.replyType,
        wordCount: (d.replyText || '').length,
        optionNumber: i + 1,
        megallmScore: d.megallmScore || 0,
        mentionsProduct: false,
        postUrl: d.url,
        status: d.status,
        postedAt: d.postedAt,
        postId: d.tweetId,
        postTitle: d.tweetText,
        postUps: d.likes || 0,
        primaryTag: d.authorUsername,
        ...d
      }));
    }
    
    res.json(drafts.map((d, i) => ({ ...d, _i: i })));
  });

  app.get(`/api/${key}/cache`, async (_req, res) => {
    try {
      const raw = await readFile(p.postsFile, "utf-8");
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : [];
      res.json({
        count: list.length,
        articles: list.map((row) => normalizeCacheItem(key, row)),
      });
    } catch {
      res.json({ count: 0, articles: [] });
    }
  });

  app.post(`/api/${key}/fetch`, async (_req, res) => {
    try {
      const n = await p.fetch();
      res.json({ ok: true, count: n.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post(`/api/${key}/draft`, async (_req, res) => {
    try {
      const d = await p.draft();
      res.json({ ok: true, count: d.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post(`/api/${key}/clear-drafts`, async (_req, res) => {
    await writeDrafts(p.draftsFile, []);
    res.json({ ok: true });
  });

  app.post(`/api/${key}/drafts/:index/posted`, async (req, res) => {
    const drafts = await readDrafts(p.draftsFile);
    const i = parseInt(req.params.index, 10);
    if (drafts[i]) {
      drafts[i].status = "posted";
      drafts[i].postedAt = new Date().toISOString();
      await writeDrafts(p.draftsFile, drafts);
    }
    res.json({ ok: true });
  });

  app.post(`/api/${key}/drafts/:index/skip`, async (req, res) => {
    const drafts = await readDrafts(p.draftsFile);
    const i = parseInt(req.params.index, 10);
    if (drafts[i]) {
      drafts[i].status = "skipped";
      await writeDrafts(p.draftsFile, drafts);
    }
    res.json({ ok: true });
  });

  app.post(`/api/${key}/drafts/:index/edit`, async (req, res) => {
    const drafts = await readDrafts(p.draftsFile);
    const i = parseInt(req.params.index, 10);
    if (drafts[i] && req.body.comment) {
      drafts[i].comment = req.body.comment;
      drafts[i].wordCount = req.body.comment.split(/\s+/).length;
      await writeDrafts(p.draftsFile, drafts);
    }
    res.json({ ok: true });
  });
}

const THEME = {
  reddit: { accent: "#ff4500", accent2: "#ff6b35", bg: "#0a0a0a" },
  devto: { accent: "#3b49df", accent2: "#5c6ef5", bg: "#0a0a0a" },
  hn: { accent: "#ff6600", accent2: "#ff8533", bg: "#0f0f0f" },
  bluesky: { accent: "#0085ff", accent2: "#4dabf7", bg: "#0a0a0a" },
  x: { accent: "#1da1f2", accent2: "#3b82f6", bg: "#0a0a0a" },
};

app.get("/", (_req, res) => {
  const themeJson = JSON.stringify(THEME);
  const platformsJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(PLATFORMS).map(([k, v]) => [
        k,
        { label: v.label, fetchBtn: v.fetchBtn, draftBtn: v.draftBtn, cacheLabel: v.cacheLabel, fetchedTab: v.fetchedTab, pointsLabel: v.pointsLabel },
      ])
    )
  );
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Engagement assistants</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:#e8e8e8;line-height:1.5;transition:background .2s}
.c{max-width:960px;margin:0 auto;padding:16px}
.header-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.header-left{display:flex;align-items:center;gap:12px}
.header-row h1{font-size:20px;margin:0}
.nav-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:12px}
.nav{display:flex;flex-wrap:wrap;gap:6px}
.nav button{padding:8px 14px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#888;font-size:13px;cursor:pointer}
.nav button.active{border-color:var(--accent);color:var(--accent);background:#1f1f1f;font-weight:600}
.nav button:hover{color:#e8e8e8}
.logout{font-size:13px;color:#888}a.logout{color:var(--accent2)}
.analytics-btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:all .2s}
.analytics-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.sub{color:#888;font-size:13px;margin-bottom:16px}
.actions{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.actions button{background:var(--accent);color:#111;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600}
.actions button:hover{filter:brightness(1.1)}button:disabled{opacity:.4;cursor:not-allowed}
.sec{background:#333;color:#eee;font-weight:500}.dan{background:#dc2626;color:#fff}.suc{background:#16a34a;color:#fff}
.stats{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.st{background:#141414;border:1px solid #2a2a2a;border-radius:8px;padding:10px 12px;flex:1;min-width:88px}
.st-v{font-size:22px;font-weight:700}.st-l{font-size:10px;color:#888;margin-top:2px;text-transform:uppercase;letter-spacing:.03em}
.tabs{display:flex;gap:0;border-bottom:1px solid #333;margin-bottom:14px;flex-wrap:wrap}
.tab{padding:8px 14px;cursor:pointer;font-size:13px;color:#888;border-bottom:2px solid transparent}
.tab:hover{color:#e8e8e8}.tab.active{color:var(--accent2);border-bottom-color:var(--accent)}
.post-group{margin-bottom:20px;border:1px solid #333;border-radius:8px;overflow:hidden}
.post-header{background:#141414;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid #222}
.post-header a{color:var(--accent2);text-decoration:none;font-size:14px;font-weight:600;flex:1}
.badges{display:flex;gap:6px;align-items:center;flex-shrink:0;flex-wrap:wrap}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600}
.b-high{background:#dc262630;color:#f87171}.b-med{background:#d9770630;color:#fb923c}.b-low{background:#333;color:#888}
.b-sub{background:#2a2a2a;color:var(--accent2)}
.b-ups{background:#14532d40;color:#4ade80}
.fetch-row{padding:10px 14px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.fetch-row:hover{background:#111}
.fetch-row a{color:var(--accent2);text-decoration:none;font-weight:600;flex:1;font-size:14px}
.hint{font-size:12px;color:#888;margin:8px 0}
.load-error{font-size:12px;color:#f87171;margin:8px 0;padding:8px 12px;background:#3f1a1a40;border-radius:8px}
.fetched-panel-wrap{margin-bottom:14px}
.fetched-panel{background:#141414;border:1px solid #333;border-radius:8px;overflow:hidden}
.fetched-panel-h{padding:10px 14px;background:#0d0d0d;border-bottom:1px solid #333;font-size:13px;font-weight:600;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.fetched-panel-h span.l{color:#888;font-weight:400;font-size:12px}
.fetched-panel-body{max-height:min(300px,42vh);overflow-y:auto}
.option{padding:12px 14px;border-bottom:1px solid #222;display:flex;gap:10px;align-items:flex-start}
.option:last-child{border-bottom:none}.option:hover{background:#111}
.opt-num{background:#262626;color:#888;width:24px;height:24px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px}
.opt-body{flex:1}.opt-comment{font-size:14px;white-space:pre-wrap;margin-bottom:6px}
.opt-meta{display:flex;gap:8px;align-items:center;font-size:11px;color:#666;flex-wrap:wrap}
.score{font-weight:700}.score-high{color:#4ade80}.score-med{color:#fbbf24}.score-low{color:#888}
.opt-style{color:#a78bfa;font-size:11px}.opt-style.witty{color:#fbbf24;background:#fbbf2415;padding:1px 6px;border-radius:8px}
.opt-actions{display:flex;gap:6px;flex-shrink:0}.opt-actions button{font-size:11px;padding:4px 10px}
.copy-btn.copied{background:#16a34a}
textarea.edit{width:100%;background:#0d0d0d;border:1px solid #333;border-radius:4px;padding:8px;font-size:13px;color:#e8e8e8;font-family:inherit;resize:vertical;min-height:56px;margin:6px 0}
.empty{text-align:center;padding:36px;color:#666}
.factors{font-size:10px;color:#4ade80}
</style>
</head>
<body>
<div class="c">
<div class="header-row">
<div class="header-left">
<h1 id="pageTitle">Engagement assistants</h1>
</div>
<a class="analytics-btn" href="/analytics">Analytics</a>
</div>
<div class="nav-row">
<div class="nav" id="platformNav"></div>
<a class="logout" href="/logout">Log out</a>
</div>
<p class="sub" id="pageSub">Pick a platform, fetch, draft, then copy replies on the real site.</p>

<div class="actions">
<button onclick="doFetch()" id="fetchBtn">Fetch</button>
<button onclick="doDraft()" id="draftBtn">Draft</button>
<button class="sec" onclick="clearDrafts()">Clear drafts</button>
</div>
<div class="stats" id="stats"></div>
<div id="loadError" class="load-error" role="status"></div>
<div id="fetchedPanelWrap" class="fetched-panel-wrap"></div>
<div class="tabs">
<div class="tab active" data-tab="draft" onclick="switchTab('draft')">Drafts</div>
<div class="tab" data-tab="posted" onclick="switchTab('posted')">Posted</div>
<div class="tab" data-tab="skipped" onclick="switchTab('skipped')">Skipped</div>
<div class="tab" data-tab="fetched" onclick="switchTab('fetched')" id="fetchedTabLabel">Fetched</div>
</div>
<div id="content"></div>
</div>
<script>
const THEME=${themeJson};
const PL=${platformsJson};
let platform=localStorage.getItem('ua-platform')||'reddit';
if(!PL[platform])platform='reddit';
let tab='draft',all=[],cached=[];

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function api(p){return '/api/'+p}

function applyTheme(){
  const t=THEME[platform]||THEME.reddit;
  document.documentElement.style.setProperty('--accent',t.accent);
  document.documentElement.style.setProperty('--accent2',t.accent2);
  document.documentElement.style.setProperty('--bg',t.bg);
  const meta=PL[platform];
  document.getElementById('pageTitle').textContent=meta.label+' assistant';
  document.getElementById('fetchBtn').textContent=meta.fetchBtn;
  document.getElementById('draftBtn').textContent=meta.draftBtn;
  document.getElementById('fetchedTabLabel').textContent=meta.fetchedTab;
}

function buildNav(){
  const nav=document.getElementById('platformNav');
  nav.innerHTML=Object.keys(PL).map(function(k){
    return '<button type="button" class="'+(k===platform?'active':'')+'" data-p="'+k+'">'+esc(PL[k].label)+'</button>';
  }).join('');
  nav.querySelectorAll('button[data-p]').forEach(function(btn){
    btn.onclick=function(){
      platform=btn.getAttribute('data-p');
      localStorage.setItem('ua-platform',platform);
      nav.querySelectorAll('button').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-p')===platform)});
      tab='draft';
      document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')});
      document.querySelector('.tab[data-tab=draft]').classList.add('active');
      applyTheme();
      load();
    };
  });
}

async function load(){
  const errEl=document.getElementById('loadError');
  if(errEl)errEl.textContent='';
  try{
    const base=api(platform);
    const [dr,cr]=await Promise.all([fetch(base+'/drafts'),fetch(base+'/cache')]);
    if(dr.status===401||cr.status===401){window.location='/login';return}
    if(!dr.ok)throw new Error('drafts '+dr.status);
    if(!cr.ok)throw new Error('cache '+cr.status);
    all=await dr.json();
    const cj=await cr.json();
    cached=Array.isArray(cj.articles)?cj.articles:[];
    renderStats();
    renderFetchedPanel();
    render();
  }catch(e){
    console.error(e);
    if(errEl)errEl.textContent='Load error: '+e.message;
  }
}

function renderStats(){
  const s={draft:0,posted:0,skipped:0,highPri:0,avgScore:0};
  let scoreSum=0;
  all.forEach(function(d){s[d.status]=(s[d.status]||0)+1;if(d.viralPotential==='high')s.highPri++;scoreSum+=d.megallmScore||0});
  s.avgScore=all.length?Math.round(scoreSum/all.length):0;
  const cl=PL[platform].cacheLabel;
  const pl=PL[platform].pointsLabel;
  document.getElementById('stats').innerHTML=
    st(cl,cached.length)+st('Drafts',s.draft)+st('Posted',s.posted)+st('High pri',s.highPri)+st('Avg score',s.avgScore);
}

function st(l,v){return '<div class="st"><div class="st-v">'+v+'</div><div class="st-l">'+esc(l)+'</div></div>'}

function badgeHtml(tag){
  if(platform==='reddit')return 'r/'+esc(tag||'?');
  if(platform==='devto')return '#'+esc(tag||'?');
  if(platform==='bluesky')return '#'+esc(tag||'?');
  return esc(tag||'?');
}

function renderFetchedPanel(){
  const el=document.getElementById('fetchedPanelWrap');
  if(!el)return;
  const meta=PL[platform];
  if(!cached.length){
    el.innerHTML='<p class="hint">Nothing in cache — run <strong>'+esc(meta.fetchBtn)+'</strong> first.</p>';
    return;
  }
  const pl=meta.pointsLabel;
  const rows=cached.map(function(a){
    // Handle different data structures for different platforms
    const title = a.title || a.text; // X uses text, others use title
    const url = a.url || a.link; // Twitter uses url/link
    const tag = a.primaryTag || a.subreddit || a.authorUsername; // X uses authorUsername
    const points = a.ups || a.likes || 0; // X uses likes, others use ups
    const comments = a.numComments || a.replies || 0; // X uses replies
    
    return '<div class="fetch-row"><a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(title)+'</a>'+
      '<div class="badges" style="flex-shrink:0">'+
      '<span class="badge b-sub">'+badgeHtml(tag)+'</span>'+
      '<span class="badge b-ups">'+points+' '+esc(pl)+'</span>'+
      '<span class="badge b-low">'+comments+' cmt</span></div></div>';
  }).join('');
  el.innerHTML='<div class="fetched-panel"><div class="fetched-panel-h"><span>Cached feed</span><span class="l">data/posts.json</span><span class="badge b-ups">'+cached.length+'</span></div><div class="fetched-panel-body">'+rows+'</div></div>';
}

function render(){
  if(tab==='fetched'){renderFetched();return}
  const filtered=all.map(function(d,i){return Object.assign({},d,{_i:i})}).filter(function(d){return d.status===tab});
  if(!filtered.length){
    let msg='<div class="empty">No '+esc(tab)+' rows</div>';
    if(tab==='draft'&&cached.length){
      msg+='<p class="hint">Cache has <strong>'+cached.length+'</strong> items — run <strong>'+esc(PL[platform].draftBtn)+'</strong>.</p>';
    }
    document.getElementById('content').innerHTML=msg;
    return;
  }
  const groups={};
  filtered.forEach(function(d){
    if(!groups[d.postId])groups[d.postId]={post:d,options:[]};
    groups[d.postId].options.push(d);
  });
  document.getElementById('content').innerHTML=Object.keys(groups).map(function(k){return renderGroup(groups[k])}).join('');
}

function renderFetched(){
  if(!cached.length){
    document.getElementById('content').innerHTML='<div class="empty">Empty cache.</div>';
    return;
  }
  const pl=PL[platform].pointsLabel;
  const rows=cached.map(function(a){
    // Handle different data structures for different platforms
    const title = a.title || a.text; // X uses text, others use title
    const url = a.url || a.link; // Twitter uses url/link
    const tag = a.primaryTag || a.subreddit || a.authorUsername; // X uses authorUsername
    const points = a.ups || a.likes || 0; // X uses likes, others use ups
    const comments = a.numComments || a.replies || 0; // X uses replies
    
    return '<div class="fetch-row"><a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(title)+'</a>'+
      '<div class="badges" style="flex-shrink:0">'+
      '<span class="badge b-sub">'+badgeHtml(tag)+'</span>'+
      '<span class="badge b-ups">'+points+' '+esc(pl)+'</span>'+
      '<span class="badge b-low">'+comments+' comments</span></div></div>';
  }).join('');
  document.getElementById('content').innerHTML='<div class="post-group" style="margin-bottom:10px"><div class="post-header"><span style="font-size:12px;color:#888">'+cached.length+' cached</span></div></div>'+rows;
}

function renderGroup(g){
  const p=g.post;
  const vb=p.viralPotential==='high'?'b-high':p.viralPotential==='medium'?'b-med':'b-low';
  const vl=p.viralPotential?p.viralPotential.toUpperCase():'';
  const vr=p.viralReasons?p.viralReasons.join(', '):'';
  return '<div class="post-group"><div class="post-header">'+
    '<a href="'+esc(p.postUrl)+'" target="_blank" rel="noopener">'+esc(p.postTitle)+'</a>'+
    '<div class="badges"><span class="badge b-sub">'+badgeHtml(p.primaryTag||p.subreddit)+'</span>'+
    '<span class="badge b-ups">'+p.postUps+' '+esc(PL[platform].pointsLabel)+'</span>'+
    (vl?'<span class="badge '+vb+'">'+vl+'</span>':'')+'</div></div>'+
    (vr?'<div style="padding:4px 14px;background:#141414;font-size:10px;color:#f87171">'+esc(vr)+'</div>':'')+
    g.options.sort(function(a,b){return (b.megallmScore||0)-(a.megallmScore||0)}).map(renderOption).join('')+'</div>';
}

function renderOption(d){
  const i=d._i,sc=d.megallmScore||0;
  const scClass=sc>=40?'score-high':sc>=20?'score-med':'score-low';
  const factors=(d.megallmFactors||[]).join(', ');
  return '<div class="option" id="opt-'+i+'"><div class="opt-num">'+(d.optionNumber||'?')+'</div><div class="opt-body">'+
    '<div class="opt-comment" id="text-'+i+'">'+esc(d.comment)+'</div>'+
    '<textarea class="edit" id="edit-'+i+'" style="display:none" onblur="saveEdit('+i+')">'+esc(d.comment)+'</textarea>'+
    '<div class="opt-meta"><span class="score '+scClass+'">score: '+sc+'</span>'+
    '<span class="opt-style'+(d.isWitty?' witty':'')+'">'+esc(d.optionStyle||'')+'</span><span>'+d.wordCount+'w</span>'+
    (d.mentionsProduct?'<span style="color:#a78bfa">product</span>':'')+
    (factors?'<span class="factors">'+esc(factors)+'</span>':'')+'</div></div>'+
    '<div class="opt-actions">'+(d.status==='draft'?
    '<button class="copy-btn" onclick="copyOpen('+i+')">Copy + open</button><button class="sec" onclick="toggleEdit('+i+')">Edit</button><button class="suc" onclick="posted('+i+')">Posted</button><button class="dan" onclick="skip('+i+')">Skip</button>':
    '<span style="font-size:11px;color:#666">'+(d.postedAt?timeAgo(d.postedAt):d.status)+'</span>')+'</div></div>';
}

function timeAgo(d){const m=Math.floor((Date.now()-new Date(d))/6e4);return m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':Math.floor(m/1440)+'d ago'}

async function copyOpen(i){
  await navigator.clipboard.writeText(all[i].comment);
  const b=document.querySelector('#opt-'+i+' .copy-btn');
  if(b){b.textContent='Copied!';b.classList.add('copied');setTimeout(function(){b.textContent='Copy + open';b.classList.remove('copied')},1400)}
  window.open(all[i].postUrl,'_blank');
}
function toggleEdit(i){
  var t=document.getElementById('text-'+i),e=document.getElementById('edit-'+i);
  if(e.style.display==='none'){e.style.display='block';t.style.display='none';e.focus()}
  else{e.style.display='none';t.style.display='block'}
}
async function saveEdit(i){
  var e=document.getElementById('edit-'+i),t=document.getElementById('text-'+i);
  await fetch(api(platform)+'/drafts/'+i+'/edit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({comment:e.value})});
  all[i].comment=e.value;t.textContent=e.value;e.style.display='none';t.style.display='block';
}
async function posted(i){
  await fetch(api(platform)+'/drafts/'+i+'/posted',{method:'POST'});
  all[i].status='posted';renderStats();renderFetchedPanel();render();
}
async function skip(i){
  await fetch(api(platform)+'/drafts/'+i+'/skip',{method:'POST'});
  all[i].status='skipped';renderStats();renderFetchedPanel();render();
}
function switchTab(s){
  tab=s;
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')});
  var el=document.querySelector('.tab[data-tab="'+s+'"]');if(el)el.classList.add('active');
  render();
}
async function doFetch(){
  var b=document.getElementById('fetchBtn');b.disabled=true;b.textContent='…';
  try{
    var res=await fetch(api(platform)+'/fetch',{method:'POST'});
    var r=await res.json();
    if(!res.ok)throw new Error(r.error||'fetch failed');
    b.textContent='OK ('+r.count+')';
    await load();
    setTimeout(function(){b.textContent=PL[platform].fetchBtn;b.disabled=false},1600);
  }catch(e){
    document.getElementById('loadError').textContent=e.message||String(e);
    b.textContent=PL[platform].fetchBtn;b.disabled=false;
  }
}
var _draftPoll=null;
async function loadDraftsOnly(){
  try{
    var res=await fetch(api(platform)+'/drafts');
    if(res.status===401){window.location='/login';return}
    if(!res.ok)return;
    all=await res.json();
    renderStats();render();
  }catch(e){}
}
async function doDraft(){
  var b=document.getElementById('draftBtn');b.disabled=true;b.textContent='Generating...';
  if(_draftPoll)clearInterval(_draftPoll);
  _draftPoll=setInterval(function(){loadDraftsOnly();b.textContent='Generating... ('+all.filter(function(d){return d.status==='draft'}).length+' drafts)')},3000);
  try{
    var res=await fetch(api(platform)+'/draft',{method:'POST'});
    var r=await res.json();
    if(!res.ok)throw new Error(r.error||'draft failed');
    if(_draftPoll){clearInterval(_draftPoll);_draftPoll=null}
    b.textContent='OK ('+r.count+')';
    await load();
    setTimeout(function(){b.textContent=PL[platform].draftBtn;b.disabled=false},1600);
  }catch(e){
    if(_draftPoll){clearInterval(_draftPoll);_draftPoll=null}
    document.getElementById('loadError').textContent=e.message||String(e);
    b.textContent=PL[platform].draftBtn;b.disabled=false;
  }
}
async function clearDrafts(){
  if(!confirm('Clear all drafts for '+PL[platform].label+'?'))return;
  await fetch(api(platform)+'/clear-drafts',{method:'POST'});
  all=[];renderStats();renderFetchedPanel();render();
}
buildNav();
applyTheme();
load();
</script>
</body></html>`);
});

// ── Analytics API ────────────────────────────────────────

app.get("/api/analytics", async (_req, res) => {
  // Aggregate analytics across all platforms
  const analytics = {
    reddit: await getPlatformAnalytics("reddit", REDDIT_DRAFTS),
    devto: await getPlatformAnalytics("devto", DEVTO_DRAFTS),
    hn: await getPlatformAnalytics("hn", HN_DRAFTS),
    bluesky: await getPlatformAnalytics("bluesky", BSKY_DRAFTS),
    x: await getPlatformAnalytics("x", X_DRAFTS),
  };
  res.json(analytics);
});

app.get("/api/analytics/posted", async (_req, res) => {
  // Get all posted comments with details
  const posted = [];

  for (const p of Object.keys(PLATFORMS)) {
    const drafts = await readDrafts(PLATFORMS[p].draftsFile);
    drafts.filter(d => d.status === "posted").forEach(d => {
      posted.push({
        platform: p,
        platformLabel: PLATFORMS[p].label,
        postUrl: d.postUrl || d.url,
        postTitle: d.postTitle || d.tweetText || d.title || "Untitled",
        comment: d.comment || d.replyText || "",
        postedAt: d.postedAt,
        megallmScore: d.megallmScore || 0,
        primaryTag: d.primaryTag || d.authorUsername || d.subreddit || ""
      });
    });
  }

  // Sort by postedAt descending
  posted.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  res.json(posted);
});

async function getPlatformAnalytics(platform, draftsFile) {
  try {
    const drafts = await readDrafts(draftsFile);
    const posted = drafts.filter(d => d.status === "posted");

    // Group by date
    const byDate = {};
    posted.forEach(d => {
      const date = d.postedAt ? d.postedAt.split("T")[0] : "unknown";
      if (!byDate[date]) byDate[date] = { count: 0, scores: [] };
      byDate[date].count++;
      if (d.megallmScore) byDate[date].scores.push(d.megallmScore);
    });

    // Calculate daily stats
    const dailyStats = Object.entries(byDate)
      .filter(([date]) => date !== "unknown")
      .map(([date, data]) => ({
        date,
        posted: data.count,
        avgScore: data.scores.length ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    return {
      totalDrafts: drafts.length,
      totalPosted: posted.length,
      totalSkipped: drafts.filter(d => d.status === "skipped").length,
      avgScore: posted.length && posted.some(d => d.megallmScore)
        ? Math.round(posted.filter(d => d.megallmScore).reduce((a, b) => a + b.megallmScore, 0) / posted.filter(d => d.megallmScore).length)
        : 0,
      dailyStats
    };
  } catch {
    return { totalDrafts: 0, totalPosted: 0, totalSkipped: 0, avgScore: 0, dailyStats: [] };
  }
}

// ── Analytics Page ────────────────────────────────────────

app.get("/analytics", requireAuth, (_req, res) => {
  res.type("html").send(ANALYTICS_HTML);
});

const ANALYTICS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comments Analytics</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e8e8e8;line-height:1.5}
.c{max-width:1400px;margin:0 auto;padding:20px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.header h1{font-size:24px}
.back-btn{color:#888;font-size:14px;text-decoration:none;padding:8px 16px;background:#1a1a1a;border-radius:8px}
.back-btn:hover{color:#fff;background:#262626}
.charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.chart-box{background:#141414;border:1px solid #262626;border-radius:12px;padding:20px}
.chart-title{font-size:14px;color:#888;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.05em}
.chart-area{height:220px;position:relative}
.chart-svg{width:100%;height:100%;overflow:visible}
.bar{fill:var(--bar-color);transition:opacity .2s;cursor:pointer}
.bar:hover{opacity:.7}
.grid-line{stroke:#262626;stroke-width:1}
.axis-text{fill:#666;font-size:10px}
.line-path{fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.area-path{opacity:0.2}
.dot{cursor:pointer;transition:r .2s}
.dot:hover{r:6}
.pie-slice{cursor:pointer;transition:opacity .2s}
.pie-slice:hover{opacity:.7}
.chart-legend{display:flex;gap:12px;justify-content:center;margin-top:12px;flex-wrap:wrap}
.legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:#888}
.legend-dot{width:8px;height:8px;border-radius:50%}
.no-data{display:flex;align-items:center;justify-content:center;height:100%;color:#555;font-size:14px}
.tooltip{position:fixed;background:#1a1a1a;border:1px solid #444;padding:8px 12px;border-radius:8px;font-size:12px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,.5)}
.tooltip.show{opacity:1}
</style>
</head>
<body>
<div class="c">
<div class="header">
<h1>📊 Comments Analytics</h1>
<a class="back-btn" href="/">← Back to Dashboard</a>
</div>
<div class="charts-grid">
<div class="chart-box">
<div class="chart-title">📈 Comments Posted Over Time</div>
<div class="chart-area" id="chart1"></div>
<div class="chart-legend" id="legend1"></div>
</div>
<div class="chart-box">
<div class="chart-title">📊 Platform Distribution</div>
<div class="chart-area" id="chart2"></div>
<div class="chart-legend" id="legend2"></div>
</div>
<div class="chart-box">
<div class="chart-title">🎯 Average Score Over Time</div>
<div class="chart-area" id="chart3"></div>
<div class="chart-legend" id="legend3"></div>
</div>
<div class="chart-box">
<div class="chart-title">📅 Daily Activity (Last 14 Days)</div>
<div class="chart-area" id="chart4"></div>
<div class="chart-legend" id="legend4"></div>
</div>
</div>
<div class="posted-section">
<div class="posted-header">
<h2>📝 Posted Comments History</h2>
<div class="posted-filters">
<select id="platformFilter" onchange="filterPosted()">
<option value="all">All Platforms</option>
<option value="reddit">Reddit</option>
<option value="devto">Dev.to</option>
<option value="hn">Hacker News</option>
<option value="bluesky">Bluesky</option>
<option value="x">X (Twitter)</option>
</select>
<input type="text" id="searchInput" placeholder="Search posts..." onkeyup="filterPosted()">
</div>
</div>
<div class="posted-table" id="postedTable">
<div class="posted-loading">Loading...</div>
</div>
</div>
</div>
<div class="tooltip" id="tooltip"></div>
<script>
let data={};
const PLATFORMS=['reddit','devto','hn','bluesky','x'];
const COLORS={reddit:'#ff4500',devto:'#3b49df',hn:'#ff6600',bluesky:'#0085ff',x:'#1da1f2'};
const LABELS={reddit:'Reddit',devto:'Dev.to',hn:'Hacker News',bluesky:'Bluesky',x:'X'};

async function load(){
  try{
    const res=await fetch('/api/analytics');
    if(!res.ok)throw new Error('HTTP '+res.status);
    data=await res.json();
    renderChart1();
    renderChart2();
    renderChart3();
    renderChart4();
  }catch(e){console.error(e)}
}

// Chart 1: Comments Posted Over Time (Multi-line)
function renderChart1(){
  const el=document.getElementById('chart1');
  const w=el.clientWidth||500,h=220,pad={t:15,r:15,b:25,l:35};
  const cW=w-pad.l-pad.r,cH=h-pad.t-pad.b;

  const byDate={};
  PLATFORMS.forEach(p=>(data[p]?.dailyStats||[]).forEach(d=>{
    if(!byDate[d.date])byDate[d.date]={};
    byDate[d.date][p]=d.posted;
  }));
  const dates=Object.keys(byDate).sort().slice(-30);
  if(!dates.length){el.innerHTML='<div class="no-data">No data yet</div>';return}

  let maxV=0;
  dates.forEach(d=>PLATFORMS.forEach(p=>maxV=Math.max(maxV,byDate[d][p]||0)));
  maxV=Math.max(maxV,1);

  let svg='<svg class="chart-svg" viewBox="0 0 '+w+' '+h+'">';
  for(let i=0;i<=4;i++){
    const y=pad.t+(cH/4)*i;
    svg+='<line class="grid-line" x1="'+pad.l+'" y1="'+y+'" x2="'+(w-pad.r)+'" y2="'+y+'"/>';
    svg+='<text class="axis-text" x="'+(pad.l-5)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(maxV-(maxV/4)*i)+'</text>';
  }

  PLATFORMS.forEach(p=>{
    const pts=[];
    dates.forEach((d,i)=>{
      const v=byDate[d][p]||0;
      const x=pad.l+(cW/(dates.length-1||1))*i;
      const y=pad.t+cH-(v/maxV)*cH;
      pts.push({x,y,v});
    });
    let areaP='M'+pts[0].x+','+(pad.t+cH)+' L'+pts.map(pt=>pt.x+','+pt.y).join(' L')+' L'+pts[pts.length-1].x+','+(pad.t+cH)+' Z';
    svg+='<path class="area-path" d="'+areaP+'" fill="'+COLORS[p]+'"/>';
    let lineP='M'+pts.map(pt=>pt.x+','+pt.y).join(' L');
    svg+='<path class="line-path" d="'+lineP+'" stroke="'+COLORS[p]+'"/>';
    pts.forEach(pt=>svg+='<circle class="dot" cx="'+pt.x+'" cy="'+pt.y+'" r="3" fill="'+COLORS[p]+'" onmouseover="tt(event,\\''+LABELS[p]+': '+pt.v+'\\')" onmouseout="ht()"/>');
  });
  svg+='</svg>';
  el.innerHTML=svg;
  document.getElementById('legend1').innerHTML=PLATFORMS.map(p=>'<div class="legend-item"><div class="legend-dot" style="background:'+COLORS[p]+'"></div>'+LABELS[p]+'</div>').join('');
}

// Chart 2: Platform Distribution (Donut)
function renderChart2(){
  const el=document.getElementById('chart2');
  const w=el.clientWidth||500,h=220,cx=w/2,cy=h/2,r=70,r2=45;
  const totals=PLATFORMS.map(p=>data[p]?.totalPosted||0);
  const sum=totals.reduce((a,b)=>a+b,0);
  if(!sum){el.innerHTML='<div class="no-data">No data yet</div>';return}

  let svg='<svg class="chart-svg" viewBox="0 0 '+w+' '+h+'">';
  let angle=-90;
  totals.forEach((v,i)=>{
    if(!v)return;
    const slice=(v/sum)*360;
    const a1=angle*Math.PI/180,a2=(angle+slice)*Math.PI/180;
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
    const x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
    const large=slice>180?1:0;
    svg+='<path class="pie-slice" d="M'+cx+','+cy+' L'+x1+','+y1+' A'+r+','+r+' 0 '+large+' 1 '+x2+','+y2+' Z" fill="'+COLORS[PLATFORMS[i]]+'" onmouseover="tt(event,\\''+LABELS[PLATFORMS[i]]+': '+v+' ('+Math.round(v/sum*100)+'%)\\')" onmouseout="ht()"/>';
    angle+=slice;
  });
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r2+'" fill="#141414"/>';
  svg+='<text x="'+cx+'" y="'+(cy-5)+'" text-anchor="middle" fill="#fff" font-size="24" font-weight="700">'+sum+'</text>';
  svg+='<text x="'+cx+'" y="'+(cy+15)+'" text-anchor="middle" fill="#666" font-size="11">POSTED</text>';
  svg+='</svg>';
  el.innerHTML=svg;
  document.getElementById('legend2').innerHTML=PLATFORMS.map(p=>'<div class="legend-item"><div class="legend-dot" style="background:'+COLORS[p]+'"></div>'+LABELS[p]+': '+(data[p]?.totalPosted||0)+'</div>').join('');
}

// Chart 3: Average Score Over Time (Line)
function renderChart3(){
  const el=document.getElementById('chart3');
  const w=el.clientWidth||500,h=220,pad={t:15,r:15,b:25,l:35};
  const cW=w-pad.l-pad.r,cH=h-pad.t-pad.b;

  const byDate={};
  PLATFORMS.forEach(p=>(data[p]?.dailyStats||[]).forEach(d=>{
    if(!byDate[d.date])byDate[d.date]={sum:0,cnt:0};
    if(d.avgScore){byDate[d.date].sum+=d.avgScore;byDate[d.date].cnt++}
  }));
  const dates=Object.keys(byDate).sort().slice(-30);
  if(!dates.length){el.innerHTML='<div class="no-data">No data yet</div>';return}

  let maxV=0;
  dates.forEach(d=>{const avg=byDate[d].cnt?Math.round(byDate[d].sum/byDate[d].cnt):0;maxV=Math.max(maxV,avg)});
  maxV=Math.max(maxV,1);

  let svg='<svg class="chart-svg" viewBox="0 0 '+w+' '+h+'">';
  for(let i=0;i<=4;i++){
    const y=pad.t+(cH/4)*i;
    svg+='<line class="grid-line" x1="'+pad.l+'" y1="'+y+'" x2="'+(w-pad.r)+'" y2="'+y+'"/>';
    svg+='<text class="axis-text" x="'+(pad.l-5)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(maxV-(maxV/4)*i)+'</text>';
  }

  const pts=[];
  dates.forEach((d,i)=>{
    const v=byDate[d].cnt?Math.round(byDate[d].sum/byDate[d].cnt):0;
    const x=pad.l+(cW/(dates.length-1||1))*i;
    const y=pad.t+cH-(v/maxV)*cH;
    pts.push({x,y,v,date:d});
  });

  let areaP='M'+pts[0].x+','+(pad.t+cH)+' L'+pts.map(pt=>pt.x+','+pt.y).join(' L')+' L'+pts[pts.length-1].x+','+(pad.t+cH)+' Z';
  svg+='<path class="area-path" d="'+areaP+'" fill="#4ade80"/>';
  let lineP='M'+pts.map(pt=>pt.x+','+pt.y).join(' L');
  svg+='<path class="line-path" d="'+lineP+'" stroke="#4ade80"/>';
  pts.forEach(pt=>svg+='<circle class="dot" cx="'+pt.x+'" cy="'+pt.y+'" r="4" fill="#4ade80" onmouseover="tt(event,\\''+pt.date.slice(5)+': '+pt.v+' score\\')" onmouseout="ht()"/>');
  svg+='</svg>';
  el.innerHTML=svg;
  document.getElementById('legend3').innerHTML='<div class="legend-item"><div class="legend-dot" style="background:#4ade80"></div>Avg Score</div>';
}

// Chart 4: Daily Activity Bar Chart
function renderChart4(){
  const el=document.getElementById('chart4');
  const w=el.clientWidth||500,h=220,pad={t:15,r:15,b:25,l:35};
  const cW=w-pad.l-pad.r,cH=h-pad.t-pad.b;

  const byDate={};
  PLATFORMS.forEach(p=>(data[p]?.dailyStats||[]).forEach(d=>{
    if(!byDate[d.date])byDate[d.date]=0;
    byDate[d.date]+=d.posted;
  }));
  const dates=Object.keys(byDate).sort().slice(-14);
  if(!dates.length){el.innerHTML='<div class="no-data">No data yet</div>';return}

  let maxV=Math.max(...dates.map(d=>byDate[d]),1);
  const barW=Math.max(8,cW/dates.length-4);

  let svg='<svg class="chart-svg" viewBox="0 0 '+w+' '+h+'">';
  for(let i=0;i<=4;i++){
    const y=pad.t+(cH/4)*i;
    svg+='<line class="grid-line" x1="'+pad.l+'" y1="'+y+'" x2="'+(w-pad.r)+'" y2="'+y+'"/>';
    svg+='<text class="axis-text" x="'+(pad.l-5)+'" y="'+(y+3)+'" text-anchor="end">'+Math.round(maxV-(maxV/4)*i)+'</text>';
  }

  dates.forEach((d,i)=>{
    const v=byDate[d];
    const barH=(v/maxV)*cH;
    const x=pad.l+(cW/dates.length)*i+(cW/dates.length-barW)/2;
    const y=pad.t+cH-barH;
    svg+='<rect class="bar" x="'+x+'" y="'+y+'" width="'+barW+'" height="'+barH+'" rx="3" style="--bar-color:#6366f1" onmouseover="tt(event,\\''+d.slice(5)+': '+v+' comments\\')" onmouseout="ht()"/>';
    svg+='<text class="axis-text" x="'+(x+barW/2)+'" y="'+(h-5)+'" text-anchor="middle">'+d.slice(5)+'</text>';
  });
  svg+='</svg>';
  el.innerHTML=svg;
  document.getElementById('legend4').innerHTML='<div class="legend-item"><div class="legend-dot" style="background:#6366f1"></div>Daily Total</div>';
}

function tt(e,text){
  const tip=document.getElementById('tooltip');
  tip.textContent=text;
  tip.style.left=e.pageX+10+'px';
  tip.style.top=e.pageY-30+'px';
  tip.classList.add('show');
}
function ht(){document.getElementById('tooltip').classList.remove('show')}

load();
</script>
</body>
</html>`;

app.listen(PORT, () => {
  console.log("\n  Unified engagement assistants");
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Login: ${AUTH_USER} / (password from UNIFIED_ASSISTANT_PASSWORD or default)`);
  console.log("");
});
