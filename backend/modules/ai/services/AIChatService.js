import { aiConfig } from "../config/aiConfig.js";
import { systemPrompt } from "../prompts/systemPrompt.js";
import { createAIProvider } from "../providers/providerFactory.js";
import { aiOrchestrator } from "../orchestrator/AIOrchestrator.js";
import { AIExecutionService } from "./AIExecutionService.js";
import {
  addMessage,
  buildConversationTitle,
  createConversation,
  getCompressedConversationMessages,
  getConversationWithMessages,
} from "../memory/conversationMemory.js";
import { AIProviderError } from "../utils/aiErrors.js";
import { sanitizeChatInput } from "../utils/sanitizeInput.js";

const providerOptions = {
  requestTimeoutMs: aiConfig.requestTimeoutMs,
  temperature: aiConfig.temperature,
  maxOutputTokens: aiConfig.maxOutputTokens
};

const getProviderMetadata = (provider) => ({
  provider: provider.name,
  model: provider.config?.model || ""
});

const normalizeError = (error) => {
  if (error?.name === "AbortError") {
    return new AIProviderError("The AI provider timed out. Please try again.", {
      statusCode: 504,
      code: "AI_PROVIDER_TIMEOUT"
    });
  }

  if (error instanceof AIProviderError) {
    return error;
  }

  return new AIProviderError("The AI provider is unavailable. Please try again later.", {
    statusCode: 503,
    code: "AI_PROVIDER_UNAVAILABLE"
  });
};

export async function startChat({
  conversationId,
  message,
  identity,
  retryOfMessageId = null,
  emitToolEvent = async () => {}
}) {
  const content = sanitizeChatInput(message, aiConfig.maxPromptChars);
  const provider = createAIProvider();
  const metadata = getProviderMetadata(provider);

  let conversation;

  if (conversationId) {
    ({ conversation } = await getConversationWithMessages(conversationId, identity));
  } else {
    conversation = await createConversation({
      title: buildConversationTitle(content),
      identity,
      metadata
    });
  }

  const userMessage = await addMessage({
    conversationId: conversation._id,
    role: "user",
    content,
    identity,
    metadata: retryOfMessageId ? { retryOfMessageId } : {}
  });

  const history = await getCompressedConversationMessages({
    conversationId: conversation._id,
    threshold: aiConfig.historySummaryThreshold,
    recentLimit: aiConfig.historyRecentMessages,
    identity
  });
  const orchestration = await aiOrchestrator.prepare({
    message: content,
    identity,
    conversationId: conversation._id,
    emitToolEvent
  });
  const providerMessages = [
    ...history.map((item) => ({
      role: item.role === "system" ? "user" : item.role,
      content: item.content
    })),
    ...orchestration.providerMessages
  ];

  conversation.metadata = {
    ...conversation.metadata,
    ...metadata,
    lastError: ""
  };
  await conversation.save();

  return {
    conversation,
    userMessage,
    provider,
    metadata,
    executionGraph: orchestration.graph,
    executionDurationMs: orchestration.durationMs,
    reasoning: orchestration.reasoning,
    toolResults: orchestration.results,
    stream: provider.streamResponse({
      messages: providerMessages,
      systemPrompt,
      options: providerOptions
    })
  };
}

export async function completeAssistantMessage({ conversation, content, identity, metadata }) {
  const assistantMessage = await addMessage({
    conversationId: conversation._id,
    role: "assistant",
    content: content || "I could not generate a response.",
    identity,
    metadata
  });

  conversation.updatedAt = new Date();
  await conversation.save();

  return assistantMessage;
}

export async function recordExecution({ conversation, graph, durationMs }) {
  return AIExecutionService.record({
    conversationId: conversation._id,
    graph,
    durationMs
  }).catch(() => null);
}

export async function saveAssistantError({ conversation, error, identity, metadata }) {
  const normalizedError = normalizeError(error);
  const message = normalizedError.message || "The AI assistant is temporarily unavailable.";

  await addMessage({
    conversationId: conversation._id,
    role: "assistant",
    content: message,
    identity,
    status: "error",
    metadata: {
      ...metadata,
      errorCode: normalizedError.code || "AI_PROVIDER_ERROR"
    }
  });

  conversation.metadata = {
    ...conversation.metadata,
    lastError: message
  };
  await conversation.save();

  return normalizedError;
}

export async function generateChatResponse({ conversationId, message, identity }) {
  const session = await startChat({ conversationId, message, identity });
  let response = "";

  try {
    for await (const token of session.stream) {
      response += token;
    }

    const assistantMessage = await completeAssistantMessage({
      conversation: session.conversation,
      content: response,
      identity,
      metadata: session.metadata
    });
    await recordExecution({
      conversation: session.conversation,
      graph: session.executionGraph,
      durationMs: session.executionDurationMs
    });

    return {
      conversation: session.conversation,
      userMessage: session.userMessage,
      assistantMessage
    };
  } catch (error) {
    throw await saveAssistantError({
      conversation: session.conversation,
      error,
      identity,
      metadata: session.metadata
    });
  }
}

export const AIChatService = {
  startChat,
  completeAssistantMessage,
  recordExecution,
  saveAssistantError,
  generateChatResponse
};
