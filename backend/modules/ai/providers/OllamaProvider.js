import { AIProvider } from "../types/AIProvider.js";
import { createAbortSignal, parseJsonResponse, readJsonLines } from "../utils/providerHttp.js";

const toChatMessages = (messages, systemPrompt) => [
  { role: "system", content: systemPrompt },
  ...messages
    .filter((message) => ["user", "assistant"].includes(message.role) && message.content)
    .map((message) => ({ role: message.role, content: message.content }))
];

export class OllamaProvider extends AIProvider {
  get name() {
    return "ollama";
  }

  buildPayload({ messages, systemPrompt, options, stream }) {
    return {
      model: this.config.model,
      messages: toChatMessages(messages, systemPrompt),
      stream,
      options: {
        temperature: options.temperature,
        num_predict: options.maxOutputTokens
      }
    };
  }

  async generateResponse({ messages, systemPrompt, options }) {
    const abort = createAbortSignal(options.requestTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.buildPayload({ messages, systemPrompt, options, stream: false })),
        signal: abort.signal
      });
      const payload = await parseJsonResponse(response, this.name);
      return payload?.message?.content || "";
    } finally {
      abort.clear();
    }
  }

  async *streamResponse({ messages, systemPrompt, options }) {
    const abort = createAbortSignal(options.requestTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.buildPayload({ messages, systemPrompt, options, stream: true })),
        signal: abort.signal
      });

      for await (const line of readJsonLines(response, this.name)) {
        const payload = JSON.parse(line);
        const text = payload?.message?.content || "";

        if (text) {
          yield text;
        }
      }
    } finally {
      abort.clear();
    }
  }
}
