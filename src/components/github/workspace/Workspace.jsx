import { useState } from "react";
import {
  ArrowLeft,
  Package,
  RefreshCw,
  Search,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import NotificationMenu from "../NotificationMenu";
import FileExplorer from "./FileExplorer";
import IssuesPanel from "./IssuesPanel";
import PRsPanel from "./PRsPanel";
import IssueForm from "./IssueForm";
import { useTheme } from "../ThemeContext";

const TABS = [
  { id: "issues", label: "Issues" },
  { id: "prs", label: "Pull Requests" },
  { id: "create", label: "+ New Issue" },
];

export default function Workspace({
  repo,
  user,
  onBack,
  onNotify,
  notifications = [],
  onDismiss,
  onDismissAll,
}) {
  const [tab, setTab] = useState("issues");
  const [refreshTick, setRefreshTick] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const showRightPanel = tab !== "create";

  const handleIssueCreated = (issue) => {
    setTab("issues");
    setRefreshTick((t) => t + 1);
    if (issue && onNotify) {
      onNotify({
        id: `${issue.number}-${Date.now()}`,
        title: `New issue created in ${repo.owner}/${repo.repo}`,
        message: issue.title,
        time: new Date(issue.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#010409]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#010409]/90">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#0969DA] hover:text-[#0969DA] dark:border-slate-800 dark:bg-[#010409]/80 dark:text-slate-200 dark:hover:border-[#58A6FF] dark:hover:text-[#58A6FF]"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="rounded-3xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-[#0D1117] dark:text-slate-200">
            {repo.owner}/{repo.repo}
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-full border border-slate-200/80 bg-slate-100 p-2 transition hover:border-[#0969DA] dark:border-slate-800 dark:bg-[#0D1117]"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <NotificationMenu
            notifications={notifications}
            onDismiss={onDismiss}
            onDismissAll={onDismissAll}
          />
          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100 px-3 py-2 dark:border-slate-800 dark:bg-[#0D1117]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-[#0969DA] to-[#1F6FEB] text-white text-[11px] font-semibold">
              SU
            </span>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">
              Sandbox User
            </span>
            <ChevronDown
              size={14}
              className="text-slate-500 dark:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Full-width repo banner (title + description) */}
      <div className="w-full bg-slate-50 dark:bg-[#010409]/80 border-b border-slate-200/80 dark:border-slate-800 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            GitHub Development Workflow
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {repo.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Browse repositories and dispatch agent tasks as GitHub issues.
            Signed in as <strong>Sandbox User</strong>.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-[#010409]/80">
        {TABS.map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-[#0969DA] shadow-sm shadow-slate-900/5 dark:bg-[#0D1117] dark:text-[#58A6FF]"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#161B22]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setRefreshTick((t) => t + 1)}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-[#0969DA] dark:border-slate-800 dark:bg-[#0D1117] dark:text-slate-200"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div
        className={`grid flex-1 min-h-0 grid-cols-1 gap-4 px-4 py-4 ${showRightPanel ? "lg:grid-cols-[300px_minmax(0,1fr)_320px]" : "lg:grid-cols-[300px_minmax(0,1fr)]"}`}
      >
        <aside className="rounded-3xl border border-slate-200/70 bg-white p-3 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-[#0D1117]/90 dark:shadow-slate-950/20">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Quick reference
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
              Repository snapshot
            </h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-[#010409]/80">
              <p className="font-semibold text-slate-900 dark:text-white">
                Branch
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {repo.branch}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-[#010409]/80">
              <p className="font-semibold text-slate-900 dark:text-white">
                Owner
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {repo.owner}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-[#010409]/80">
              <p className="font-semibold text-slate-900 dark:text-white">
                Repo
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {repo.repo}
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-800/70 dark:bg-[#010409]/80">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              Need help?
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Expand any issue to review bot guidance, then respond with{" "}
              <strong>!continue</strong> or <strong>!discuss</strong> for next
              steps.
            </p>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-[#010409]/95 dark:shadow-slate-950/20">
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {tab === "issues" && (
                <IssuesPanel
                  repo={repo}
                  currentUserEmail={user?.email || ""}
                  refreshTick={refreshTick}
                  onRefresh={() => setRefreshTick((t) => t + 1)}
                />
              )}
              {tab === "prs" && <PRsPanel repo={repo} onNotify={onNotify} />}
              {tab === "create" && (
                <IssueForm
                  repo={repo}
                  onCreated={handleIssueCreated}
                  userEmail={user?.email || ""}
                />
              )}
            </div>
          </div>
        </main>

        {showRightPanel && (
          <aside className="rounded-3xl border border-slate-200/70 bg-white p-3 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-[#0D1117]/95 dark:shadow-slate-950/20">
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-50 p-4 dark:bg-[#010409]/80">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Guide
                </p>
                <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                  Use the workspace
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Review the current issue queue, expand entries for next
                  actions, and keep task context clear for the agent.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 text-sm dark:border-slate-800/70 dark:bg-[#010409]/80">
                <p className="font-semibold text-slate-900 dark:text-white">
                  How to respond
                </p>
                <ul className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                  <li>
                    • Use <strong>!continue</strong> when the bot needs narrower
                    scope.
                  </li>
                  <li>
                    • Use <strong>!discuss</strong> when you want to refine the
                    current implementation.
                  </li>
                  <li>• Keep comments concise and specific.</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 text-sm dark:border-slate-800/70 dark:bg-[#010409]/80">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Repo insights
                </p>
                <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                  <p>
                    Repository workspaces are seeded for product-focused
                    development and review.
                  </p>
                  <p>
                    Mock data ensures safe experimentation without affecting
                    real GitHub repositories.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
