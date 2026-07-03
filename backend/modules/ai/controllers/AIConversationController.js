import { AIConversationService } from "../services/AIConversationService.js";

export const getConversations = async (req, res, next) => {
  try {
    const identity = AIConversationService.getIdentity(req);
    res.json(await AIConversationService.list(identity));
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const identity = AIConversationService.getIdentity(req);
    const conversation = await AIConversationService.create({
      title: req.body.title,
      identity
    });
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const identity = AIConversationService.getIdentity(req);
    const { conversation, messages } = await AIConversationService.getById({
      conversationId: req.params.id,
      identity
    });

    res.json({ conversation, messages });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updateConversation = async (req, res, next) => {
  try {
    const identity = AIConversationService.getIdentity(req);
    const conversation = await AIConversationService.rename({
      conversationId: req.params.id,
      title: req.body.title,
      identity
    });

    res.json(conversation);
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const identity = AIConversationService.getIdentity(req);
    await AIConversationService.remove({
      conversationId: req.params.id,
      identity
    });

    res.json({ message: "Conversation deleted" });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
