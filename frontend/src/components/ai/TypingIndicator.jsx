export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500" aria-live="polite">
      <span className="h-2 w-2 animate-bounce rounded-full bg-teal" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:120ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-teal [animation-delay:240ms]" />
      <span className="ml-2">AI is typing</span>
    </div>
  );
}
