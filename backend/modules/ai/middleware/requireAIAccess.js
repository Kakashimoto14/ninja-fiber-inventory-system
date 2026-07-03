import { requireSuperAdminAccess } from "../../../middleware/accessControl.js";

export const requireAIAccess = requireSuperAdminAccess(
  "AI Assistant access is restricted to Super Admin accounts"
);
