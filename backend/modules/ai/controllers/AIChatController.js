import { AIConversationService } from "../services/AIConversationService.js";
import {
  completeAssistantMessage,
  generateChatResponse,
  recordExecution,
  saveAssistantError,
  startChat
} from "../services/AIChatService.js";
import { sendSse, writeSseHeaders } from "../utils/sse.js";

export const chat = async (req, res, next) => {
  const identity = AIConversationService.getIdentity(req);

  if (req.body.stream === false) {
    try {
      res.json(
        await generateChatResponse({
          conversationId: req.body.conversationId,
          message: req.body.message,
          identity
        })
      );
    } catch (error) {
      if (error.statusCode) res.status(error.statusCode);
      next(error);
    }
    return;
  }

  writeSseHeaders(res);

  let session = null;
  let content = "";

  try {
    session = await startChat({
      conversationId: req.body.conversationId,
      message: req.body.message,
      identity,
      retryOfMessageId: req.body.retryOfMessageId,
      emitToolEvent: async (event, payload) => sendSse(res, event, payload)
    });

    sendSse(res, "conversation", {
      conversation: session.conversation,
      userMessage: session.userMessage
    });

    sendSse(res, "response_started", { label: "Preparing Response" });

    for await (const token of session.stream) {
      content += token;
      sendSse(res, "token", { token });
    }

    const assistantMessage = await completeAssistantMessage({
      conversation: session.conversation,
      content,
      identity,
      metadata: session.metadata
    });
    await recordExecution({
      conversation: session.conversation,
      graph: session.executionGraph,
      durationMs: session.executionDurationMs
    });

    sendSse(res, "message", { assistantMessage });
    sendSse(res, "response_completed", { label: "Completed" });
    sendSse(res, "done", { ok: true });
    res.end();
  } catch (error) {
    if (session?.conversation) {
      const savedError = await saveAssistantError({
        conversation: session.conversation,
        error,
        identity,
        metadata: session.metadata
      });

      sendSse(res, "error", {
        message: savedError.message,
        code: savedError.code || "AI_PROVIDER_ERROR"
      });
    } else {
      sendSse(res, "error", {
        message: error.message || "Unable to start AI chat.",
        code: error.code || "AI_CHAT_ERROR"
      });
    }

    sendSse(res, "done", { ok: false });
    res.end();
  }
};
