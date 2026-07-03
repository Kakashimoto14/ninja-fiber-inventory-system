import {
  createConversation,
  deleteConversation,
  getAccountIdentity,
  getConversationWithMessages,
  listConversations,
  renameConversation
} from "../memory/conversationMemory.js";

export const AIConversationService = {
  getIdentity: getAccountIdentity,

  list: (identity) => listConversations(identity),

  create: ({ title, identity }) => createConversation({ title, identity }),

  getById: ({ conversationId, identity }) => getConversationWithMessages(conversationId, identity),

  rename: ({ conversationId, title, identity }) =>
    renameConversation({ conversationId, title, identity }),

  remove: ({ conversationId, identity }) => deleteConversation({ conversationId, identity })
};
