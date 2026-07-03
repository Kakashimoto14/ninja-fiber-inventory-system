const cache = new Map();

const now = () => Date.now();

export const getCachedValue = (key) => {
  const item = cache.get(key);

  if (!item) return null;

  if (item.expiresAt <= now()) {
    cache.delete(key);
    return null;
  }

  return item.value;
};

export const setCachedValue = (key, value, ttlMs = 30000) => {
  cache.set(key, {
    value,
    expiresAt: now() + ttlMs
  });

  return value;
};

export const getOrSetCachedValue = async (key, ttlMs, factory) => {
  const cached = getCachedValue(key);

  if (cached) {
    return { value: cached, cached: true };
  }

  const value = await factory();
  setCachedValue(key, value, ttlMs);
  return { value, cached: false };
};
