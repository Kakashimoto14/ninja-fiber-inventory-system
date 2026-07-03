export const sanitizeText = (value, maxLength = 120) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);

export const escapeRegex = (value) => sanitizeText(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const toPositiveInteger = (value, fallback = 10, max = 100) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
};

export const toMonth = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
};

export const toYear = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : null;
};

export const requireSuperAdminToolAccess = (context) => {
  if (context?.identity?.role !== "superadmin") {
    const error = new Error("This AI tool is restricted to Super Admin accounts");
    error.code = "AI_TOOL_FORBIDDEN";
    throw error;
  }
};
