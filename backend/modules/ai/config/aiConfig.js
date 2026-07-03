const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const aiConfig = {
  activeProvider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),
  requestTimeoutMs: toNumber(process.env.AI_REQUEST_TIMEOUT_MS, 60000),
  maxPromptChars: toNumber(process.env.AI_MAX_PROMPT_CHARS, 6000),
  maxHistoryMessages: toNumber(process.env.AI_MAX_HISTORY_MESSAGES, 24),
  historySummaryThreshold: toNumber(process.env.AI_HISTORY_SUMMARY_THRESHOLD, 36),
  historyRecentMessages: toNumber(process.env.AI_HISTORY_RECENT_MESSAGES, 16),
  summaryCacheTtlMs: toNumber(process.env.AI_SUMMARY_CACHE_TTL_MS, 30000),
  temperature: toNumber(process.env.AI_TEMPERATURE, 0.4),
  maxOutputTokens: toNumber(process.env.AI_MAX_OUTPUT_TOKENS, 2048),
  providers: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta"
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      model: process.env.OPENROUTER_MODEL || "google/gemini-flash-1.5",
      baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      siteUrl: process.env.OPENROUTER_SITE_URL || "",
      appName: process.env.OPENROUTER_APP_NAME || "Ninja Fiber Inventory"
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3.1"
    },
    openai: {
      enabled: process.env.AI_ENABLE_OPENAI === "true",
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    }
  }
};
