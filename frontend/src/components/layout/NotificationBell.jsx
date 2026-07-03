import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X, AlertTriangle, ClipboardList, Package, CalendarCheck } from "lucide-react";
import { mockProducts, mockTasks } from "../../data/mockData.js";
import { applyDailyReset, toDateInputValue } from "../../utils/taskReset.js";
import { useAuth } from "../../context/AuthContext.jsx";

const STORAGE_KEY = "nfi_dismissed_notifs";

export default function NotificationBell() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
    catch { return new Set(); }
  });
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = useMemo(() => {
    const notifs = [];
    const todayKey = toDateInputValue();

    // Low stock alerts
    mockProducts
      .filter((p) => p.quantity <= p.reorderPoint)
      .forEach((p) => {
        notifs.push({
          id: `lowstock-${p._id || p.id}`,
          type: "warning",
          icon: Package,
          title: "Low Stock Alert",
          body: `${p.name} — only ${p.quantity} left (reorder at ${p.reorderPoint})`,
          action: () => navigate("/app/products")
        });
      });

    // Today's tasks
    const tasks = applyDailyReset(mockTasks);
    const myTasks = account?.role === "superadmin" ? tasks : tasks.filter((t) => t.assigneeId === account?.id);
    const todayTasks = myTasks.filter((t) => {
      const d = toDateInputValue(t.date || t.dueDate || new Date());
      return d === todayKey && t.status !== "Completed";
    });

    if (todayTasks.length > 0) {
      notifs.push({
        id: `today-tasks-${todayKey}`,
        type: "info",
        icon: CalendarCheck,
        title: "Tasks Due Today",
        body: `You have ${todayTasks.length} open task${todayTasks.length > 1 ? "s" : ""} scheduled for today.`,
        action: () => navigate("/app/tasks")
      });
    }

    // Urgent pending tasks
    const urgentTasks = myTasks.filter((t) => t.priority === "Urgent" && t.status !== "Completed");
    urgentTasks.forEach((t) => {
      notifs.push({
        id: `urgent-${t._id || t.id}`,
        type: "urgent",
        icon: ClipboardList,
        title: "Urgent Task",
        body: t.title,
        action: () => navigate("/app/tasks")
      });
    });

    return notifs;
  }, [account, navigate]);

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const unread = visible.length;

  const dismiss = (id) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  };

  const dismissAll = () => {
    const next = new Set(notifications.map((n) => n.id));
    setDismissed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    setOpen(false);
  };

  const typeStyles = {
    warning: { bg: "bg-orange-50 border-orange-100", icon: "text-orange-600", dot: "bg-orange-500" },
    urgent: { bg: "bg-red-50 border-red-100", icon: "text-red-600", dot: "bg-red-500" },
    info: { bg: "bg-blue-50 border-blue-100", icon: "text-primary", dot: "bg-primary" }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id="notification-bell"
        className="relative rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:border-teal hover:text-primary transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl"
          style={{ animation: "fadeSlideIn 0.2s ease" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-extrabold text-slate-950">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
            </p>
            {visible.length > 0 && (
              <button
                type="button"
                onClick={dismissAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Bell className="h-8 w-8 text-slate-200" />
                <p className="text-sm font-semibold text-slate-400">All caught up!</p>
                <p className="text-xs text-slate-300">No new notifications</p>
              </div>
            ) : (
              visible.map((n) => {
                const style = typeStyles[n.type];
                const Icon = n.icon;
                return (
                  <div
                    key={n.id}
                    className={`group flex gap-3 border ${style.bg} p-4 transition-colors hover:brightness-98 cursor-pointer`}
                    onClick={() => { n.action?.(); setOpen(false); }}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 ${style.icon}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                      className="shrink-0 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <p className="text-[11px] text-slate-400">
              {dismissed.size > 0 && `${dismissed.size} dismissed · `}
              Low-stock, urgent & today's tasks shown
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
