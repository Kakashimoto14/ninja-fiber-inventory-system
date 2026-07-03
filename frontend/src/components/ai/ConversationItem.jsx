import { Edit3, MessageSquare, Trash2 } from "lucide-react";

export default function ConversationItem({ conversation, active, onSelect, onRename, onDelete }) {
  return (
    <div
      className={`group rounded-md border p-3 transition ${
        active ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-teal/50"
      }`}
    >
      <button type="button" className="flex w-full items-start gap-2 text-left" onClick={onSelect}>
        <MessageSquare className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-primary" : "text-slate-400"}`} />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-950">{conversation.title}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {new Date(conversation.updatedAt || conversation.createdAt).toLocaleDateString()}
          </p>
        </div>
      </button>
      <div className="mt-2 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition group-hover:opacity-100">
        <button
          type="button"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
          onClick={onRename}
          aria-label="Rename conversation"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          onClick={onDelete}
          aria-label="Delete conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
