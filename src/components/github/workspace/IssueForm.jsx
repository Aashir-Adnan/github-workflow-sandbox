import { useState } from "react";
import {
  ChevronRight,
  X,
  Sparkles,
  AlertCircle,
  FileText,
  Tag,
} from "lucide-react";
import { ghFetch, buildIssueBody } from "../api";
import FileExplorer from "./FileExplorer";

const TYPES = ["", "Code Writer", "Code Reviewer", "Code Suggester"];
const PRIORITIES = ["", "Immediate", "High", "Normal", "Low", "Minimal"];

const inputClass = `
  w-full rounded-lg border border-[#D0D7DE] dark:border-[#30363D]
  bg-white dark:bg-[#0D1117] text-[#1F2328] dark:text-[#E6EDF3]
  px-3.5 py-2.5 text-[13px] outline-none
  focus:border-[#0969DA] dark:focus:border-[#1F6FEB]
  focus:ring-2 focus:ring-[#0969DA]/20 dark:focus:ring-[#1F6FEB]/20
  transition placeholder:text-[#8B949E] dark:placeholder:text-[#6E7681]
`;

export default function IssueForm({ repo, onCreated, userEmail }) {
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
      const issue = await ghFetch(`/repos/${repo.owner}/${repo.repo}/issues`, {
        method: "POST",
        body: JSON.stringify({ title: `[Agent Call] ${title.trim()}`, body }),
      });
      setTitle("");
      setTask("");
      setContext([]);
      setType("");
      setPriority("Normal");
      setShowAdvanced(false);
      setShowExplorer(false);
      onCreated(issue);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl w-full mx-auto">
      <div className="rounded-2xl bg-gradient-to-r from-white/60 to-slate-50 dark:from-[#07101a] dark:to-[#07131a] p-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/10 text-amber-600">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              New Agent Issue
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Give the agent a clear title and an actionable description.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-semibold text-amber-600">
              Issue title
            </label>
            <div className="mt-2">
              <input
                className={
                  inputClass +
                  " text-2xl font-semibold px-4 py-3 bg-transparent"
                }
                placeholder="e.g. Add structured error logging"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <span className="italic">Start with a verb, be specific.</span>
                <span>{title.length}/120</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-600">
              Description
            </label>
            <textarea
              className={
                inputClass +
                " mt-2 min-h-[300px] px-4 py-4 bg-transparent resize-y"
              }
              placeholder="Describe exactly what should be done. Mention files, constraints, and expected outputs."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Tip: include examples or expected outputs when possible.
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-[13px]">{error}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setTask("");
              setContext([]);
              setType("");
              setPriority("Normal");
            }}
            className="px-4 py-2 rounded-md border border-slate-200 dark:border-[#2b2f36] text-sm text-slate-700 dark:text-slate-300"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !task.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md shadow"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Create issue
          </button>
        </div>
      </div>
    </form>
  );
}
