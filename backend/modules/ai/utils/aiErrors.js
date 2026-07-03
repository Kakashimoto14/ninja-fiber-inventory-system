export class AIProviderError extends Error {
  constructor(message, { statusCode = 502, code = "AI_PROVIDER_ERROR", provider = "" } = {}) {
    super(message);
    this.name = "AIProviderError";
    this.statusCode = statusCode;
    this.code = code;
    this.provider = provider;
  }
}

export const providerUnavailable = (provider, message) =>
  new AIProviderError(message || `${provider} is unavailable`, {
    provider,
    statusCode: 503,
    code: "AI_PROVIDER_UNAVAILABLE"
  });

export const missingApiKey = (provider, envName) =>
  new AIProviderError(`${provider} is not configured. Add ${envName} on the backend server.`, {
    provider,
    statusCode: 503,
    code: "AI_PROVIDER_MISSING_API_KEY"
  });
