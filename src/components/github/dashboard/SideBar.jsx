import {
  Home,
  GitPullRequest,
  CircleDot,
  Code,
  Settings,
  HelpCircle,
} from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { icon: Home, label: "Overview", active: true },
    { icon: CircleDot, label: "Issues" },
    { icon: GitPullRequest, label: "Pull Requests" },
    { icon: Code, label: "Repositories" },
    { icon: Settings, label: "Settings" },
    { icon: HelpCircle, label: "Help" },
  ];

  return (
    <aside
      className="hidden w-35 shrink-0 flex-col gap-4 pt-10 px-2 bg-transparent text-slate-700 shadow-[0_30px_80px_rgba(0,0,0,0.45)] dark:bg-gradient-to-b dark:from-slate-950/95 dark:to-slate-950/50 dark:text-slate-300 lg:flex m-4 top-0 animate-slide-in-left"
      style={{
        animation: "slideInFromLeft 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`flex h-14 w-full items-center justify-center rounded-3xl border text-slate-400 transition-all duration-300 hover:scale-110 active:scale-95 ${
              item.active
                ? "border-slate-700/70 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-900 shadow-sm shadow-slate-900/5 dark:border-slate-700/70 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-900/50 dark:text-sky-400 dark:shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30"
                : "border-transparent hover:border-slate-700 hover:bg-gradient-to-br hover:from-slate-100 hover:to-slate-50 hover:text-slate-900 hover:shadow-md hover:shadow-slate-900/10 dark:hover:border-slate-700 dark:hover:bg-gradient-to-br dark:hover:from-slate-900/80 dark:hover:to-slate-900/40 dark:hover:text-slate-100 dark:hover:shadow-md dark:hover:shadow-slate-950/30"
            }`}
            title={item.label}
            style={{
              animation: `slideInFromLeft 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + index * 0.05}s both`,
            }}
          >
            <item.icon
              size={20}
              className="transition-transform duration-300 group-hover:scale-125"
            />
          </button>
        ))}
      </div>
    </aside>
  );
}
