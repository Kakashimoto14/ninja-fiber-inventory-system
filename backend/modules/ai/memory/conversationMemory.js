import mongoose from "mongoose";
import AIConversation from "../models/AIConversation.js";
import AIMessage from "../models/AIMessage.js";
import { sanitizeTitle } from "../utils/sanitizeInput.js";

const defaultTitle = "New AI Conversation";

export const getAccountIdentity = (req) => ({
  accountId: String(req.header("x-account-id") || req.account?._id || "superadmin"),
  name: String(req.header("x-account-name") || req.account?.name || "SUPERADMIN"),
  role: "superadmin"
});

export const buildConversationTitle = (message) => {
  const words = String(message || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 8)
    .join(" ");

  if (!words) return defaultTitle;
  return words.length > 76 ? `${words.slice(0, 73)}...` : words;
};

export const listConversations = async (identity) =>
  AIConversation.find({
    "createdBy.accountId": identity.accountId,
    status: { $ne: "deleted" }
  })
    .sort({ updatedAt: -1 })
    .limit(50);

export const createConversation = async ({ title, identity, metadata = {} }) =>
  AIConversation.create({
    title: sanitizeTitle(title) || defaultTitle,
    createdBy: identity,
    metadata
  });

export const getConversationWithMessages = async (conversationId, identity) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  const conversation = await AIConversation.findOne({
    _id: conversationId,
    "createdBy.accountId": identity.accountId,
    status: { $ne: "deleted" }
  });

  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  const messages = await AIMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
  return { conversation, messages };
};

export const renameConversation = async ({ conversationId, title, identity }) => {
  const { conversation } = await getConversationWithMessages(conversationId, identity);
  conversation.title = sanitizeTitle(title) || conversation.title;
  return conversation.save();
};

export const deleteConversation = async ({ conversationId, identity }) => {
  const { conversation } = await getConversationWithMessages(conversationId, identity);
  conversation.status = "deleted";
  await conversation.save();
  return conversation;
};

export const addMessage = async ({ conversationId, role, content, identity, status = "completed", metadata = {} }) =>
  AIMessage.create({
    conversationId,
    role,
    content,
    createdBy: role === "user" ? { accountId: identity.accountId, name: identity.name } : undefined,
    status,
    metadata
  });

export const getRecentMessages = async ({ conversationId, limit }) => {
  const messages = await AIMessage.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return messages.reverse();
};

export const getCompressedConversationMessages = async ({
  conversationId,
  threshold,
  recentLimit,
  identity
}) => {
  const total = await AIMessage.countDocuments({ conversationId });

  if (total <= threshold) {
    return getRecentMessages({ conversationId, limit: threshold });
  }

  const existingSummary = await AIMessage.findOne({
    conversationId,
    role: "system",
    content: { $regex: "^Conversation summary:" }
  }).sort({ createdAt: -1 });
  const recentMessages = await getRecentMessages({ conversationId, limit: recentLimit });

  if (existingSummary) {
    return [existingSummary, ...recentMessages.filter((message) => String(message._id) !== String(existingSummary._id))];
  }

  const olderMessages = await AIMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(Math.max(total - recentLimit, 0));
  const summaryText = olderMessages
    .filter((message) => ["user", "assistant"].includes(message.role))
    .slice(-12)
    .map((message) => `${message.role}: ${String(message.content).replace(/\s+/g, " ").slice(0, 220)}`)
    .join("\n");

  const summaryMessage = await addMessage({
    conversationId,
    role: "system",
    content: `Conversation summary:\n${summaryText || "Earlier conversation contained no business context to preserve."}`,
    identity,
    metadata: {}
  });

  return [summaryMessage, ...recentMessages];
};
