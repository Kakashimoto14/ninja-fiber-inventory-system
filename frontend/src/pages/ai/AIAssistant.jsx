import { useEffect, useMemo, useRef, useState } from "react";
import AIHeader from "../../components/ai/AIHeader.jsx";
import ChatInput from "../../components/ai/ChatInput.jsx";
import ChatWindow from "../../components/ai/ChatWindow.jsx";
import ConversationSidebar from "../../components/ai/ConversationSidebar.jsx";
import ErrorState from "../../components/ai/ErrorState.jsx";
import LoadingState from "../../components/ai/LoadingState.jsx";
import { aiApi, streamAIChat } from "../../services/api.js";

const suggestedPrompts = [
  "Do I have tasks scheduled tomorrow?",
  "Generate an executive summary.",
  "Show inventory health.",
  "Review payroll summary."
];

const sortConversations = (items) =>
  [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

export default function AIAssistant() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [toolActivities, setToolActivities] = useState([]);
  const [executionEvents, setExecutionEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeConversationId),
    [activeConversationId, conversations]
  );

  const refreshConversations = async () => {
    const data = await aiApi.listConversations();
    setConversations(sortConversations(data));
    return data;
  };

  useEffect(() => {
    const load = async () => {
      try {
        await refreshConversations();
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load AI conversations.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const loadConversation = async (conversationId) => {
    if (streaming) return;

    try {
      setError("");
      setActiveConversationId(conversationId);
      const data = await aiApi.getConversation(conversationId);
      setMessages(data.messages);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load this conversation.");
    }
  };

  const startNewConversation = () => {
    if (streaming) return;
    setActiveConversationId("");
    setMessages([]);
    setPrompt("");
    setStreamingContent("");
    setToolActivities([]);
    setExecutionEvents([]);
    setError("");
  };

  const upsertConversation = (conversation) => {
    setConversations((current) => {
      const exists = current.some((item) => item._id === conversation._id);
      const next = exists
        ? current.map((item) => (item._id === conversation._id ? conversation : item))
        : [conversation, ...current];
      return sortConversations(next);
    });
  };

  const sendMessage = async (message, options = {}) => {
    const text = String(message || "").trim();
    if (!text || streaming) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setError("");
    setStreamingContent("");
    setToolActivities([]);
    setExecutionEvents([]);
    setPrompt("");

    try {
      await streamAIChat({
        signal: controller.signal,
        payload: {
          conversationId: activeConversationId || undefined,
          message: text,
          retryOfMessageId: options.retryOfMessageId
        },
        handlers: {
          planning_started: (event) => {
            setExecutionEvents((current) => [
              ...current,
              {
                id: `planning-${Date.now()}`,
                label: event.label || "Planning Request",
                status: "running"
              }
            ]);
          },
          planning_completed: (plan) => {
            setExecutionEvents((current) =>
              current.map((item) =>
                item.label === "Planning Request" && item.status === "running"
                  ? { ...item, status: "completed", detail: `${plan.steps?.length || 0} step plan` }
                  : item
              )
            );
          },
          conversation: ({ conversation, userMessage }) => {
            setActiveConversationId(conversation._id);
            upsertConversation(conversation);
            setMessages((current) => [...current, userMessage]);
          },
          step_started: (step) => {
            setExecutionEvents((current) => [
              ...current,
              {
                id: step.id,
                label: step.label,
                detail: step.tool,
                status: "running"
              }
            ]);
          },
          step_completed: (step) => {
            setExecutionEvents((current) =>
              current.map((item) =>
                item.id === step.id
                  ? { ...item, status: "completed", detail: `${step.tool} completed` }
                  : item
              )
            );
          },
          step_failed: (step) => {
            setExecutionEvents((current) =>
              current.map((item) =>
                item.id === step.id
                  ? { ...item, status: "failed", detail: step.error || `${step.tool} failed` }
                  : item
              )
            );
          },
          reasoning_started: (event) => {
            setExecutionEvents((current) => [
              ...current,
              {
                id: `reasoning-${Date.now()}`,
                label: event.label || "Generating Recommendations",
                status: "running"
              }
            ]);
          },
          reasoning_completed: (event) => {
            setExecutionEvents((current) =>
              current.map((item) =>
                item.label === "Generating Recommendations" && item.status === "running"
                  ? {
                      ...item,
                      status: "completed",
                      detail: `${event.findings || 0} findings, ${event.recommendations || 0} recommendations`
                    }
                  : item
              )
            );
          },
          response_started: (event) => {
            setExecutionEvents((current) => [
              ...current,
              {
                id: `response-${Date.now()}`,
                label: event.label || "Preparing Response",
                status: "running"
              }
            ]);
          },
          response_completed: () => {
            setExecutionEvents((current) =>
              current.map((item) =>
                item.label === "Preparing Response" && item.status === "running"
                  ? { ...item, status: "completed", detail: "Completed" }
                  : item
              )
            );
          },
          token: ({ token }) => {
            setStreamingContent((current) => `${current}${token}`);
          },
          tool_start: (tool) => {
            setToolActivities((current) => [
              ...current,
              {
                id: `${tool.name}-${Date.now()}`,
                name: tool.name,
                label: tool.label,
                category: tool.category,
                status: "running"
              }
            ]);
          },
          tool_done: (tool) => {
            setToolActivities((current) =>
              current.map((item) =>
                item.name === tool.name && item.status === "running"
                  ? { ...item, status: "success", durationMs: tool.durationMs }
                  : item
              )
            );
          },
          tool_error: (tool) => {
            setToolActivities((current) =>
              current.map((item) =>
                item.name === tool.name && item.status === "running"
                  ? { ...item, status: "error", error: tool.error }
                  : item
              )
            );
          },
          message: ({ assistantMessage }) => {
            setMessages((current) => [...current, assistantMessage]);
            setStreamingContent("");
          },
          error: ({ message: errorMessage }) => {
            setError(errorMessage || "The AI assistant could not complete the response.");
            setStreamingContent("");
          }
        }
      });

      await refreshConversations();
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Unable to contact the AI assistant.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamingContent("");
    setToolActivities([]);
    setExecutionEvents([]);
  };

  const renameConversation = async (conversation) => {
    if (streaming) return;
    const title = window.prompt("Rename conversation", conversation.title);

    if (!title?.trim() || title.trim() === conversation.title) return;

    try {
      const updated = await aiApi.renameConversation(conversation._id, { title });
      upsertConversation(updated);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to rename conversation.");
    }
  };

  const deleteConversation = async (conversation = activeConversation) => {
    if (!conversation || streaming) return;

    const confirmed = window.confirm(`Delete "${conversation.title}"?`);
    if (!confirmed) return;

    try {
      await aiApi.deleteConversation(conversation._id);
      setConversations((current) => current.filter((item) => item._id !== conversation._id));

      if (conversation._id === activeConversationId) {
        startNewConversation();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete conversation.");
    }
  };

  const retryMessage = (assistantMessage) => {
    const assistantIndex = messages.findIndex((message) => message._id === assistantMessage._id);
    const previousUserMessage = [...messages]
      .slice(0, assistantIndex === -1 ? messages.length : assistantIndex)
      .reverse()
      .find((message) => message.role === "user");

    if (previousUserMessage) {
      sendMessage(previousUserMessage.content, { retryOfMessageId: assistantMessage._id });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <AIHeader
        activeConversation={activeConversation}
        streaming={streaming}
        onClear={startNewConversation}
        onDelete={() => deleteConversation(activeConversation)}
      />

      <ErrorState message={error} onDismiss={() => setError("")} />

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNew={startNewConversation}
          onSelect={loadConversation}
          onRename={renameConversation}
          onDelete={deleteConversation}
        />

        <div className="min-w-0 space-y-3">
          <ChatWindow
            messages={messages}
            streamingContent={streamingContent}
            streaming={streaming}
            toolActivities={toolActivities}
            executionEvents={executionEvents}
            onPrompt={setPrompt}
            onRetry={retryMessage}
          />

          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-600 transition hover:border-teal hover:text-primary"
                onClick={() => setPrompt(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <ChatInput
            value={prompt}
            disabled={false}
            streaming={streaming}
            onChange={setPrompt}
            onSubmit={sendMessage}
            onStop={stopStreaming}
          />
        </div>
      </div>
    </div>
  );
}
