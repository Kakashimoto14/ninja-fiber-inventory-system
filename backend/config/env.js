const requiredEnv = (key) => {
  const value = cleanEnvValue(process.env[key]);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const optionalEnv = (key, fallback = "") => {
  const value = cleanEnvValue(process.env[key]);
  return value || fallback;
};

const cleanEnvValue = (value) =>
  String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

const normalizeOrigin = (value) => {
  const cleaned = cleanEnvValue(value).replace(/\/+$/, "");

  if (!cleaned) return "";

  try {
    return new URL(cleaned).origin;
  } catch {
    return cleaned;
  }
};

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

export const env = {
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  port: Number(process.env.PORT || 5000),
  mongodbUri: requiredEnv("MONGODB_URI"),
  clientUrls: parseCsv(optionalEnv("CLIENT_URL", "http://localhost:5173"))
};

export const isProduction = env.nodeEnv === "production";
