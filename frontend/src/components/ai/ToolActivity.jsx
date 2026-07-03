import { BarChart3, CheckCircle2, Database, Loader2, Search, TriangleAlert, WalletCards } from "lucide-react";

const categoryIcon = {
  inventory: Search,
  payroll: WalletCards,
  analytics: BarChart3,
  activity: Database,
  tasks: Database,
  system: Database
};

const statusClass = {
  running: "border-teal/30 bg-teal/5 text-teal",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700"
};

const completionLabel = {
  inventory: "Inventory queried",
  payroll: "Payroll analyzed",
  analytics: "Analytics reviewed",
  activity: "Activities reviewed",
  tasks: "Tasks reviewed",
  system: "System checked"
};

export default function ToolActivity({ activities = [] }) {
  if (activities.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">Tool Activity</p>
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => {
          const CategoryIcon = categoryIcon[activity.category] || Database;
          const stateClass = statusClass[activity.status] || statusClass.running;

          return (
            <div
              key={activity.id}
              className={`inline-flex max-w-full items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${stateClass}`}
              title={activity.error || activity.label}
            >
              {activity.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {activity.status === "success" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {activity.status === "error" && <TriangleAlert className="h-3.5 w-3.5" />}
              <CategoryIcon className="h-3.5 w-3.5" />
              <span className="truncate">
                {activity.status === "success"
                  ? completionLabel[activity.category] || `${activity.label} complete`
                  : activity.status === "error"
                    ? `${activity.label} failed`
                    : `${activity.label}...`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
