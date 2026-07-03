import { AIProvider } from "../types/AIProvider.js";
import { AIProviderError, missingApiKey } from "../utils/aiErrors.js";
import { createAbortSignal, parseJsonResponse, readSseData } from "../utils/providerHttp.js";

const toChatMessages = (messages, systemPrompt) => [
  { role: "system", content: systemPrompt },
  ...messages
    .filter((message) => ["user", "assistant"].includes(message.role) && message.content)
    .map((message) => ({ role: message.role, content: message.content }))
];

export class OpenAIProvider extends AIProvider {
  get name() {
    return "openai";
  }

  ensureConfigured() {
    if (!this.config.enabled) {
      throw new AIProviderError("OpenAI provider is disabled. Set AI_ENABLE_OPENAI=true to enable it.", {
        statusCode: 503,
        code: "AI_PROVIDER_DISABLED",
        provider: this.name
      });
    }

    if (!this.config.apiKey) {
      throw missingApiKey("OpenAI", "OPENAI_API_KEY");
    }
  }

  buildHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`
    };
  }

  buildPayload({ messages, systemPrompt, options, stream }) {
    return {
      model: this.config.model,
      messages: toChatMessages(messages, systemPrompt),
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stream
    };
  }

  async generateResponse({ messages, systemPrompt, options }) {
    this.ensureConfigured();
    const abort = createAbortSignal(options.requestTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(this.buildPayload({ messages, systemPrompt, options, stream: false })),
        signal: abort.signal
      });
      const payload = await parseJsonResponse(response, this.name);
      return payload?.choices?.[0]?.message?.content || "";
    } finally {
      abort.clear();
    }
  }

  async *streamResponse({ messages, systemPrompt, options }) {
    this.ensureConfigured();
    const abort = createAbortSignal(options.requestTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(this.buildPayload({ messages, systemPrompt, options, stream: true })),
        signal: abort.signal
      });

      for await (const data of readSseData(response, this.name)) {
        const payload = JSON.parse(data);
        const text = payload?.choices?.[0]?.delta?.content || "";

        if (text) {
          yield text;
        }
      }
    } finally {
      abort.clear();
    }
  }
}
