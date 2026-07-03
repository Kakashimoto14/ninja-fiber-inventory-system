import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000
});

export const getAccountHeaders = () => {
  const accountId = localStorage.getItem("nfi_admin_account");
  const savedAccounts = localStorage.getItem("nfi_accounts");
  const headers = {};

  if (accountId && savedAccounts) {
    try {
      const account = JSON.parse(savedAccounts).find((item) => item.id === accountId);

      if (account) {
        headers["x-account-id"] = account.id;
        headers["x-account-name"] = account.name;
        headers["x-account-role"] = account.role;
      }
    } catch {
      return headers;
    }
  }

  return headers;
};

api.interceptors.request.use((config) => {
  Object.assign(config.headers, getAccountHeaders());
  return config;
});

export const productsApi = {
  list: (params) => api.get("/products", { params }).then((res) => res.data),
  create: (payload) => api.post("/products", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/products/${id}`).then((res) => res.data)
};

export const tasksApi = {
  list: (params) => api.get("/tasks", { params }).then((res) => res.data),
  create: (payload) => api.post("/tasks", payload).then((res) => res.data),
  update: (id, payload) => {
    if (!id) throw new Error("Task ID is required");
    return api.put(`/tasks/${id}`, payload).then((res) => res.data);
  },
  remove: (id) => {
    if (!id) throw new Error("Task ID is required");
    return api.delete(`/tasks/${id}`).then((res) => res.data);
  },
  reset: () => api.post("/tasks/reset").then((res) => res.data)
};

export const dashboardApi = {
  stats: (params) => api.get("/dashboard/stats", { params }).then((res) => res.data),
  activity: () => api.get("/dashboard/activity").then((res) => res.data)
};

export const usersApi = {
  list: () => api.get("/users").then((res) => res.data),
  create: (payload) => api.post("/users", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/users/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/users/${id}`).then((res) => res.data)
};

export const employeesApi = {
  list: (params) => api.get("/employees", { params }).then((res) => res.data),
  create: (payload) => api.post("/employees", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/employees/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/employees/${id}`).then((res) => res.data)
};

export const payrollApi = {
  dashboard: () => api.get("/payroll/dashboard").then((res) => res.data),
  list: (params) => api.get("/payroll", { params }).then((res) => res.data),
  get: (id) => api.get(`/payroll/${id}`).then((res) => res.data),
  create: (payload) => api.post("/payroll", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/payroll/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/payroll/${id}`).then((res) => res.data)
};

export const aiApi = {
  listConversations: () => api.get("/ai/conversations").then((res) => res.data),
  createConversation: (payload) => api.post("/ai/conversations", payload).then((res) => res.data),
  getConversation: (id) => api.get(`/ai/conversations/${id}`).then((res) => res.data),
  renameConversation: (id, payload) => api.patch(`/ai/conversations/${id}`, payload).then((res) => res.data),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`).then((res) => res.data)
};

const parseSseChunk = (buffer, handlers) => {
  const events = buffer.split("\n\n");
  const pending = events.pop() || "";

  events.forEach((eventBlock) => {
    const lines = eventBlock.split(/\r?\n/);
    const event = lines.find((line) => line.startsWith("event:"))?.replace("event:", "").trim();
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s*/, ""))
      .join("\n");

    if (!event || !data) return;

    try {
      handlers[event]?.(JSON.parse(data));
    } catch {
      handlers.error?.({ message: "Unable to read AI response stream." });
    }
  });

  return pending;
};

export const streamAIChat = async ({ payload, signal, handlers = {} }) => {
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const response = await fetch(`${baseURL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAccountHeaders()
    },
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok || !response.body) {
    let message = "Unable to connect to the AI assistant.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the professional fallback message.
    }

    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseChunk(buffer, handlers);
  }

  if (buffer.trim()) {
    parseSseChunk(`${buffer}\n\n`, handlers);
  }
};

export default api;
