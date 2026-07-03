import { AlertCircle } from "lucide-react";

export default function ErrorState({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="font-semibold">{message}</p>
      </div>
      {onDismiss && (
        <button type="button" className="text-xs font-extrabold uppercase tracking-wide" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}
