import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import RepositoryGrid from "./RepositoryGrid";
import { Sparkles, Search, Code2 } from "lucide-react";

const metrics = [
  {
    label: "Active repositories",
    value: 4,
    detail: "Monitored in this workspace",
  },
  { label: "Agent issues", value: 12, detail: "Open review tasks" },
  { label: "Open pull requests", value: 3, detail: "Ready for final review" },
  { label: "Workspace health", value: "Stable", detail: "Mock environment" },
];

export default function Dashboard({ onSelectRepo }) {
  const [searchQuery, setSearchQuery] = useState("");

  const scrollToRepositoryGrid = () => {
    document.getElementById("repo-grid")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen w-full bg-transparent text-[#0F172A] dark:text-[#E6EDF3] flex pt-16 transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onRepositoriesClick={scrollToRepositoryGrid} />

        <main className="flex-1 px-0 py-4 overflow-y-auto">
          <section className="grid gap-5 items-start xl:grid-cols-[300px_minmax(0,1fr)]">
            {/* Left Panel - Metrics */}
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-br from-slate-50/90 to-slate-50/70 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-gradient-to-br dark:from-[#010409]/90 dark:to-[#010409]/60 dark:shadow-slate-950/20 animate-slide-in-left transition-all duration-700">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Sparkles
                  size={18}
                  className="text-[#0969DA] dark:text-[#58A6FF] animate-float"
                />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  GitHub Workflow
                </span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Workspace metrics in one place.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                Fast access to repo health, review activity, and workspace
                actions.
              </p>

              <div className="mt-5 grid gap-3">
                {metrics.map((item, idx) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 px-4 py-3 text-sm shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-gradient-to-r dark:from-slate-950/90 dark:to-slate-950/50 dark:shadow-slate-950/10 hover:shadow-md hover:shadow-slate-900/10 dark:hover:shadow-slate-950/30 transition-all duration-300 hover:border-[#0969DA]/50 dark:hover:border-[#58A6FF]/50 hover:-translate-y-1 animate-slide-in-left"
                    style={{
                      animationDelay: `${0.2 + idx * 0.1}s`,
                      opacity: 0,
                      animation: `slideInFromLeft 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.2 + idx * 0.1}s forwards`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {item.label}
                      </span>
                      <span className="text-xl font-semibold text-[#0969DA] dark:text-[#58A6FF] transition-transform duration-300 hover:scale-110">
                        {item.value}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel */}
            <div className="grid gap-4">
              {/* Repository Access Card */}
              <div
                className="rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-br from-slate-950/10 via-transparent to-slate-950/5 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-gradient-to-br dark:from-[#010409]/90 dark:via-transparent dark:to-[#010409]/50 dark:shadow-slate-950/20 hover:shadow-md dark:hover:shadow-slate-950/40 transition-all duration-300 animate-slide-in-top"
                style={{
                  animationDelay: "0.3s",
                  opacity: 0,
                  animation:
                    "slideInFromTop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards",
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Repository access
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    Ready to review repositories?
                  </h3>
                  <button
                    type="button"
                    onClick={scrollToRepositoryGrid}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0969DA] to-[#1F6FEB] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#0969DA]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#0969DA]/50 hover:scale-105 active:scale-95"
                  >
                    Check repositories
                  </button>
                </div>
              </div>

              {/* Workspace Health Card */}
              <div
                className="rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-br from-white/95 via-slate-50/50 to-white/80 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-gradient-to-br dark:from-[#0B1220]/95 dark:via-[#010409]/80 dark:to-[#0B1220]/70 dark:shadow-slate-950/20 hover:shadow-md dark:hover:shadow-slate-950/40 transition-all duration-300 animate-slide-in-top"
                style={{
                  animationDelay: "0.4s",
                  opacity: 0,
                  animation:
                    "slideInFromTop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      Status
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                      Workspace health
                    </h3>
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 px-3 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    Stable
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-gradient-to-br dark:from-slate-950/70 dark:to-slate-950/30 hover:border-[#0969DA]/30 dark:hover:border-[#58A6FF]/30 transition-all duration-300 hover:shadow-md">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Mock sandbox
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Safe experiment mode for repository workflows.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-gradient-to-br dark:from-slate-950/70 dark:to-slate-950/30 hover:border-[#0969DA]/30 dark:hover:border-[#58A6FF]/30 transition-all duration-300 hover:shadow-md">
                    <p className="font-medium text-slate-900 dark:text-white">
                      Agent-first flow
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Track issues, comments, and review actions without
                      friction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Repositories Section */}
          <section
            className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-br from-slate-950/10 via-transparent to-slate-950/5 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-gradient-to-br dark:from-[#010409]/90 dark:via-transparent dark:to-[#010409]/50 dark:shadow-slate-950/20 animate-slide-in-bottom"
            style={{
              animationDelay: "0.5s",
              opacity: 0,
              animation:
                "slideInFromBottom 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards",
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Repository list
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  All repositories
                </h2>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Search size={16} />
                <span>{4} repositories in the current workspace</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="sr-only" htmlFor="repo-search">
                Search repositories
              </label>
              <div className="relative group">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-[#0969DA] dark:group-focus-within:text-[#58A6FF]"
                />
                <input
                  id="repo-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repositories"
                  className="w-full rounded-full border border-slate-200 bg-gradient-to-r from-white/90 to-slate-50/90 py-2 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-300 focus:border-[#0969DA] focus:ring-2 focus:ring-[#0969DA]/20 focus:shadow-lg focus:shadow-[#0969DA]/20 dark:border-slate-700 dark:bg-gradient-to-r dark:from-[#010409]/90 dark:to-[#010409]/70 dark:text-white dark:focus:border-[#58A6FF] dark:focus:ring-[#58A6FF]/20 dark:focus:shadow-lg dark:focus:shadow-[#58A6FF]/20"
                />
              </div>
            </div>
            <div className="mt-5" id="repo-grid">
              <RepositoryGrid
                onSelectRepository={onSelectRepo}
                searchQuery={searchQuery}
              />
            </div>
          </section>

          {/* Footer */}
          <footer
            className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-gradient-to-r from-slate-50/90 to-slate-50/70 p-4 text-sm text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-gradient-to-r dark:from-[#010409]/80 dark:to-[#010409]/60 dark:text-slate-300 dark:shadow-slate-950/10 animate-slide-in-bottom"
            style={{
              animationDelay: "0.6s",
              opacity: 0,
              animation:
                "slideInFromBottom 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards",
            }}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Code2
                  size={16}
                  className="text-slate-500 dark:text-slate-400 animate-float"
                />
                <span>© 2026 GitHub Workflow Sandbox</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                  System online
                </span>
                <span>v2.0.1</span>
                <button className="text-[#0969DA] dark:text-[#58A6FF] hover:underline transition-colors duration-300">
                  System status
                </button>
                <button className="text-[#0969DA] dark:text-[#58A6FF] hover:underline transition-colors duration-300">
                  Documentation
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
