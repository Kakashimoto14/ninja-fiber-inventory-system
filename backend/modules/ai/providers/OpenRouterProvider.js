import { OpenAIProvider } from "./OpenAIProvider.js";
import { missingApiKey } from "../utils/aiErrors.js";

export class OpenRouterProvider extends OpenAIProvider {
  get name() {
    return "openrouter";
  }

  ensureConfigured() {
    if (!this.config.apiKey) {
      throw missingApiKey("OpenRouter", "OPENROUTER_API_KEY");
    }
  }

  buildHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`
    };

    if (this.config.siteUrl) {
      headers["HTTP-Referer"] = this.config.siteUrl;
    }

    if (this.config.appName) {
      headers["X-Title"] = this.config.appName;
    }

    return headers;
  }
}
