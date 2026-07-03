import express from "express";
import {
  createConversation,
  deleteConversation,
  getConversationById,
  getConversations,
  updateConversation
} from "../controllers/AIConversationController.js";
import { chat } from "../controllers/AIChatController.js";
import { aiErrorHandler } from "../middleware/aiErrorHandler.js";
import { requireAIAccess } from "../middleware/requireAIAccess.js";

const router = express.Router();

router.use(requireAIAccess);
router.route("/conversations").get(getConversations).post(createConversation);
router.route("/conversations/:id").get(getConversationById).patch(updateConversation).delete(deleteConversation);
router.post("/chat", chat);
router.use(aiErrorHandler);

export default router;
