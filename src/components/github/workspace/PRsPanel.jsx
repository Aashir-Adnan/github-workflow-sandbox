import { useState, useEffect, useCallback } from "react";
import { ChevronRight, GitPullRequest } from "lucide-react";
import { ghFetch } from "../api";

function PRFileList({ owner, repo, prNumber }) {
  const [files, setFiles] = useState(null);

  useEffect(() => {
    ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=50`).then(
      setFiles,
    );
  }, [owner, repo, prNumber]);

  if (!files)
    return <p className="text-[12px] text-[#8B949E]">Loading changed files…</p>;
  if (files.length === 0)
    return <p className="text-[12px] text-[#8B949E]">No changed files.</p>;

  return (
    <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
      {files.map((f) => (
        <li
          key={f.filename}
          className="flex items-center gap-2 px-2 py-1 rounded bg-[#F6F8FA] dark:bg-[#161B22] text-[12px] font-mono"
        >
          <span
            className={`w-16 shrink-0 uppercase font-semibold text-[10.5px] ${
              f.status === "added"
                ? "text-emerald-600 dark:text-emerald-400"
                : f.status === "removed"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {f.status}
          </span>
          <span className="flex-1 truncate">{f.filename}</span>
          <span className="flex gap-2 shrink-0 text-[11px]">
            {f.additions > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                +{f.additions}
              </span>
            )}
            {f.deletions > 0 && (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                −{f.deletions}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PRRow({ pr, owner, repo, onNotify }) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pingStatus, setPingStatus] = useState(null);
  const [pingError, setPingError] = useState(null);
  const createdAt = new Date(pr.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`rounded-lg border bg-white dark:bg-[#0D1117] overflow-hidden transition ${pr.draft ? "border-dashed border-[#D0D7DE] dark:border-[#30363D] opacity-80" : "border-[#D0D7DE] dark:border-[#30363D]"}`}
    >
      <div className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-[#F6F8FA] dark:hover:bg-[#161B22] transition">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(false);
            setOpen((v) => !v);
          }}
          className="flex flex-1 items-center gap-2.5 text-left"
        >
          <GitPullRequest size={15} className="text-[#8B949E] shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13.5px] font-medium truncate flex items-center gap-1.5">
              {pr.draft && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F6F8FA] dark:bg-[#161B22] text-[#656D76] dark:text-[#8B949E]">
                  Draft
                </span>
              )}
              {pr.title}
            </span>
            <span className="text-[11px] font-mono text-[#8B949E] truncate">
              #{pr.number} · {pr.user?.login} · {pr.head?.ref} → {pr.base?.ref}{" "}
              · {createdAt}
            </span>
          </div>
          <ChevronRight
            size={14}
            className={`text-[#8B949E] shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (pingStatus !== "sent") {
              setShowConfirm(true);
            }
          }}
          disabled={pingStatus === "sent"}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition shadow-sm ${pingStatus === "sent" ? "bg-emerald-500 text-white shadow-emerald-500/30 ring-1 ring-emerald-300/30 opacity-90 cursor-not-allowed" : "bg-gradient-to-r from-[#F5F7FA] to-[#E2E8F0] text-slate-900 dark:from-[#111827] dark:to-[#1f2937] dark:text-white hover:from-[#EDEFF2] hover:to-[#D1D5DB] dark:hover:from-[#111827] dark:hover:to-[#272f3a]"}`}
          title={pingStatus === "sent" ? "Already pinged" : "Ping to merge"}
          aria-label={
            pingStatus === "sent" ? "Ping already sent" : "Ping PR to merge"
          }
        >
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full shadow ${pingStatus === "sent" ? "bg-emerald-300 shadow-emerald-200/70" : "bg-amber-500 shadow-amber-200/70"}`}
          />
          {pingStatus === "sent" ? "Pinged" : "Ping"}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#D0D7DE] dark:border-[#30363D] pt-3">
          {pr.mergeable === true && (
            <div className="text-[12.5px] font-medium p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              ✅ No merge conflicts — ready to merge.
            </div>
          )}
          {pr.mergeable === false && (
            <div className="text-[12.5px] font-medium p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
              ⚠️ This branch has conflicts with the base branch.
            </div>
          )}

          {/* Ping to merge UI */}
          <div className="flex items-center justify-end gap-2">
            {pingStatus === "sent" ? (
              <span className="text-sm text-emerald-600">Pinged ✓</span>
            ) : (
              <>
                {pingStatus === "error" && (
                  <span className="text-sm text-red-600">
                    Failed: {pingError}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirm(true);
                  }}
                  className="px-3 py-1 rounded-md text-sm border border-[#D0D7DE] dark:border-[#30363D] hover:bg-[#F6F8FA] dark:hover:bg-[#161B22]"
                >
                  Ping to merge
                </button>
              </>
            )}
          </div>

          {showConfirm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"
              onClick={() => setShowConfirm(false)}
            >
              <div
                className="bg-slate-900 text-slate-100 rounded-[28px] p-6 w-full max-w-lg border border-white/10 shadow-2xl shadow-slate-950/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 p-4 text-amber-300">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white hover:cursor-pointer">
                      Ping to merge
                    </p>
                    <p className="mt-2 text-sm text-slate-300 max-w-xl">
                      Send a polished merge request comment to the PR author and
                      accelerate review with a premium note.
                    </p>
                  </div>
                </div>
                <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-slate-100">Preview</p>
                  <pre className="whitespace-pre-wrap mt-2 text-[13px] leading-6 text-slate-200">
                    👋 **Merge request** This PR is ready for review and merge.
                    Please take a look when you get a chance.
                    {"> _Sent via web UI_"}
                  </pre>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
                  <button
                    type="button"
                    className="rounded-full px-4 py-2 text-sm text-slate-300 border border-white/10 hover:bg-white/5 transition"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
                    onClick={async () => {
                      try {
                        setPingStatus("sending");
                        setPingError(null);
                        const body = `👋 **Merge request**\n\nThis PR is ready for review and merge. Please take a look when you get a chance.\n\n> _Sent via web UI_`;
                        await ghFetch(
                          `/repos/${owner}/${repo}/issues/${pr.number}/comments`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ body }),
                          },
                        );
                        setPingStatus("sent");
                        setShowConfirm(false);
                        if (onNotify) {
                          onNotify({
                            id: `ping-${owner}-${repo}-${pr.number}-${Date.now()}`,
                            title: `Pinged PR #${pr.number}`,
                            message: pr.title,
                            time: new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                          });
                        }
                      } catch (err) {
                        setPingStatus("error");
                        setPingError(err.message || "Failed to send");
                      }
                    }}
                  >
                    Send ping
                  </button>
                </div>
              </div>
            </div>
          )}

          {pr.body ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#8B949E] mb-1">
                Description
              </p>
              <pre className="whitespace-pre-wrap wrap-break-word text-[12.5px] p-3 rounded-md bg-[#F6F8FA] dark:bg-[#161B22] max-h-48 overflow-y-auto">
                {pr.body}
              </pre>
            </div>
          ) : (
            <p className="text-[12.5px] text-[#8B949E]">
              No description provided.
            </p>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8B949E] mb-1">
              Changed files
            </p>
            <PRFileList owner={owner} repo={repo} prNumber={pr.number} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PRsPanel({ repo, onNotify }) {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stateFilter, setStateFilter] = useState("open");

  const load = useCallback(() => {
    setLoading(true);
    ghFetch(
      `/repos/${repo.owner}/${repo.repo}/pulls?state=${stateFilter}&per_page=30`,
    )
      .then(setPrs)
      .finally(() => setLoading(false));
  }, [repo, stateFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        {["open", "closed", "all"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStateFilter(s)}
            className={`px-3 py-1 rounded-full text-[12.5px] font-semibold border transition ${
              stateFilter === s
                ? "bg-[#0969DA] dark:bg-[#1F6FEB] border-[#0969DA] dark:border-[#1F6FEB] text-white"
                : "border-[#D0D7DE] dark:border-[#30363D] hover:border-[#0969DA] dark:hover:border-[#58A6FF]"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-[13px] text-[#8B949E]">Loading pull requests…</p>
      )}
      {!loading && prs.length === 0 && (
        <p className="text-[13px] text-[#8B949E]">
          No {stateFilter === "all" ? "" : stateFilter + " "}pull requests.
        </p>
      )}
      {!loading && prs.length > 0 && (
        <div className="flex flex-col gap-2">
          {prs.map((pr) => (
            <PRRow
              key={pr.number}
              pr={pr}
              owner={repo.owner}
              repo={repo.repo}
              onNotify={onNotify}
            />
          ))}
        </div>
      )}
    </div>
  );
}
