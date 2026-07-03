import { Bot, MessageSquarePlus } from "lucide-react";

export default function EmptyState({ onPrompt }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Bot className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-extrabold text-slate-950">Start a business query</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        Ask about scheduled tasks, inventory health, payroll summaries, activity logs, or business performance.
      </p>
      <button
        type="button"
        className="btn-primary mt-5"
        onClick={() => onPrompt?.("Help me plan today's ISP operations priorities.")}
      >
        <MessageSquarePlus className="h-4 w-4" />
        Start Conversation
      </button>
    </div>
  );
}
