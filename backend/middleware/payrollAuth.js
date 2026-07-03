import { requireSuperAdminAccess } from "./accessControl.js";

export const requireSuperAdmin = requireSuperAdminAccess(
  "Payroll access is restricted to Super Admin accounts"
);
