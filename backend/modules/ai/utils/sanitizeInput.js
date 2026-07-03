export const sanitizeChatInput = (value, maxLength) => {
  const text = String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

  if (!text) {
    const error = new Error("Message is required");
    error.statusCode = 400;
    throw error;
  }

  if (text.length > maxLength) {
    const error = new Error(`Message is too long. Limit it to ${maxLength} characters.`);
    error.statusCode = 400;
    throw error;
  }

  return text;
};

export const sanitizeTitle = (value) =>
  String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 80);
