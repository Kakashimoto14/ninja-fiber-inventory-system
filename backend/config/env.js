const requiredEnv = (key) => {
  const value = process.env[key];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
};

const optionalEnv = (key, fallback = "") => {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
};

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  port: Number(process.env.PORT || 5000),
  mongodbUri: requiredEnv("MONGODB_URI"),
  clientUrls: parseCsv(optionalEnv("CLIENT_URL", "http://localhost:5173"))
};

export const isProduction = env.nodeEnv === "production";
