import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage.jsx";
import EmptyState from "./EmptyState.jsx";
import ExecutionTimeline from "./ExecutionTimeline.jsx";
import ToolActivity from "./ToolActivity.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

export default function ChatWindow({
  messages,
  streamingContent,
  streaming,
  toolActivities,
  executionEvents,
  onPrompt,
  onRetry
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !streamingContent) {
    return <EmptyState onPrompt={onPrompt} />;
  }

  return (
    <section className="flex h-[calc(100vh-21rem)] min-h-[430px] flex-col rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex-1 space-y-5 overflow-y-auto pr-2">
        {messages.map((message) => (
          <ChatMessage key={message._id || message.localId} message={message} onRetry={message.role === "assistant" ? onRetry : undefined} />
        ))}
        <ExecutionTimeline events={executionEvents} />
        <ToolActivity activities={toolActivities} />
        {streamingContent && (
          <ChatMessage
            message={{ localId: "streaming-response", role: "assistant", content: streamingContent, status: "streaming" }}
          />
        )}
        {streaming && !streamingContent && <TypingIndicator />}
        <div ref={scrollRef} />
      </div>
    </section>
  );
}
