import { Check, Clipboard, RefreshCw, UserRound } from "lucide-react";
import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer.jsx";

export default function ChatMessage({ message, onRetry }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.status === "error";

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content || "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          AI
        </div>
      )}

      <div className={`max-w-[min(760px,100%)] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-lg border px-4 py-3 shadow-sm ${
            isUser
              ? "border-primary bg-primary text-white"
              : isError
                ? "border-red-100 bg-red-50"
                : "border-slate-200 bg-white"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        <div className={`mt-2 flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={copyMessage}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          {!isUser && onRetry && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => onRetry(message)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal text-white">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </article>
  );
}
