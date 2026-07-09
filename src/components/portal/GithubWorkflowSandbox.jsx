import React, { useState, useEffect, useCallback, useRef } from "react";
import { mockFetchTrackedRepos, mockGhFetch } from "./mockGithubData";

/* ─────────────────────────────────────────────
   GitHub API helpers (mock wrappers)
───────────────────────────────────────────── */

async function ghFetch(path, opts = {}) {
  return mockGhFetch(path, opts);
}

function extractEmail(body = "") {
  const m = body.match(/NotifyEmail:\s*([^\s]+)/);
  return m ? m[1] : null;
}

/* NEW (UI-only helper): pulls the "Priority:" value out of an issue body,
   the same way extractEmail() already pulls "NotifyEmail:". Used to render
   the metadata row on each issue card — no existing parsing is touched. */
function extractPriority(body = "") {
  const m = body.match(/Priority:\s*([^\r\n]+)/);
  return m ? m[1].trim() : null;
}

/* NEW (UI-only helper): pulls the "Type:" value out of an issue body,
   mirroring extractEmail()/extractPriority() above. */
function extractIssueType(body = "") {
  const m = body.match(/Type:\s*([^\r\n]+)/);
  return m ? m[1].trim() : null;
}

/* NEW (UI-only lookup): maps the raw agent "Type" value from the issue body
   to the friendlier label requested for the metadata row. Falls back to the
   raw value itself so nothing is ever hardcoded/invented if a new Type is
   introduced later. */
const ISSUE_TYPE_LABELS = {
  "Code Writer": "Development",
  "Code Reviewer": "Review",
  "Code Suggester": "Suggestion",
};

/* NEW (UI-only lookup): purely decorative emoji per priority value, used
   only for the metadata row. Falls back to a neutral dot for any priority
   text not in this list, so no value is ever fabricated. */
const PRIORITY_EMOJI = {
  Immediate: "🔴",
  High: "🟠",
  Normal: "🟡",
  Low: "🟢",
};

/* NEW (UI-only helper): pulls the "Task:" section out of an issue body —
   same field buildIssueBody() writes. Matches from the "Task:" label up to
   the next blank line (the same "label, then blank-line-terminated block"
   shape every field in buildIssueBody() already follows). */
function extractTask(body = "") {
  const m = body.match(/Task:\s*\r?\n([\s\S]*?)(?:\r?\n\r?\n|$)/);
  return m ? m[1].trim() : null;
}

/* NEW (UI-only helper): pulls the "Context:" section out of an issue body
   and splits it into the individual file paths buildIssueBody() joined
   with ", " when the issue was created. Returns [] (not fabricated data)
   when no Context section exists. */
function extractContext(body = "") {
  const m = body.match(/Context:\s*\r?\n([\s\S]*?)(?:\r?\n\r?\n|$)/);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* NEW (UI-only helper): turns an ISO created_at timestamp into a relative
   "x ago" string, computed dynamically at render time from the real
   created_at value — nothing here is hardcoded. */
function formatRelativeTime(dateString) {
  const createdMs = new Date(dateString).getTime();
  if (Number.isNaN(createdMs)) return "";
  const diffMs = Math.max(0, Date.now() - createdMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) {
    const mins = Math.round(diffMs / minute);
    return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  }
  if (diffMs < day) {
    const hrs = Math.round(diffMs / hour);
    return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  }
  const days = Math.round(diffMs / day);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function getBotMarker(comment) {
  const body = comment?.body || "";
  const markerMatch = body.match(/(?:^|\n)\s*(🤖|⚠️|✅)\b/m);
  if (markerMatch?.[1]) return markerMatch[1];
  if (comment?.user?.type === "Bot") return "🤖";
  return null;
}

function extractPrUrl(comments) {
  if (!comments) return null;
  for (let i = comments.length - 1; i >= 0; i--) {
    const body = comments[i]?.body || "";
    if (body.includes("**Committed and PR opened**")) {
      const m = body.match(/https:\/\/github\.com\/[^\s)]+\/pull\/\d+/);
      return m ? m[0] : null;
    }
  }
  return null;
}

function getIssueStage(comments) {
  if (!comments || comments.length === 0) return "bot";
  const hasPrComment = comments.some((c) =>
    (c.body || "").includes("**Committed and PR opened**"),
  );
  if (hasPrComment) return "done";
  const last = comments[comments.length - 1];
  if (getBotMarker(last)) return "human";
  return "bot";
}

function getLastBotEmoji(comments) {
  if (!comments || comments.length === 0) return null;
  const last = comments[comments.length - 1];
  return getBotMarker(last);
}

function buildIssueBody({ task, context, type, priority, email }) {
  const lines = ["[Agent Call]", "", "Task:", task, ""];
  if (context && context.length > 0) {
    lines.push("Context:");
    lines.push(context.join(", "));
    lines.push("");
  }
  if (type) {
    lines.push("Type:");
    lines.push(type);
    lines.push("");
  }
  if (priority) {
    lines.push("Priority:");
    lines.push(priority);
    lines.push("");
  }
  if (email) {
    lines.push("NotifyEmail:");
    lines.push(email);
    lines.push("");
  }
  return lines.join("\n");
}

/* ─────────────────────────────────────────────
   Icon set (inline SVG, purely presentational)
───────────────────────────────────────────── */

function Icon({ children, size = 16, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`gh-icon ${className}`}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

const IconSearch = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);
const IconPackage = (props) => (
  <Icon {...props}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </Icon>
);
const IconFolder = (props) => (
  <Icon {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </Icon>
);
const IconFolderOpen = (props) => (
  <Icon {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2H8.2a2 2 0 0 0-1.9 1.4L4.8 13H3V7z" />
    <path d="M3 13l1.8-5.4A2 2 0 0 1 6.7 6.2H19a2 2 0 0 1 1.9 2.7L19 15a2 2 0 0 1-1.9 1.4H5a2 2 0 0 1-2-1.4z" />
  </Icon>
);
const IconFile = (props) => (
  <Icon {...props}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M13 2v7h7" />
  </Icon>
);
const IconCheck = (props) => (
  <Icon {...props}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);
const IconAlertTriangle = (props) => (
  <Icon {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);
const IconCheckCircle = (props) => (
  <Icon {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </Icon>
);
const IconBot = (props) => (
  <Icon {...props}>
    <rect x="3" y="8" width="18" height="12" rx="2.5" />
    <path d="M12 8V4" />
    <circle cx="12" cy="3" r="1" />
    <line x1="8" y1="14" x2="8" y2="15" />
    <line x1="16" y1="14" x2="16" y2="15" />
  </Icon>
);
const IconUser = (props) => (
  <Icon {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);
const IconMessageCircle = (props) => (
  <Icon {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Icon>
);
const IconBell = (props) => (
  <Icon {...props}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Icon>
);
const IconGitBranch = (props) => (
  <Icon {...props}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </Icon>
);
const IconGitPullRequest = (props) => (
  <Icon {...props}>
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M13 6h3a2 2 0 0 1 2 2v7" />
    <line x1="6" y1="9" x2="6" y2="21" />
  </Icon>
);
const IconRefresh = (props) => (
  <Icon {...props}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Icon>
);
const IconChevronRight = (props) => (
  <Icon {...props}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
);
const IconExternalLink = (props) => (
  <Icon {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </Icon>
);
const IconX = (props) => (
  <Icon {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);
const IconArrowLeft = (props) => (
  <Icon {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </Icon>
);
const IconPlus = (props) => (
  <Icon {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);
const IconInbox = (props) => (
  <Icon {...props}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Icon>
);

function markerIcon(marker, size = 13) {
  if (marker === "🤖") return <IconBot size={size} />;
  if (marker === "⚠️") return <IconAlertTriangle size={size} />;
  if (marker === "✅") return <IconCheckCircle size={size} />;
  return null;
}

/* ─────────────────────────────────────────────
   File Explorer
───────────────────────────────────────────── */

function buildTree(flat) {
  const map = {};
  const roots = [];
  for (const item of flat) map[item.path] = { ...item, children: [] };
  for (const item of flat) {
    const parts = item.path.split("/");
    if (parts.length === 1) roots.push(map[item.path]);
    else {
      const parentPath = parts.slice(0, -1).join("/");
      if (map[parentPath]) map[parentPath].children.push(map[item.path]);
    }
  }
  const sort = (arr) => {
    arr.sort((a, b) =>
      a.type === b.type
        ? a.path.localeCompare(b.path)
        : a.type === "tree"
          ? -1
          : 1,
    );
    for (const node of arr) sort(node.children);
    return arr;
  };
  return sort(roots);
}

function TreeNode({ nodes, expanded, onToggle, onSelect, selected, depth }) {
  return (
    <ul
      className="gh-tree-list"
      style={{ paddingLeft: depth === 0 ? 0 : "1.1rem" }}
    >
      {nodes.map((node) => {
        const isDir = node.type === "tree";
        const isOpen = expanded.has(node.path);
        const isSelected = selected.includes(node.path);
        const name = node.path.split("/").pop();
        return (
          <li key={node.path} className="gh-tree-item">
            <button
              type="button"
              className={`gh-tree-row${isSelected ? " gh-tree-row--selected" : ""}`}
              onClick={() =>
                isDir ? onToggle(node.path) : onSelect(node.path)
              }
            >
              {/* NEW: fixed-width chevron slot keeps file rows aligned with
                  folder rows (files render an empty slot so icons stay
                  in the same column). Chevron rotates 90deg on expand. */}
              <span className="gh-tree-chevron-slot">
                {isDir && (
                  <span
                    className={`gh-tree-chevron${isOpen ? " gh-tree-chevron--open" : ""}`}
                  >
                    <IconChevronRight size={12} />
                  </span>
                )}
              </span>
              <span className="gh-tree-icon">
                {isDir ? (
                  isOpen ? (
                    <IconFolderOpen size={15} />
                  ) : (
                    <IconFolder size={15} />
                  )
                ) : (
                  <IconFile size={15} />
                )}
              </span>
              <span className="gh-tree-name">{name}</span>
              {!isDir && isSelected && (
                <span className="gh-tree-check">
                  <IconCheck size={12} />
                </span>
              )}
            </button>
            {isDir && isOpen && node.children.length > 0 && (
              <TreeNode
                nodes={node.children}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
                selected={selected}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FileExplorer({ owner, repo, onSelect, selected }) {
  const [tree, setTree] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    ghFetch(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`)
      .then((data) => setTree(data.tree || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const toggle = useCallback((path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (path) => {
      onSelect((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
      );
    },
    [onSelect],
  );

  if (loading)
    return (
      <div className="gh-explorer-loading">
        <span className="status-spinner" />
        Loading tree…
      </div>
    );
  if (error)
    return (
      <div className="gh-explorer-error">
        <IconAlertTriangle size={14} />
        Error: {error}
      </div>
    );
  if (!tree) return null;

  return (
    <div className="gh-explorer">
      <TreeNode
        nodes={buildTree(tree)}
        expanded={expanded}
        onToggle={toggle}
        onSelect={handleSelect}
        selected={selected}
        depth={0}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Repository Info Card (NEW)
   Compact, reusable "Repository / Owner / Branch" summary built purely
   from the repo object already passed down from RepoSelector/REPOS —
   no new fields, no fetches, no fabricated data.
───────────────────────────────────────────── */

function RepoInfoCard({ repo, showOwner = true }) {
  return (
    <div className="gh-repo-info-card">
      <div className="gh-repo-info-item">
        <span className="gh-repo-info-label">Repository</span>
        <span className="gh-repo-info-value">
          {repo.owner} / {repo.repo}
        </span>
      </div>
      {showOwner && (
        <div className="gh-repo-info-item">
          <span className="gh-repo-info-label">Owner</span>
          <span className="gh-repo-info-value">{repo.owner}</span>
        </div>
      )}
      {repo.branch && (
        <div className="gh-repo-info-item">
          <span className="gh-repo-info-label">Branch</span>
          <span className="gh-repo-info-value gh-repo-info-value--branch">
            <IconGitBranch size={12} /> {repo.branch}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Issue Form
───────────────────────────────────────────── */

const TYPES = ["", "Code Writer", "Code Reviewer", "Code Suggester"];
const PRIORITIES = ["", "Immediate", "High", "Normal", "Low", "Minimal"];

function IssueForm({ repo, onCreated, userEmail }) {
  const [title, setTitle] = useState("");
  const [task, setTask] = useState("");
  const [context, setContext] = useState([]);
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !task.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = buildIssueBody({
        task: task.trim(),
        context,
        type: type || undefined,
        priority: priority || undefined,
        email: userEmail,
      });
      await ghFetch(`/repos/${repo.owner}/${repo.repo}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `[Agent Call] ${title.trim()}`, body }),
      });
      setTitle("");
      setTask("");
      setContext([]);
      setType("");
      setPriority("Normal");
      setShowAdvanced(false);
      setShowExplorer(false);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="gh-issue-form" onSubmit={handleSubmit}>
      {/* NEW: read-only context card — Repository / Branch (+ Notify Email
          when one is already configured for this workflow), all sourced
          from the existing repo/userEmail props. Purely informational;
          does not affect submission or the request payload. */}
      <div className="gh-repo-info-card gh-repo-info-card--form">
        <div className="gh-repo-info-item">
          <span className="gh-repo-info-label">Repository</span>
          <span className="gh-repo-info-value">
            {repo.owner} / {repo.repo}
          </span>
        </div>
        {repo.branch && (
          <div className="gh-repo-info-item">
            <span className="gh-repo-info-label">Branch</span>
            <span className="gh-repo-info-value gh-repo-info-value--branch">
              <IconGitBranch size={12} /> {repo.branch}
            </span>
          </div>
        )}
        {userEmail && (
          <div className="gh-repo-info-item">
            <span className="gh-repo-info-label">Notify Email</span>
            <span className="gh-repo-info-value">{userEmail}</span>
          </div>
        )}
      </div>

      <div className="gh-form-field">
        <label className="gh-form-label">
          Brief title <span className="gh-form-required">*</span>
        </label>
        <div className="gh-title-prefix-wrap">
          <span className="gh-title-prefix">[Agent Call]</span>
          <input
            className="gh-form-input gh-title-input"
            placeholder="e.g. Add structured error logging"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />
        </div>
      </div>

      <div className="gh-form-field">
        <label className="gh-form-label">
          Task description <span className="gh-form-required">*</span>
        </label>
        <textarea
          className="gh-form-textarea"
          placeholder="Describe exactly what should be done. Be specific about expected behaviour, files to touch, and edge cases."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          required
          rows={5}
        />
      </div>

      <div className="gh-advanced-toggle-row">
        <button
          type="button"
          className="gh-advanced-toggle"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <span className={`gh-advanced-arrow${showAdvanced ? " open" : ""}`}>
            <IconChevronRight size={14} />
          </span>
          Optional fields <span className="gh-optional-badge">optional</span>
        </button>
      </div>

      <div
        className={`gh-advanced-panel${showAdvanced ? " gh-advanced-panel--open" : ""}`}
      >
        <div className="gh-advanced-panel-inner">
          <div className="gh-form-field">
            <label className="gh-form-label">
              Context paths{" "}
              <span className="gh-optional-badge gh-optional-badge--inline">
                optional
              </span>
            </label>
            <p className="gh-context-warning">
              <IconAlertTriangle size={14} /> Context is entirely optional — the
              agent works without it. Only add paths if directly relevant; a
              wrong path can mislead the agent.
            </p>
            <button
              type="button"
              className={`gh-explorer-toggle${showExplorer ? " gh-explorer-toggle--open" : ""}`}
              onClick={() => setShowExplorer((v) => !v)}
            >
              <span
                className={`gh-advanced-arrow${showExplorer ? " open" : ""}`}
              >
                <IconChevronRight size={14} />
              </span>
              {showExplorer ? "Hide file explorer" : "Browse repository files"}
            </button>
            {showExplorer && (
              <div className="gh-explorer-inline">
                <FileExplorer
                  owner={repo.owner}
                  repo={repo.repo}
                  onSelect={setContext}
                  selected={context}
                />
              </div>
            )}
            {context.length > 0 && (
              <div className="gh-context-chips">
                {context.map((p) => (
                  <span key={p} className="gh-context-chip">
                    {p}
                    <button
                      type="button"
                      className="gh-chip-remove"
                      onClick={() =>
                        setContext((prev) => prev.filter((x) => x !== p))
                      }
                      aria-label={`Remove ${p}`}
                    >
                      <IconX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="gh-form-row--cols">
            <div className="gh-form-field">
              <label className="gh-form-label">Type</label>
              <select
                className="gh-form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t || "— not specified —"}
                  </option>
                ))}
              </select>
            </div>
            <div className="gh-form-field">
              <label className="gh-form-label">Priority</label>
              <select
                className="gh-form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p || "— not specified —"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="gh-form-error">
          <IconAlertTriangle size={14} />
          {error}
        </p>
      )}

      <div className="gh-form-actions">
        <button
          type="submit"
          className="gh-submit-btn"
          disabled={submitting || !title.trim() || !task.trim()}
        >
          {submitting ? (
            <>
              <span className="status-spinner" /> Creating…
            </>
          ) : (
            <>
              <IconPlus size={15} /> Create issue
            </>
          )}
        </button>
        <span className="gh-form-hint">
          Filed under{" "}
          <strong>
            {repo.owner}/{repo.repo}
          </strong>
        </span>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────
   Comment Reply Box
───────────────────────────────────────────── */

function ReplyBox({ repo, issue, comments, onReplied }) {
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const emoji = getLastBotEmoji(comments);
  const isWarning = emoji === "⚠️";
  const action = isWarning ? "!continue" : "!discuss";
  const placeholder = isWarning
    ? "Reduce the Context paths and describe what to narrow down."
    : "Describe what to change or refine — the agent will update the PR.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = info.trim() ? `${action}\n\n${info.trim()}` : action;
      await ghFetch(
        `/repos/${repo.owner}/${repo.repo}/issues/${issue.number}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      setInfo("");
      onReplied();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="gh-reply-box" onSubmit={handleSubmit}>
      <p className="gh-reply-label">
        {isWarning
          ? "Context too large — reduce paths, then continue:"
          : "Request a change or refinement:"}
      </p>
      <textarea
        className="gh-reply-info"
        rows={3}
        placeholder={placeholder}
        value={info}
        onChange={(e) => setInfo(e.target.value)}
      />
      {error && (
        <p className="gh-form-error" style={{ margin: 0 }}>
          <IconAlertTriangle size={14} />
          {error}
        </p>
      )}
      <button
        type="submit"
        className="gh-submit-btn gh-submit-btn--sm"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span className="status-spinner" /> Sending…
          </>
        ) : (
          `Send ${action}`
        )}
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────────
   Issue Info Section (NEW)
   Status / Created by / Created (relative) / Notify — all read directly
   off the existing issue object (state, user, created_at, body). Any
   field that isn't available is simply skipped, nothing is invented.
───────────────────────────────────────────── */

function IssueInfoSection({ issue }) {
  const notifyEmail = extractEmail(issue.body || "");
  const createdRelative = formatRelativeTime(issue.created_at);

  return (
    <div className="gh-issue-info-section">
      <div className="gh-issue-info-item">
        <span className="gh-issue-info-label">Status</span>
        <span
          className={`gh-issue-info-value gh-issue-info-status gh-issue-info-status--${issue.state}`}
        >
          {issue.state === "closed" ? "Closed" : "Open"}
        </span>
      </div>
      {issue.user?.login && (
        <div className="gh-issue-info-item">
          <span className="gh-issue-info-label">Created by</span>
          <span className="gh-issue-info-value">
            <IconUser size={12} /> {issue.user.login}
          </span>
        </div>
      )}
      {createdRelative && (
        <div className="gh-issue-info-item">
          <span className="gh-issue-info-label">Created</span>
          <span className="gh-issue-info-value">{createdRelative}</span>
        </div>
      )}
      {notifyEmail && (
        <div className="gh-issue-info-item">
          <span className="gh-issue-info-label">Notify</span>
          <span className="gh-issue-info-value">{notifyEmail}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Issue Body Fields (NEW)
   Replaces the raw <pre>{issue.body}</pre> dump with a parsed, labeled
   layout (Task / Affected Files / Type / Priority / Notify Email), all
   extracted from the same issue.body string buildIssueBody() already
   writes. If nothing recognizable can be parsed (e.g. a body that
   doesn't follow the agent-call format), the raw text is still shown
   as a fallback so no information is ever lost.
───────────────────────────────────────────── */

function IssueBodyFields({ body }) {
  const task = extractTask(body || "");
  const files = extractContext(body || "");
  const type = extractIssueType(body || "");
  const priority = extractPriority(body || "");
  const email = extractEmail(body || "");

  const hasStructuredData =
    task || files.length > 0 || type || priority || email;

  if (!hasStructuredData) {
    return <pre className="gh-issue-body-pre">{body}</pre>;
  }

  return (
    <div className="gh-issue-fields">
      {task && (
        <div className="gh-issue-field">
          <span className="gh-issue-field-label">Task</span>
          <p className="gh-issue-field-task">{task}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="gh-issue-field">
          <span className="gh-issue-field-label">Affected Files</span>
          <ul className="gh-affected-files-list">
            {files.map((f) => (
              <li key={f} className="gh-affected-file">
                <IconFile size={13} />
                <span className="gh-affected-file-path">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(type || priority || email) && (
        <div className="gh-issue-field-row">
          {type && (
            <div className="gh-issue-field">
              <span className="gh-issue-field-label">Type</span>
              <span className="gh-issue-field-value">{type}</span>
            </div>
          )}
          {priority && (
            <div className="gh-issue-field">
              <span className="gh-issue-field-label">Priority</span>
              <span className="gh-issue-field-value">{priority}</span>
            </div>
          )}
          {email && (
            <div className="gh-issue-field">
              <span className="gh-issue-field-label">Notify Email</span>
              <span className="gh-issue-field-value">{email}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Issue Row
───────────────────────────────────────────── */

function IssueRow({ issue, comments, repo, currentUserEmail, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [openComments, setOpenComments] = useState({});

  const stage = issue.state === "closed" ? "done" : getIssueStage(comments);
  const isDone = stage === "done";
  const awaitingHuman = stage === "human";
  const myIssue =
    extractEmail(issue.body || "")?.toLowerCase() ===
    (currentUserEmail || "").toLowerCase();
  const prUrl = isDone ? extractPrUrl(comments) : null;

  // NEW: derive the compact metadata row (priority • type • relative time)
  // entirely from existing issue fields (body + created_at). No new/fake
  // data is introduced — values are simply extracted and formatted.
  const priority = extractPriority(issue.body || "");
  const rawIssueType = extractIssueType(issue.body || "");
  const issueTypeLabel = rawIssueType
    ? ISSUE_TYPE_LABELS[rawIssueType] || rawIssueType
    : null;
  const priorityEmoji = priority ? PRIORITY_EMOJI[priority] || "⚪" : null;
  const relativeTime = formatRelativeTime(issue.created_at);

  const stageLabel = isDone
    ? "PR Ready"
    : awaitingHuman
      ? "Awaiting Your Response"
      : "Awaiting Bot Response";
  const rowClass = [
    "gh-issue-row",
    isDone ? " gh-issue-row--done" : "",
    awaitingHuman ? " gh-issue-row--alert" : "",
    open ? " gh-issue-row--open" : "",
  ].join("");

  const lightClass = `gh-status-light${isDone ? " gh-status-light--done" : awaitingHuman ? " gh-status-light--alert" : " gh-status-light--ok"}`;

  return (
    <div className={rowClass}>
      <button
        type="button"
        className="gh-issue-row-header"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={lightClass} />
        <span className="gh-status-number">#{issue.number}</span>
        {/* NEW: title + metadata row are now grouped in a column wrapper so the
            new compact metadata line can sit directly under the title. The
            "gh-status-title" span itself is unchanged (same class, same text). */}
        <div className="gh-status-title-col">
          <span className="gh-status-title">
            {issue.title.replace(/^\[Agent Call\]\s*/, "")}
          </span>
          {/* NEW: compact metadata row — priority • type • relative time,
              all derived dynamically from issue.body / issue.created_at. */}
          <span className="gh-issue-meta-row">
            {priority && (
              <span className="gh-issue-meta-priority">
                <span aria-hidden="true">{priorityEmoji}</span> {priority}
              </span>
            )}
            {priority && issueTypeLabel && (
              <span className="gh-issue-meta-dot" aria-hidden="true">
                •
              </span>
            )}
            {issueTypeLabel && (
              <span className="gh-issue-meta-type">{issueTypeLabel}</span>
            )}
            {(priority || issueTypeLabel) && relativeTime && (
              <span className="gh-issue-meta-dot" aria-hidden="true">
                •
              </span>
            )}
            {relativeTime && (
              <span className="gh-issue-meta-time">{relativeTime}</span>
            )}
          </span>
        </div>
        <div className="gh-status-meta">
          {myIssue && (
            <span className="gh-status-badge gh-status-badge--mine">mine</span>
          )}
          <span className={`gh-stage-badge gh-stage-badge--${stage}`}>
            {stageLabel}
          </span>
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gh-pr-badge"
              onClick={(e) => e.stopPropagation()}
            >
              <IconGitPullRequest size={13} /> View PR{" "}
              <IconExternalLink size={12} />
            </a>
          )}
          {comments.length > 0 && (
            <span className="gh-status-comments">
              <IconMessageCircle size={13} /> {comments.length}
            </span>
          )}
          <span className={`gh-chevron${open ? " open" : ""}`}>
            <IconChevronRight size={16} />
          </span>
        </div>
      </button>

      <div className={`gh-issue-detail${open ? " gh-issue-detail--open" : ""}`}>
        <div className="gh-issue-detail-inner">
          {isDone && prUrl && (
            <div className="gh-pr-ready-banner">
              <span className="gh-pr-ready-banner-main">
                <IconCheckCircle size={15} /> PR is ready.
              </span>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gh-pr-ready-link"
              >
                Review &amp; merge <IconExternalLink size={13} />
              </a>
              <span className="gh-pr-refine-hint">
                Need changes? Reply below with <code>!discuss</code> — the agent
                will update the same PR.
              </span>
            </div>
          )}

          {/* NEW: compact repository context, placed above the issue
              description as requested — sourced from the existing repo
              prop (owner/repo/branch), nothing new fetched or invented. */}
          <RepoInfoCard repo={repo} />

          {/* NEW: issue-level info (status/creator/created/notify),
              read directly off the existing issue object. */}
          <IssueInfoSection issue={issue} />

          {/* CHANGED: the raw <pre>{issue.body}</pre> dump is replaced with
              a parsed, labeled layout (Task / Affected Files / Type /
              Priority / Notify Email). Same underlying data — issue.body —
              just presented instead of shown as one raw text blob. Falls
              back to the original raw <pre> automatically if a body
              doesn't match the expected agent-call format. */}
          <IssueBodyFields body={issue.body} />

          {comments.length > 0 && (
            <div className="gh-comments-section">
              <button
                type="button"
                className="gh-comments-toggle"
                onClick={() => setCommentsOpen((v) => !v)}
              >
                <span
                  className={`gh-advanced-arrow${commentsOpen ? " open" : ""}`}
                >
                  <IconChevronRight size={14} />
                </span>
                {commentsOpen ? "Hide" : "Show"} {comments.length} comment
                {comments.length !== 1 ? "s" : ""}
              </button>
              <div
                className={`gh-comments-list${commentsOpen ? " gh-comments-list--open" : ""}`}
              >
                <div className="gh-comments-list-inner">
                  {comments.map((c) => {
                    const botMarker = getBotMarker(c);
                    const isBot = !!botMarker;
                    const isCommentOpen = !!openComments[c.id];
                    const preview = (c.body || "").replace(/\s+/g, " ").trim();
                    return (
                      <div
                        key={c.id}
                        className={`gh-comment${isBot ? " gh-comment--bot" : ""}`}
                      >
                        <button
                          type="button"
                          className="gh-comment-toggle"
                          onClick={() =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [c.id]: !prev[c.id],
                            }))
                          }
                        >
                          <span className="gh-comment-author">
                            <span className="gh-comment-author-icon">
                              {isBot ? (
                                markerIcon(botMarker)
                              ) : (
                                <IconUser size={13} />
                              )}
                            </span>
                            {c.user?.login}
                          </span>
                          <span className="gh-comment-time">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                          <span
                            className={`gh-comment-chevron${isCommentOpen ? " open" : ""}`}
                          >
                            <IconChevronRight size={13} />
                          </span>
                        </button>
                        {isCommentOpen ? (
                          <p className="gh-comment-body">{c.body}</p>
                        ) : (
                          <p className="gh-comment-preview">
                            {preview || "(empty comment)"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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

          <span
            className="gh-status-open-link"
            style={{ opacity: 0.4, cursor: "default" }}
          >
            <IconExternalLink size={12} /> Open on GitHub (sandbox — links
            disabled)
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Repository Overview (NEW)
   Purely additive: reuses the same ghFetch() mock endpoints that
   IssuesPanel/PRsPanel/FileExplorer already call elsewhere, so no new
   business logic or API surface is introduced — only new read-only
   summary calculations for the UI.
───────────────────────────────────────────── */

function RepoOverview({ repo, refreshTick }) {
  const [stats, setStats] = useState({
    activeIssues: 0,
    pullRequests: 0,
    files: 0,
    discussions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      try {
        const [openIssues, closedIssues, prs, treeData] = await Promise.all([
          ghFetch(
            `/repos/${repo.owner}/${repo.repo}/issues?state=open&per_page=50`,
          ),
          ghFetch(
            `/repos/${repo.owner}/${repo.repo}/issues?state=closed&per_page=50`,
          ),
          ghFetch(
            `/repos/${repo.owner}/${repo.repo}/pulls?state=all&per_page=50`,
          ),
          ghFetch(
            `/repos/${repo.owner}/${repo.repo}/git/trees/HEAD?recursive=1`,
          ),
        ]);

        // Same "is this an agent issue" filter used by IssuesPanel, applied
        // here only to decide which issues are counted/summed — no filtering
        // or sorting behavior elsewhere is changed.
        const allIssues = [...openIssues, ...closedIssues];
        const displayedIssues = allIssues.filter(
          (i) =>
            !i.pull_request &&
            (i.title?.startsWith("[Agent Call]") ||
              i.body?.includes("[Agent Call]")),
        );
        const activeIssues = displayedIssues.filter(
          (i) => i.state === "open",
        ).length;

        // Discussions = total comments across the displayed issues (mirrors
        // the same per-issue comment fetch IssuesPanel already performs).
        const commentLists = await Promise.all(
          displayedIssues
            .slice(0, 20)
            .map((issue) =>
              ghFetch(
                `/repos/${repo.owner}/${repo.repo}/issues/${issue.number}/comments`,
              ).catch(() => []),
            ),
        );
        const discussions = commentLists.reduce(
          (sum, list) => sum + (list?.length || 0),
          0,
        );

        const files = (treeData?.tree || []).filter(
          (f) => f.type === "blob",
        ).length;

        if (!cancelled) {
          setStats({
            activeIssues,
            pullRequests: prs.length,
            files,
            discussions,
          });
        }
      } catch {
        /* silent — overview is a non-critical summary */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, [repo, refreshTick]);

  const cards = [
    { key: "activeIssues", label: "Active Issues", icon: IconInbox },
    { key: "pullRequests", label: "Pull Requests", icon: IconGitPullRequest },
    { key: "files", label: "Repository Files", icon: IconFile },
    { key: "discussions", label: "Discussions", icon: IconMessageCircle },
  ];

  return (
    <div className="gh-repo-overview">
      {cards.map((c) => (
        <div className="gh-overview-card" key={c.key}>
          <span className="gh-overview-card-icon">
            <c.icon size={16} />
          </span>
          <div className="gh-overview-card-body">
            <span className="gh-overview-card-value">
              {loading ? "—" : stats[c.key]}
            </span>
            <span className="gh-overview-card-label">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Issues Panel
───────────────────────────────────────────── */

function IssuesPanel({
  repo,
  currentUserEmail,
  onNewNotification,
  refreshTick,
  onRefresh,
}) {
  const [issues, setIssues] = useState([]);
  const [commentMap, setCommentMap] = useState({});
  const [loading, setLoading] = useState(false);
  const prevCommentCounts = useRef({});

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
        (i) =>
          !i.pull_request &&
          (i.title?.startsWith("[Agent Call]") ||
            i.body?.includes("[Agent Call]")),
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
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues, refreshTick]);

  useEffect(() => {
    for (const [numStr, comments] of Object.entries(commentMap)) {
      const num = Number(numStr);
      const issue = issues.find((i) => i.number === num);
      if (!issue) continue;
      const email = extractEmail(issue.body || "");
      if (
        !email ||
        email.toLowerCase() !== (currentUserEmail || "").toLowerCase()
      )
        continue;
      const prev = prevCommentCounts.current[num] ?? comments.length;
      if (comments.length > prev) {
        const last = comments[comments.length - 1];
        onNewNotification({
          id: `${num}-${comments.length}`,
          issueNumber: num,
          issueTitle: issue.title,
          commenter: last.user?.login,
          preview: last.body?.slice(0, 120),
          url: "#",
          repoLabel: `${repo.owner}/${repo.repo}`,
          ts: Date.now(),
        });
      }
      prevCommentCounts.current[num] = comments.length;
    }
  }, [commentMap, issues, currentUserEmail, onNewNotification]);

  if (loading && issues.length === 0)
    return (
      <div className="gh-status-loading">
        <span className="status-spinner" />
        Loading issues…
      </div>
    );
  if (issues.length === 0)
    return (
      <div className="gh-status-empty">
        <IconInbox size={26} />
        <p>No open agent issues in this repository.</p>
      </div>
    );

  return (
    <div className="gh-issues-list">
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

/* ─────────────────────────────────────────────
   Pull Requests Panel
───────────────────────────────────────────── */

function PRFileList({ owner, repo, prNumber }) {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=50`)
      .then(setFiles)
      .catch((e) => setError(e.message));
  }, [owner, repo, prNumber]);

  if (error)
    return (
      <p className="gh-pr-files-error">
        <IconAlertTriangle size={13} />
        Could not load files: {error}
      </p>
    );
  if (!files)
    return (
      <p className="gh-pr-files-loading">
        <span className="status-spinner" />
        Loading changed files…
      </p>
    );
  if (files.length === 0)
    return <p className="gh-pr-files-empty">No changed files.</p>;

  return (
    <ul className="gh-pr-files-list">
      {files.map((f) => (
        <li key={f.filename} className={`gh-pr-file gh-pr-file--${f.status}`}>
          <span className="gh-pr-file-status">{f.status}</span>
          <span className="gh-pr-file-name">{f.filename}</span>
          <span className="gh-pr-file-stats">
            {f.additions > 0 && (
              <span className="gh-pr-adds">+{f.additions}</span>
            )}
            {f.deletions > 0 && (
              <span className="gh-pr-dels">−{f.deletions}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

const PING_MARKER = "Sent via the UBS Dev Portal";

function PingConfirmModal({ pr, onConfirm, onCancel }) {
  return (
    <div className="gh-modal-overlay" onClick={onCancel}>
      <div className="gh-modal" onClick={(e) => e.stopPropagation()}>
        <p className="gh-modal-title">
          <IconGitPullRequest size={16} /> Ping to merge?
        </p>
        <div className="gh-modal-body">
          <p className="gh-modal-pr-title">{pr.title}</p>
          <p className="gh-modal-pr-meta">
            #{pr.number} · {pr.user?.login} · {pr.head?.ref} → {pr.base?.ref}
          </p>
          <p className="gh-modal-description">
            This will post a comment on the PR asking the author to review and
            merge it.
          </p>
        </div>
        <div className="gh-modal-actions">
          <button type="button" className="gh-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="gh-modal-confirm"
            onClick={onConfirm}
          >
            Send ping
          </button>
        </div>
      </div>
    </div>
  );
}

function PRRow({ pr, owner, repo, user }) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pingStatus, setPingStatus] = useState(null);
  const [pingError, setPingError] = useState(null);
  const [pings, setPings] = useState(null);
  const [pingsOpen, setPingsOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const createdAt = new Date(pr.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const isDraft = pr.draft;
  const isMergeable = pr.mergeable === true;

  const loadPings = useCallback(async () => {
    try {
      const comments = await ghFetch(
        `/repos/${owner}/${repo}/issues/${pr.number}/comments`,
      );
      setPings(comments.filter((c) => (c.body || "").includes(PING_MARKER)));
    } catch {
      setPings([]);
    }
  }, [owner, repo, pr.number]);

  useEffect(() => {
    if (open) loadPings();
  }, [open, loadPings]);

  const refreshPings = () => {
    setPings(null);
    loadPings();
  };

  const handlePingConfirmed = async () => {
    setShowConfirm(false);
    setPingStatus("sending");
    setPingError(null);
    try {
      const sender = user?.name || user?.email || "A team member";
      const body = `👋 **Merge request** from ${sender}\n\nThis PR is ready for review and merge. Please take a look when you get a chance.\n\n> _${PING_MARKER}_`;
      await ghFetch(`/repos/${owner}/${repo}/issues/${pr.number}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      setPingStatus("sent");
      refreshPings();
    } catch (err) {
      setPingStatus("error");
      setPingError(err.message);
    }
  };

  const handleDeletePing = async (commentId) => {
    setDeletingIds((prev) => new Set(prev).add(commentId));
    try {
      await ghFetch(`/repos/${owner}/${repo}/issues/comments/${commentId}`, {
        method: "DELETE",
      });
      setPings((prev) => (prev || []).filter((c) => c.id !== commentId));
      if (pingStatus === "sent") setPingStatus(null);
    } catch {
      /* silent */
    } finally {
      setDeletingIds((prev) => {
        const s = new Set(prev);
        s.delete(commentId);
        return s;
      });
    }
  };

  return (
    <>
      {showConfirm && (
        <PingConfirmModal
          pr={pr}
          onConfirm={handlePingConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div
        className={`gh-pr-card${open ? " gh-pr-card--open" : ""}${isDraft ? " gh-pr-card--draft" : ""}`}
      >
        <button
          type="button"
          className="gh-pr-card-header"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="gh-pr-icon">
            <IconGitBranch size={16} />
          </span>
          <div className="gh-pr-info">
            <span className="gh-pr-title">
              {isDraft && <span className="gh-pr-draft-tag">Draft</span>}
              {pr.title}
            </span>
            <span className="gh-pr-meta">
              #{pr.number} · {pr.user?.login} · {pr.head?.ref} → {pr.base?.ref}{" "}
              · {createdAt}
              {pr.comments > 0 && (
                <>
                  {" "}
                  · <IconMessageCircle size={12} /> {pr.comments}
                </>
              )}
            </span>
          </div>
          <div
            className="gh-pr-card-actions"
            onClick={(e) => e.stopPropagation()}
          >
            {pingStatus === "sent" ? (
              <span className="gh-ping-sent">
                <IconCheck size={13} /> Pinged
              </span>
            ) : (
              <button
                type="button"
                className="gh-ping-btn"
                disabled={pingStatus === "sending"}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                title="Post a comment on this PR asking the owner to merge it"
              >
                {pingStatus === "sending" ? "Pinging…" : "Ping to merge"}
              </button>
            )}
            <span className="gh-pr-open-link" title="Links disabled in sandbox">
              <IconExternalLink size={14} />
            </span>
          </div>
          <span className={`gh-chevron${open ? " open" : ""}`}>
            <IconChevronRight size={16} />
          </span>
        </button>

        {pingStatus === "error" && (
          <p className="gh-ping-error">
            <IconAlertTriangle size={13} />
            Failed to ping: {pingError}
          </p>
        )}

        {open && (
          <div className="gh-pr-card-body">
            {isMergeable && (
              <div className="gh-pr-mergeable-banner">
                <IconCheckCircle size={15} /> No merge conflicts — ready to
                merge.
              </div>
            )}
            {pr.mergeable === false && (
              <div className="gh-pr-conflict-banner">
                <IconAlertTriangle size={15} /> This branch has conflicts with
                the base branch.
              </div>
            )}

            {pr.body ? (
              <div className="gh-pr-description">
                <p className="gh-pr-section-label">Description</p>
                <pre className="gh-pr-body-pre">{pr.body}</pre>
              </div>
            ) : (
              <p className="gh-pr-no-body">No description provided.</p>
            )}

            <div className="gh-pr-files-section">
              <p className="gh-pr-section-label">Changed files</p>
              <PRFileList owner={owner} repo={repo} prNumber={pr.number} />
            </div>

            <div className="gh-pr-pings-section">
              <button
                type="button"
                className="gh-comments-toggle"
                onClick={() => setPingsOpen((v) => !v)}
              >
                <span
                  className={`gh-advanced-arrow${pingsOpen ? " open" : ""}`}
                >
                  <IconChevronRight size={14} />
                </span>
                {pingsOpen ? "Hide" : "Show"} pings
                {pings !== null && pings.length > 0 && ` (${pings.length})`}
              </button>
              {pingsOpen && (
                <div className="gh-pings-list">
                  {pings === null && (
                    <p className="gh-pings-loading">
                      <span className="status-spinner" />
                      Loading…
                    </p>
                  )}
                  {pings !== null && pings.length === 0 && (
                    <p className="gh-pings-empty">No pings sent yet.</p>
                  )}
                  {pings !== null &&
                    pings.map((c) => (
                      <div key={c.id} className="gh-ping-item">
                        <div className="gh-ping-item-info">
                          <span className="gh-ping-item-author">
                            {c.user?.login}
                          </span>
                          <span className="gh-ping-item-time">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="gh-ping-delete-btn"
                          disabled={deletingIds.has(c.id)}
                          onClick={() => handleDeletePing(c.id)}
                          title="Delete this ping"
                        >
                          {deletingIds.has(c.id) ? "…" : <IconX size={13} />}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function PRsPanel({ repo, user, refreshTick }) {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stateFilter, setStateFilter] = useState("open");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ghFetch(
      `/repos/${repo.owner}/${repo.repo}/pulls?state=${stateFilter}&per_page=30`,
    )
      .then(setPrs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [repo, stateFilter]);

  useEffect(() => {
    load();
  }, [load, refreshTick]);

  return (
    <div className="gh-prs-panel">
      <div className="gh-prs-filter-row">
        {["open", "closed", "all"].map((s) => (
          <button
            key={s}
            type="button"
            className={`gh-prs-filter-btn${stateFilter === s ? " gh-prs-filter-btn--active" : ""}`}
            onClick={() => setStateFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="gh-status-loading">
          <span className="status-spinner" />
          Loading pull requests…
        </div>
      )}
      {error && (
        <div className="gh-explorer-error">
          <IconAlertTriangle size={14} />
          Could not load PRs: {error}
        </div>
      )}
      {!loading && !error && prs.length === 0 && (
        <div className="gh-status-empty">
          <IconGitPullRequest size={26} />
          <p>
            No {stateFilter === "all" ? "" : stateFilter + " "}pull requests.
          </p>
        </div>
      )}
      {!loading && !error && prs.length > 0 && (
        <div className="gh-pr-list">
          {prs.map((pr) => (
            <PRRow
              key={pr.number}
              pr={pr}
              owner={repo.owner}
              repo={repo.repo}
              user={user}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Notification Bell (top-bar)
───────────────────────────────────────────── */

function NotificationBell({ notifications, onDismiss, onDismissAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [wiggle, setWiggle] = useState(false);
  const count = notifications.length;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setWiggle(true);
      setTimeout(() => setWiggle(false), 800);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="gh-notif-bell-wrap" ref={ref}>
      <button
        type="button"
        className={`gh-notif-bell${wiggle ? " gh-notif-bell--wiggle" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`${count} notifications`}
      >
        <IconBell size={18} />
        {count > 0 && <span className="gh-notif-count">{count}</span>}
      </button>

      <div
        className={`gh-notif-dropdown${open ? " gh-notif-dropdown--open" : ""}`}
      >
        <div className="gh-notif-dropdown-header">
          <span>Notifications</span>
          {count > 0 && (
            <button
              type="button"
              className="gh-notif-clear-all"
              onClick={onDismissAll}
            >
              Clear all
            </button>
          )}
        </div>
        {count === 0 ? (
          <p className="gh-notif-empty">No new notifications</p>
        ) : (
          <ul className="gh-notif-list">
            {notifications.map((n) => (
              <li key={n.id} className="gh-notif-item">
                <div className="gh-notif-item-top">
                  <span className="gh-notif-link">{n.issueTitle}</span>
                  <button
                    type="button"
                    className="gh-notif-dismiss"
                    onClick={() => onDismiss(n.id)}
                    aria-label="Dismiss"
                  >
                    <IconX size={13} />
                  </button>
                </div>
                <p className="gh-notif-meta">
                  <strong>{n.commenter}</strong> commented · {n.repoLabel}#
                  {n.issueNumber}
                </p>
                {n.preview && <p className="gh-notif-preview">"{n.preview}"</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Floating Notification Toast (bottom-right)
───────────────────────────────────────────── */

function NotificationToast({ notifications, onDismiss, onDismissAll }) {
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const count = notifications.length;
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setWiggle(true);
      setTimeout(() => setWiggle(false), 800);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    if (count === 0) return;
    const id = setInterval(() => {
      setWiggle(true);
      setTimeout(() => setWiggle(false), 800);
    }, 60_000);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0 && !open) return null;

  return (
    <div className="gh-toast-wrap">
      <div className={`gh-toast-panel${open ? " gh-toast-panel--open" : ""}`}>
        <div className="gh-notif-dropdown-header">
          <span>Notifications</span>
          {count > 0 && (
            <button
              type="button"
              className="gh-notif-clear-all"
              onClick={onDismissAll}
            >
              Clear all
            </button>
          )}
        </div>
        {count === 0 ? (
          <p className="gh-notif-empty">No new notifications</p>
        ) : (
          <ul className="gh-notif-list">
            {notifications.map((n) => (
              <li key={n.id} className="gh-notif-item">
                <div className="gh-notif-item-top">
                  <span className="gh-notif-link">{n.issueTitle}</span>
                  <button
                    type="button"
                    className="gh-notif-dismiss"
                    onClick={() => onDismiss(n.id)}
                    aria-label="Dismiss"
                  >
                    <IconX size={13} />
                  </button>
                </div>
                <p className="gh-notif-meta">
                  <strong>{n.commenter}</strong> · {n.repoLabel}#{n.issueNumber}
                </p>
                {n.preview && <p className="gh-notif-preview">"{n.preview}"</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        className={`gh-toast-btn${wiggle ? " gh-notif-bell--wiggle" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <IconBell size={17} />{" "}
        {count > 0 && (
          <span className="gh-notif-count gh-notif-count--toast">{count}</span>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Repo Workspace (sidebar layout)
───────────────────────────────────────────── */

const WORKSPACE_TABS = [
  { id: "issues", label: "Issues", Icon: IconMessageCircle },
  { id: "prs", label: "Pull Requests", Icon: IconGitPullRequest },
  { id: "create", label: "New Issue", Icon: IconPlus },
];

function RepoWorkspace({
  repo,
  user,
  notifications,
  onNewNotification,
  onBack,
  onDismiss,
  onDismissAll,
}) {
  const [tab, setTab] = useState("issues");
  const [displayTab, setDisplayTab] = useState("issues");
  const [tabFading, setTabFading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [entering, setEntering] = useState(true);
  const tabSwapTimerRef = useRef(null);
  const ghTabRefs = useRef({});
  const [ghTabIndicator, setGhTabIndicator] = useState(null);
  const [lastSync, setLastSync] = useState(new Date());
  // NEW: sidebar collapse/expand state — purely presentational, does not
  // touch any existing data flow, selection, or explorer logic.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntering(false), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(
    () => () => {
      if (tabSwapTimerRef.current) clearTimeout(tabSwapTimerRef.current);
    },
    [],
  );

  // Auto-poll
  useEffect(() => {
    const id = setInterval(() => setRefreshTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = ghTabRefs.current[tab];
    if (el) setGhTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const handleTabChange = useCallback(
    (nextTab) => {
      if (nextTab === tab) return;
      setTab(nextTab);
      setTabFading(true);
      if (tabSwapTimerRef.current) clearTimeout(tabSwapTimerRef.current);
      tabSwapTimerRef.current = setTimeout(() => {
        setDisplayTab(nextTab);
        setTabFading(false);
      }, 280);
    },
    [tab],
  );

  const handleIssueCreated = () => {
    handleTabChange("issues");
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className={`gh-workspace${entering ? " gh-workspace--entering" : ""}`}>
      <div className="gh-workspace-header">
        <div className="gh-workspace-header-left">
          <button
            type="button"
            className="gh-back-btn"
            onClick={onBack}
            title="Back to repository selection"
          >
            <IconArrowLeft size={15} />{" "}
            <span className="gh-back-btn-label">Back to Repositories</span>
          </button>
          <span className="gh-workspace-repo-label">
            <span className="gh-workspace-repo-icon">
              <IconPackage size={15} />
            </span>
            {repo.owner}/{repo.repo}
          </span>
        </div>
        <div className="gh-workspace-header-right">
          <NotificationBell
            notifications={notifications}
            onDismiss={onDismiss}
            onDismissAll={onDismissAll}
          />
          <div className="gh-view-tabs">
            {ghTabIndicator && (
              <div
                className="gh-view-tab-indicator"
                style={{
                  left: ghTabIndicator.left,
                  width: ghTabIndicator.width,
                }}
              />
            )}
            {WORKSPACE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                ref={(el) => {
                  ghTabRefs.current[t.id] = el;
                }}
                className={`gh-view-tab${tab === t.id ? " gh-view-tab--active" : ""}`}
                onClick={() => handleTabChange(t.id)}
              >
                <t.Icon size={14} />{" "}
                <span className="gh-view-tab-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="gh-workspace-body">
        {/* NEW: gh-sidebar--collapsed toggles the collapsed visual state via CSS
            (width + hidden labels). No existing markup/props were removed. */}
        <aside
          className={`gh-sidebar${sidebarCollapsed ? " gh-sidebar--collapsed" : ""}`}
        >
          {/* NEW: header row now wraps the existing "Files" title plus a
              collapse/expand toggle button. Title text/markup unchanged. */}
          <div className="gh-sidebar-header">
            <div className="gh-sidebar-title">Files</div>
            <button
              type="button"
              className="gh-sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <IconChevronRight
                size={14}
                className={`gh-sidebar-collapse-icon${sidebarCollapsed ? "" : " gh-sidebar-collapse-icon--open"}`}
              />
            </button>
          </div>
          <div className="gh-sidebar-explorer">
            <FileExplorer
              owner={repo.owner}
              repo={repo.repo}
              onSelect={() => {}}
              selected={[]}
            />
          </div>
        </aside>

        <main className="gh-workspace-main">
          <div
            className={`gh-tab-panel${tabFading ? " gh-tab-panel--fading" : ""}`}
          >
            {displayTab === "issues" && (
              <>
                <div className="gh-panel-header">
                  <h3 className="gh-panel-title">Open Agent Issues</h3>

                  <div className="gh-panel-actions">
                    <span className="gh-sync-time">
                      Last synced {formatRelativeTime(lastSync)}
                    </span>

                    <button
                      type="button"
                      className="gh-refresh-btn"
                      onClick={() => {
                        setLastSync(new Date());
                        setRefreshTick((t) => t + 1);
                      }}
                      title="Refresh"
                    >
                      <IconRefresh size={15} />
                    </button>
                  </div>
                </div>
                {/* NEW: Repository Overview summary cards, placed above the
                    issue list. "Last synced"/refresh above are unchanged. */}
                <RepoOverview repo={repo} refreshTick={refreshTick} />
                <IssuesPanel
                  repo={repo}
                  currentUserEmail={user?.email || ""}
                  onNewNotification={onNewNotification}
                  refreshTick={refreshTick}
                  onRefresh={() => setRefreshTick((t) => t + 1)}
                />
              </>
            )}
            {displayTab === "prs" && (
              <>
                <div className="gh-panel-header">
                  <h3 className="gh-panel-title">Pull Requests</h3>

                  <div className="gh-panel-actions">
                    <span className="gh-sync-time">
                      Last synced {formatRelativeTime(lastSync)}
                    </span>

                    <button
                      type="button"
                      className="gh-refresh-btn"
                      onClick={() => {
                        setLastSync(new Date());
                        setRefreshTick((t) => t + 1);
                      }}
                      title="Refresh"
                    >
                      <IconRefresh size={15} />
                    </button>
                  </div>
                </div>

                <PRsPanel repo={repo} user={user} refreshTick={refreshTick} />
              </>
            )}
            {displayTab === "create" && (
              <>
                <div className="gh-panel-header">
                  <h3 className="gh-panel-title">New Agent Issue</h3>
                </div>
                <IssueForm
                  repo={repo}
                  onCreated={handleIssueCreated}
                  userEmail={user?.email || ""}
                />
              </>
            )}
          </div>
        </main>
      </div>

      <NotificationToast
        notifications={notifications}
        onDismiss={onDismiss}
        onDismissAll={onDismissAll}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Repo Selector
───────────────────────────────────────────── */

function RepoSelector({ onSelect }) {
  const [search, setSearch] = useState("");
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    mockFetchTrackedRepos()
      .then(setRepos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="gh-selector">
      <div className="gh-selector-intro">
        <h1 className="gh-selector-heading">Repository Dashboard</h1>
        <p className="gh-selector-subheading">
          Choose a repository to manage AI issues, pull requests and workflow.
        </p>
      </div>

      <div className="gh-selector-search-wrap">
        <span className="gh-selector-search-icon">
          <IconSearch size={16} />
        </span>
        <input
          className="gh-selector-search"
          placeholder="Search by repository name or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {loading && (
        <div className="gh-status-loading">
          <span className="status-spinner" />
          Loading repositories…
        </div>
      )}
      {error && (
        <div className="gh-explorer-error">
          <IconAlertTriangle size={14} />
          Could not load repos: {error}
        </div>
      )}

      {!loading && !error && repos.length === 0 && (
        <div className="gh-status-empty gh-status-empty--page">
          <IconPackage size={28} />
          <p>No tracked repositories yet.</p>
        </div>
      )}

      <div className="gh-repo-grid">
        {filtered.map((r) => (
          <button
            key={r.slug}
            type="button"
            className="gh-repo-card"
            onClick={() => onSelect(r)}
          >
            <div className="gh-repo-card-face">
              <div className="gh-repo-card-icon">
                <IconPackage size={18} />
              </div>
              <div className="gh-repo-card-body">
                <strong className="gh-repo-card-name">{r.name}</strong>
                <span className="gh-repo-handle">
                  {r.owner}/{r.repo}
                </span>
              </div>
              <span className="gh-repo-card-arrow">
                <IconChevronRight size={16} />
              </span>
            </div>
            <div className="gh-repo-card-desc-layer">
              <h4>Repository</h4>
              <p>
                {r.owner}/{r.repo}
              </p>
              <span>Click to open workspace</span>
            </div>
          </button>
        ))}
        {!loading && filtered.length === 0 && repos.length > 0 && (
          <div className="gh-status-empty gh-status-empty--page">
            <IconSearch size={26} />
            <p>No repositories found "{search}"</p>
            <span className="gh-status-empty-hint">
              Try searching by repository owner or repository name.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Root
───────────────────────────────────────────── */

export default function GithubWorkflowSandbox({ user }) {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((n) => {
    setNotifications((prev) =>
      prev.find((x) => x.id === n.id) ? prev : [n, ...prev],
    );
  }, []);
  const dismissNotification = useCallback(
    (id) => setNotifications((prev) => prev.filter((n) => n.id !== id)),
    [],
  );
  const dismissAll = useCallback(() => setNotifications([]), []);

  if (!selectedRepo) {
    return <RepoSelector onSelect={setSelectedRepo} />;
  }

  return (
    <RepoWorkspace
      repo={selectedRepo}
      user={user}
      notifications={notifications}
      onNewNotification={addNotification}
      onBack={() => setSelectedRepo(null)}
      onDismiss={dismissNotification}
      onDismissAll={dismissAll}
    />
  );
}
