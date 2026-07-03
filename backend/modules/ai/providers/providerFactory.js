import { aiConfig } from "../config/aiConfig.js";
import { AIProviderError } from "../utils/aiErrors.js";
import { GeminiProvider } from "./GeminiProvider.js";
import { OllamaProvider } from "./OllamaProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { OpenRouterProvider } from "./OpenRouterProvider.js";

const providerConstructors = {
  gemini: GeminiProvider,
  openrouter: OpenRouterProvider,
  ollama: OllamaProvider,
  openai: OpenAIProvider
};

export const createAIProvider = (providerName = aiConfig.activeProvider) => {
  const normalizedProvider = String(providerName || "gemini").toLowerCase();
  const Provider = providerConstructors[normalizedProvider];

  if (!Provider) {
    throw new AIProviderError(`Unsupported AI provider: ${normalizedProvider}`, {
      statusCode: 500,
      code: "AI_PROVIDER_UNSUPPORTED",
      provider: normalizedProvider
    });
  }

  return new Provider(aiConfig.providers[normalizedProvider]);
};
