import { Package, ArrowUpRight, Star, GitBranch } from "lucide-react";

export default function RepositoryCard({ repository, onClick, index = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-50/50 p-5 text-left shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-2 hover:border-[#0969DA] hover:shadow-[0_20px_60px_rgba(9,105,218,0.25)] dark:border-slate-800/80 dark:bg-gradient-to-br dark:from-[#010409]/80 dark:to-[#010409]/40 dark:shadow-slate-950/20 dark:hover:border-[#58A6FF] dark:hover:shadow-[0_20px_60px_rgba(88,166,255,0.25)] hover:cursor-pointer animate-slide-in-bottom`}
      style={{
        animationDelay: `${index * 0.1}s`,
        opacity: 0,
        animation: `slideInFromBottom 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s forwards`,
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0969DA]/10 via-transparent to-[#1F6FEB]/5 opacity-0 transition-all duration-500 group-hover:opacity-100 pointer-events-none" />

      {/* Animated border glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0969DA]/0 via-[#0969DA]/0 to-[#0969DA]/0 rounded-[1.5rem] opacity-0 blur group-hover:opacity-100 group-hover:from-[#0969DA]/30 group-hover:via-[#0969DA]/20 group-hover:to-[#0969DA]/0 transition-all duration-500 -z-10" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0969DA]/15 to-[#1F6FEB]/15 text-[#0969DA] dark:bg-gradient-to-br dark:from-[#1F6FEB]/20 dark:to-[#0969DA]/10 dark:text-[#58A6FF] transition-all duration-300 group-hover:from-[#0969DA]/30 group-hover:to-[#1F6FEB]/25 dark:group-hover:from-[#1F6FEB]/40 dark:group-hover:to-[#0969DA]/20 group-hover:shadow-lg group-hover:shadow-[#0969DA]/30">
            <Package
              size={22}
              strokeWidth={1.75}
              className="transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white transition-colors group-hover:text-[#0969DA] dark:group-hover:text-[#58A6FF]">
              {repository.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-mono break-words">
              {repository.owner}/{repository.repo}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-gradient-to-r dark:from-slate-950 dark:to-slate-900 dark:text-slate-300 transition-all duration-300 group-hover:scale-110 group-hover:border-[#0969DA]/50 dark:group-hover:border-[#58A6FF]/50">
          active
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400 transition-colors">
        A curated repository workspace with agent-driven issues and review-ready
        pull requests.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-slate-700 shadow-sm shadow-slate-900/5 dark:bg-slate-950/80 dark:text-slate-300 dark:shadow-slate-950/20 transition-all duration-300 group-hover:shadow-md group-hover:shadow-slate-900/10 dark:group-hover:shadow-slate-900/40">
          <Star size={14} className="text-[#f59e0b]" /> 5 stars
        </span>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-slate-700 shadow-sm shadow-slate-900/5 dark:bg-slate-950/80 dark:text-slate-300 dark:shadow-slate-950/20 transition-all duration-300 group-hover:shadow-md group-hover:shadow-slate-900/10 dark:group-hover:shadow-slate-900/40">
          <GitBranch size={14} className="text-[#0ea5e9]" /> main
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 transition-all duration-300 group-hover:text-[#0969DA] dark:group-hover:text-[#58A6FF]">
          <ArrowUpRight
            size={16}
            className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
          />{" "}
          Open workspace
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-900/80 dark:text-slate-400 transition-all duration-300 group-hover:bg-[#0969DA]/10 dark:group-hover:bg-[#58A6FF]/10 group-hover:text-[#0969DA] dark:group-hover:text-[#58A6FF]">
          repo details
        </span>
      </div>
    </button>
  );
}
