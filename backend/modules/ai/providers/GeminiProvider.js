import { AIProvider } from "../types/AIProvider.js";
import { missingApiKey } from "../utils/aiErrors.js";
import { createAbortSignal, parseJsonResponse, readSseData } from "../utils/providerHttp.js";

const toGeminiRole = (role) => (role === "assistant" ? "model" : "user");

const toGeminiContents = (messages) =>
  messages
    .filter((message) => ["user", "assistant"].includes(message.role) && message.content)
    .map((message) => ({
      role: toGeminiRole(message.role),
      parts: [{ text: message.content }]
    }));

const readGeminiText = (payload) =>
  payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("") || "";

export class GeminiProvider extends AIProvider {
  get name() {
    return "gemini";
  }

  ensureConfigured() {
    if (!this.config.apiKey) {
      throw missingApiKey("Gemini", "GEMINI_API_KEY");
    }
  }

  buildPayload({ messages, systemPrompt, options }) {
    return {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: toGeminiContents(messages),
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens
      }
    };
  }

  async generateResponse({ messages, systemPrompt, options }) {
    this.ensureConfigured();
    const abort = createAbortSignal(options.requestTimeoutMs);

    try {
      const response = await fetch(
        `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.buildPayload({ messages, systemPrompt, options })),
          signal: abort.signal
        }
      );
      const payload = await parseJsonResponse(response, this.name);
      return readGeminiText(payload);
    } finally {
      abort.clear();
    }
  }

  async *streamResponse({ messages, systemPrompt, options }) {
    this.ensureConfigured();
    const abort = createAbortSignal(options.requestTimeoutMs);

    try {
      const response = await fetch(
        `${this.config.baseUrl}/models/${this.config.model}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.buildPayload({ messages, systemPrompt, options })),
          signal: abort.signal
        }
      );

      for await (const data of readSseData(response, this.name)) {
        const payload = JSON.parse(data);
        const text = readGeminiText(payload);

        if (text) {
          yield text;
        }
      }
    } finally {
      abort.clear();
    }
  }
}
