import { MessageSquarePlus } from "lucide-react";
import ConversationItem from "./ConversationItem.jsx";

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  onNew,
  onSelect,
  onRename,
  onDelete
}) {
  return (
    <aside className="flex h-[calc(100vh-10rem)] min-h-[520px] flex-col rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-950">Conversation History</h2>
          <p className="mt-1 text-xs text-slate-500">{conversations.length} saved</p>
        </div>
        <button type="button" className="rounded-md p-2 text-primary hover:bg-primary/10" onClick={onNew} aria-label="New conversation">
          <MessageSquarePlus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
        {conversations.length === 0 && (
          <p className="rounded-md border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500">
            No conversations yet.
          </p>
        )}
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
            active={conversation._id === activeConversationId}
            onSelect={() => onSelect(conversation._id)}
            onRename={() => onRename(conversation)}
            onDelete={() => onDelete(conversation)}
          />
        ))}
      </div>
    </aside>
  );
}
