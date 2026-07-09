import { Sun, Moon, Bell, ChevronDown, Sparkles } from "lucide-react";
import { useTheme } from "../ThemeContext";

export default function Navbar({ onRepositoriesClick }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="fixed left-0 top-0 right-0 z-30 border-b border-[#D0D7DE] dark:border-[#30363D] bg-gradient-to-r from-white to-slate-50/80 dark:bg-gradient-to-r dark:from-[#0D1117] dark:to-[#010409] px-6 py-3 flex items-center justify-between transition-all duration-300 shadow-sm shadow-slate-900/5 dark:shadow-slate-950/20 backdrop-blur-sm"
      style={{
        animation: "slideInFromTop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1655BE] to-[#47A3FF] text-white shadow-lg shadow-[#1655BE]/30 transition-transform duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#1655BE]/50 animate-float">
          <Sparkles size={16} />
        </div>
        <span className="text-[11px] font-medium text-[#656D76] dark:text-[#8B949E]">
          <span className="text-[#1F2328] dark:text-[#E6EDF3] font-semibold">
            GitHub Workflow Sandbox
          </span>
        </span>
        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-full border border-emerald-500/30 transition-all duration-300 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
          Fleet Status: 4 Active
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRepositoriesClick}
          className="rounded-full border border-slate-200/70 bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-2 text-sm font-semibold hover:cursor-pointer text-slate-700 transition-all duration-300 hover:border-[#0969DA] hover:text-[#0969DA] hover:shadow-lg hover:shadow-[#0969DA]/20 hover:-translate-y-0.5 dark:border-slate-800 dark:bg-gradient-to-r dark:from-[#161B22] dark:to-[#0D1117] dark:text-slate-200 dark:hover:border-[#58A6FF] dark:hover:text-[#58A6FF] dark:hover:shadow-lg dark:hover:shadow-[#58A6FF]/20"
        >
          Repositories
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[#F6F8FA] dark:hover:bg-[#161B22] transition-all duration-300 hover:cursor-pointer hover:shadow-md hover:scale-110 active:scale-95"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="p-2 rounded-lg hover:bg-[#F6F8FA] dark:hover:bg-[#161B22] transition-all duration-300 relative hover:cursor-pointer hover:shadow-md hover:scale-110 active:scale-95 group">
          <Bell
            size={16}
            className="group-hover:scale-110 transition-transform duration-300"
          />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#0969DA] to-[#1F6FEB] shadow-lg shadow-[#0969DA]/50 animate-pulse" />
        </button>
        <div className="w-px h-6 bg-gradient-to-b from-[#D0D7DE]/50 via-[#D0D7DE] to-[#D0D7DE]/50 dark:from-[#30363D]/50 dark:via-[#30363D] dark:to-[#30363D]/50" />
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:cursor-pointer hover:bg-[#F6F8FA] dark:hover:bg-[#161B22] transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0969DA] to-[#1F6FEB] flex items-center justify-center text-white text-[11px] font-semibold shadow-lg shadow-[#0969DA]/30 group-hover:shadow-xl group-hover:shadow-[#0969DA]/50 transition-all duration-300 group-hover:scale-110">
            SU
          </div>
          <span className="text-[12.5px] font-medium hidden sm:inline">
            Sandbox User
          </span>
          <ChevronDown
            size={14}
            className="text-[#656D76] transition-transform duration-300 group-hover:rotate-180"
          />
        </button>
      </div>
    </header>
  );
}
