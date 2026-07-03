import { AIProviderError } from "./aiErrors.js";

export const createAbortSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout)
  };
};

export const parseJsonResponse = async (response, provider) => {
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `${provider} request failed with status ${response.status}`;
    const code = response.status === 429 ? "AI_PROVIDER_QUOTA_EXCEEDED" : "AI_PROVIDER_ERROR";

    throw new AIProviderError(message, {
      statusCode: response.status === 429 ? 429 : 502,
      code,
      provider
    });
  }

  return payload;
};

export async function* readSseData(response, provider) {
  if (!response.ok) {
    await parseJsonResponse(response, provider);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;

      const data = line.replace(/^data:\s*/, "");
      if (!data || data === "[DONE]") continue;

      yield data;
    }
  }
}

export async function* readJsonLines(response, provider) {
  if (!response.ok) {
    await parseJsonResponse(response, provider);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        yield line;
      }
    }
  }
}
