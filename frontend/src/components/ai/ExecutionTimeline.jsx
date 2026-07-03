import { CheckCircle2, CircleDashed, Loader2, Sparkles, TriangleAlert } from "lucide-react";

const statusIcon = {
  running: Loader2,
  completed: CheckCircle2,
  failed: TriangleAlert,
  pending: CircleDashed
};

const statusClass = {
  running: "border-teal/30 bg-teal/5 text-teal",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  pending: "border-slate-200 bg-white text-slate-500"
};

export default function ExecutionTimeline({ events = [] }) {
  if (events.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-teal" />
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Execution Timeline</p>
      </div>
      <div className="space-y-2">
        {events.map((event) => {
          const Icon = statusIcon[event.status] || CircleDashed;
          const className = statusClass[event.status] || statusClass.pending;

          return (
            <div key={event.id} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${className}`}>
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${event.status === "running" ? "animate-spin" : ""}`} />
              <div className="min-w-0">
                <p className="truncate font-extrabold">{event.label}</p>
                {event.detail && <p className="mt-0.5 truncate opacity-80">{event.detail}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
