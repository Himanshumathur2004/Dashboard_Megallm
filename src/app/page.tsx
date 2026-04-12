"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] animate-pulse rounded-full bg-cyan-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-purple-500/15 blur-[120px]" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/3 bottom-0 h-[400px] w-[400px] animate-pulse rounded-full bg-emerald-500/10 blur-[100px]" style={{ animationDelay: "2s" }} />
        <div className="absolute right-1/4 top-0 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[80px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
            <span className="text-lg">⚡</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">MegaLLM</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500">
            <span className="h-1 w-1 animate-ping rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs text-[var(--muted)]">System Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex min-h-[75vh] w-full max-w-6xl flex-col items-center justify-center px-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="text-xs font-medium text-[var(--muted)]">AI-Powered Content Generation</span>
        </div>

        <h1 className="mb-6 text-center text-5xl font-black leading-tight tracking-tight sm:text-6xl md:text-7xl">
          <span className="block">Content Generation</span>
          <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Command Center
          </span>
        </h1>

        <p className="mb-12 max-w-2xl text-center text-lg text-[var(--muted)]">
          Unified dashboard for creating AI-powered content. Generate blogs, social comments, and more — all from one place.
        </p>

        {/* Two Main Cards */}
        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {/* Blog Card */}
          <a
            href="http://localhost:5000"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--background)] p-8 transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_0_50px_-15px_rgba(6,182,212,0.3)]"
          >
            {/* Card glow effect */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-[60px]" />
            </div>

            <div className="relative z-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 transition-transform duration-500 group-hover:scale-110">
                <span className="text-4xl">📝</span>
              </div>

              <h2 className="mb-2 text-2xl font-bold">Generate Blogs</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">
                Create AI-powered blog posts for Medium, Quora, Dev.to, Tumblr, Blogger and more platforms.
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                {["Medium", "Quora", "Dev.to", "Tumblr"].map((platform) => (
                  <span key={platform} className="rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
                    {platform}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-cyan-400 transition-transform duration-300 group-hover:translate-x-1">
                <span className="font-semibold">Open Dashboard</span>
                <span>→</span>
              </div>
            </div>
          </a>

          {/* Comments Card */}
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--background)] p-8 transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_0_50px_-15px_rgba(16,185,129,0.3)]"
          >
            {/* Card glow effect */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-[60px]" />
            </div>

            <div className="relative z-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 transition-transform duration-500 group-hover:scale-110">
                <span className="text-4xl">💬</span>
              </div>

              <h2 className="mb-2 text-2xl font-bold">Generate Comments</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">
                Create engaging comments and social media content for X, LinkedIn, Reddit, and Hacker News.
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                {["X (Twitter)", "LinkedIn", "Reddit", "Hacker News"].map((platform) => (
                  <span key={platform} className="rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
                    {platform}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-emerald-400 transition-transform duration-300 group-hover:translate-x-1">
                <span className="font-semibold">Open Dashboard</span>
                <span>→</span>
              </div>
            </div>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 absolute bottom-0 w-full border-t border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <p className="text-sm text-[var(--muted)]">
            <span className="gradient-text font-semibold">MegaLLM</span> — Intelligence. Innovation. Impact.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--muted)]">v2.0</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-[var(--muted)]">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}