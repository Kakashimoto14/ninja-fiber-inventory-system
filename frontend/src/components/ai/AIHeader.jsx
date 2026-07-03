import { Eraser, Trash2 } from "lucide-react";

export default function AIHeader({ activeConversation, streaming, onClear, onDelete }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold text-slate-950">AI Assistant</h1>
        <p className="mt-1 truncate text-sm font-medium text-slate-500">
          {activeConversation?.title || "Ask about tasks, inventory, payroll, activity, and operations."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-md px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${
            streaming ? "bg-teal/10 text-teal" : "bg-slate-100 text-slate-500"
          }`}
        >
          {streaming ? "Streaming" : "Ready"}
        </span>
        <button type="button" className="btn-secondary px-3 py-2" onClick={onClear}>
          <Eraser className="h-4 w-4" />
          Clear
        </button>
        {activeConversation && (
          <button type="button" className="btn-secondary px-3 py-2 text-red-600 hover:border-red-200 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
