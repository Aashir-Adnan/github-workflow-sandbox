import { Plus } from "lucide-react";

export default function AddRepository() {
  return (
    <button
      className="
        group relative
        h-[200px]
        bg-gradient-to-br from-white to-slate-50/80 dark:bg-gradient-to-br dark:from-[#0D1117] dark:to-[#010409]
        border-2 border-dashed border-[#D0D7DE] dark:border-[#30363D]
        rounded-xl
        flex flex-col items-center justify-center gap-3
        hover:border-[#0969DA] dark:hover:border-[#58A6FF]
        hover:bg-gradient-to-br hover:from-[#F6F8FA] hover:to-slate-50 dark:hover:bg-gradient-to-br dark:hover:from-[#161B22] dark:hover:to-[#0D1117]
        transition-all duration-300
        cursor-pointer
        hover:shadow-lg hover:shadow-[#0969DA]/20 dark:hover:shadow-[#58A6FF]/20
        hover:-translate-y-1
        active:scale-95
        animate-slide-in-bottom
        overflow-hidden
      "
      style={{
        animationDelay: "0.4s",
        opacity: 0,
        animation: `slideInFromBottom 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards`,
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0969DA]/10 via-transparent to-[#1F6FEB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="w-12 h-12 rounded-full border-2 border-[#D0D7DE] dark:border-[#30363D] group-hover:border-[#0969DA] dark:group-hover:border-[#58A6FF] group-hover:scale-110 transition-all duration-300 flex items-center justify-center relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/50 dark:to-[#0D1117] group-hover:shadow-lg group-hover:shadow-[#0969DA]/40 dark:group-hover:shadow-[#58A6FF]/30">
        <Plus
          size={20}
          className="text-[#8B949E] dark:text-[#484F58] group-hover:text-[#0969DA] dark:group-hover:text-[#58A6FF] transition-all duration-300 group-hover:rotate-90 group-hover:scale-125"
        />
      </div>
      <span className="text-[13px] font-medium text-[#656D76] dark:text-[#8B949E] group-hover:text-[#0969DA] dark:group-hover:text-[#58A6FF] transition-all duration-300 group-hover:scale-110">
        Add Repository
      </span>
    </button>
  );
}
