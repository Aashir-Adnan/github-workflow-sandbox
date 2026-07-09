import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  MessageSquare,
  GitPullRequest,
  User,
  Bot,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import {
  ghFetch,
  getBotMarker,
  extractPrUrl,
  getIssueStage,
  extractEmail,
} from "../api";

function ReplyBox({ repo, issue, comments, onReplied }) {
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emoji = comments.length
    ? getBotMarker(comments[comments.length - 1])
    : null;
  const isWarning = emoji === "⚠️";
  const action = isWarning ? "!continue" : "!discuss";
  const placeholder = isWarning
    ? "Reduce the context paths and describe what to narrow down."
    : "Describe what to change or refine";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = info.trim() ? `${action}\n\n${info.trim()}` : action;
      await ghFetch(
        `/repos/${repo.owner}/${repo.repo}/issues/${issue.number}/comments`,
        { method: "POST", body: JSON.stringify({ body }) },
      );
      setInfo("");
      onReplied();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 mt-3 p-4 rounded-2xl bg-white dark:bg-[#0B1220] border border-slate-200/60 dark:border-slate-800/60 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2 text-slate-800 dark:text-slate-200">
          {isWarning ? (
            <AlertCircle size={16} className="text-amber-500" />
          ) : (
            <Send size={16} className="text-[#0969DA]" />
          )}
          {isWarning ? "Reduce paths to continue" : "Request changes"}
        </p>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Tip: press Enter to send
        </span>
      </div>
      <textarea
        rows={3}
        placeholder={placeholder}
        value={info}
        onChange={(e) => setInfo(e.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0969DA]/20 transition resize-y"
      />
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-[#0969DA] dark:bg-[#1F6FEB] text-white text-sm font-semibold px-4 py-2 hover:opacity-95 disabled:opacity-50 transition"
        >
          {submitting ? "Sending…" : "Send"}
          <Send size={14} />
        </button>
      </div>
    </form>
  );
}

function IssueRow({ issue, comments, repo, currentUserEmail, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const stage = issue.state === "closed" ? "done" : getIssueStage(comments);
  const isDone = stage === "done";
  const awaitingHuman = stage === "human";
  const myIssue =
    extractEmail(issue.body || "")?.toLowerCase() ===
    (currentUserEmail || "").toLowerCase();
  const prUrl = isDone ? extractPrUrl(comments) : null;

  const stageLabel = isDone
    ? "PR Ready"
    : awaitingHuman
      ? "Needs Input"
      : "Processing";
  const borderColor = isDone
    ? "border-emerald-500/30"
    : awaitingHuman
      ? "border-amber-500/30"
      : "border-[#D0D7DE] dark:border-[#30363D]";
  const dotColor = isDone
    ? "bg-emerald-500"
    : awaitingHuman
      ? "bg-amber-500 animate-pulse"
      : "bg-[#0969DA] animate-pulse";

  return (
    <div
      className={`rounded-2xl border ${borderColor} bg-white dark:bg-[#0B1220] overflow-hidden mb-3 shadow-sm`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-[#07121a] transition"
      >
        <div className={`w-3 h-3 rounded-full ${dotColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">
              #{issue.number}
            </span>
            <h3 className="text-sm font-semibold truncate text-slate-900 dark:text-white">
              {issue.title.replace(/^\[Agent Call\]\s*/, "")}
            </h3>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {myIssue && (
              <span className="text-xs font-semibold text-[#0969DA] bg-[#0969DA]/10 px-2 py-0.5 rounded-full">
                mine
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: isDone
                  ? "rgba(34,197,94,0.08)"
                  : awaitingHuman
                    ? "rgba(250,204,21,0.08)"
                    : "rgba(9,105,218,0.06)",
                color: isDone
                  ? "#16a34a"
                  : awaitingHuman
                    ? "#b45309"
                    : "#0969DA",
              }}
            >
              {stageLabel}
            </span>
            {prUrl && (
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full hover:bg-emerald-500/20 transition"
              >
                <GitPullRequest size={12} className="inline mr-1" />
                PR
              </a>
            )}
            {comments.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-100 dark:bg-[#07121a] px-2 py-0.5 rounded-full flex items-center gap-1">
                <MessageSquare size={12} /> {comments.length}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          size={18}
          className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {isDone && prUrl && (
            <div className="text-sm p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              ✅ PR ready!{" "}
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0969DA] hover:underline"
              >
                Review & merge ↗
              </a>
            </div>
          )}

          <pre className="text-sm font-mono p-4 rounded-lg bg-slate-50 dark:bg-[#07121a] border border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap text-slate-700 dark:text-slate-200">
            {issue.body}
          </pre>

          {comments.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setCommentsOpen((v) => !v)}
                className="text-sm font-medium text-slate-600 hover:text-[#0969DA] transition"
              >
                {commentsOpen ? "Hide" : "Show"} {comments.length} comments
              </button>
              {commentsOpen && (
                <div className="mt-3 space-y-3">
                  {comments.map((c) => {
                    const botMarker = getBotMarker(c);
                    const isBot = !!botMarker;
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-lg border ${isBot ? "border-[#0969DA]/20 bg-[#0969DA]/6" : "border-slate-100 bg-white dark:bg-[#0B1220] dark:border-slate-800"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isBot ? (
                              <Bot size={14} className="text-[#0969DA]" />
                            ) : (
                              <User
                                size={14}
                                className="text-slate-600 dark:text-slate-300"
                              />
                            )}
                            <span className="font-semibold text-sm">
                              {isBot ? botMarker : c.user?.login}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-200">
                          <p className="whitespace-pre-wrap break-words">
                            {c.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(awaitingHuman || isDone) && (
            <ReplyBox
              repo={repo}
              issue={issue}
              comments={comments}
              onReplied={onRefresh}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function IssuesPanel({
  repo,
  currentUserEmail,
  refreshTick,
  onRefresh,
}) {
  const [issues, setIssues] = useState([]);
  const [commentMap, setCommentMap] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const [openData, closedData] = await Promise.all([
        ghFetch(
          `/repos/${repo.owner}/${repo.repo}/issues?state=open&per_page=50`,
        ),
        ghFetch(
          `/repos/${repo.owner}/${repo.repo}/issues?state=closed&per_page=50`,
        ),
      ]);
      const data = [...openData, ...closedData];
      const agentIssues = data.filter(
        (i) => !i.pull_request && i.title?.startsWith("[Agent Call]"),
      );
      setIssues(agentIssues);
      const entries = await Promise.all(
        agentIssues.slice(0, 20).map(async (issue) => {
          try {
            const comments = await ghFetch(
              `/repos/${repo.owner}/${repo.repo}/issues/${issue.number}/comments`,
            );
            return [issue.number, comments];
          } catch {
            return [issue.number, []];
          }
        }),
      );
      setCommentMap(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues, refreshTick]);

  if (loading && issues.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] text-[#8B949E]">
        Loading issues…
      </div>
    );
  }
  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare size={32} className="mx-auto text-[#8B949E] mb-3" />
        <p className="text-[14px] font-medium">No open agent issues</p>
        <p className="text-[12px] text-[#8B949E] mt-1">
          All tasks are complete.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <IssueRow
          key={issue.number}
          issue={issue}
          comments={commentMap[issue.number] || []}
          repo={repo}
          currentUserEmail={currentUserEmail}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
