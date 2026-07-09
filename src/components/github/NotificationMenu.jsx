import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationMenu({
  notifications = [],
  onDismiss,
  onDismissAll,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-[#F6F8FA] dark:hover:bg-[#161B22] transition-colors"
      >
        <Bell size={16} />
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#0969DA] px-1.5 text-[10px] font-semibold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-slate-200/70 bg-white shadow-lg shadow-slate-900/10 dark:border-slate-800/70 dark:bg-[#010409]/95">
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Notifications
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {notifications.length} new
                </span>
                {onDismissAll && notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onDismissAll()}
                    className="text-xs font-semibold text-[#0969DA] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border-b border-slate-200/70 px-4 py-3 last:border-none dark:border-slate-800/70"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {notification.time}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
