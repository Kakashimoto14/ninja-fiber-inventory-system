import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin text-teal" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

