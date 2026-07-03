import { CornerDownLeft, Loader2, Send, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ChatInput({ disabled, streaming, value, onChange, onSubmit, onStop }) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submit = () => {
    if (!value.trim() || disabled || streaming) return;
    onSubmit(value);
  };

  return (
    <div className={`rounded-lg border bg-white p-3 shadow-sm ${focused ? "border-teal ring-2 ring-teal/20" : "border-slate-200"}`}>
      <textarea
        ref={textareaRef}
        className="min-h-24 w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        placeholder="Ask the AI assistant..."
        value={value}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />
      <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <CornerDownLeft className="h-3.5 w-3.5" />
          Ctrl/Command + Enter to send
        </div>
        <div className="flex items-center justify-end gap-2">
          {streaming && (
            <button type="button" className="btn-secondary px-3 py-2" onClick={onStop}>
              <XCircle className="h-4 w-4" />
              Stop
            </button>
          )}
          <button type="button" className="btn-primary px-3 py-2" disabled={disabled || streaming || !value.trim()} onClick={submit}>
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
