import { ClipboardList, FileText, Lightbulb, ShieldCheck } from "lucide-react";

const actions = [
  {
    icon: ClipboardList,
    label: "Plan Operations",
    prompt: "Create a concise operations checklist for an ISP inventory and field work day."
  },
  {
    icon: FileText,
    label: "Draft Update",
    prompt: "Draft a professional business update for the team about inventory discipline and task follow-through."
  },
  {
    icon: ShieldCheck,
    label: "Policy Review",
    prompt: "List practical safeguards for using AI in inventory and payroll workflows without fabricating data."
  },
  {
    icon: Lightbulb,
    label: "Suggested Prompts",
    prompt: "Give me five useful prompts for managing a WiFi/ISP inventory business."
  }
];

export default function QuickActions({ onPrompt }) {
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-950">Quick Actions</h2>
        <span className="text-xs font-semibold text-slate-400">Foundation only</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-teal hover:bg-soft"
              onClick={() => onPrompt(action.prompt)}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal/10 text-teal">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-extrabold text-slate-800">{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
