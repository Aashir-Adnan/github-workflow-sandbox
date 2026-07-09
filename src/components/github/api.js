import { mockFetchTrackedRepos, mockGhFetch } from "../../data/mockGithubData";

export async function fetchTrackedRepos() {
  return mockFetchTrackedRepos();
}

export async function ghFetch(path, opts = {}) {
  return mockGhFetch(path, opts);
}

export function extractEmail(body = "") {
  const m = body.match(/NotifyEmail:\s*([^\s]+)/);
  return m ? m[1] : null;
}

export function getBotMarker(comment) {
  const body = comment?.body || "";
  const markerMatch = body.match(/(?:^|\n)\s*(🤖|⚠️|✅)\b/m);
  if (markerMatch?.[1]) return markerMatch[1];
  if (comment?.user?.type === "Bot") return "🤖";
  return null;
}

export function extractPrUrl(comments) {
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

export function getIssueStage(comments) {
  if (!comments || comments.length === 0) return "bot";
  const hasPrComment = comments.some((c) =>
    (c.body || "").includes("**Committed and PR opened**"),
  );
  if (hasPrComment) return "done";
  const last = comments[comments.length - 1];
  if (getBotMarker(last)) return "human";
  return "bot";
}

export function buildIssueBody({ task, context, type, priority, email }) {
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
