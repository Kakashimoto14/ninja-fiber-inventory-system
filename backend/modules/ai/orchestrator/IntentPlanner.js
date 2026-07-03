import { sanitizeText, toMonth, toYear } from "../tools/toolValidation.js";

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
];

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const extractMonthYear = (text) => {
  const lower = text.toLowerCase();
  const monthIndex = monthNames.findIndex((month) => lower.includes(month));
  const yearMatch = lower.match(/\b(20\d{2})\b/);
  const numericMonthMatch = lower.match(/\b(?:month\s*)?([1-9]|1[0-2])\b/);

  return {
    month: monthIndex >= 0 ? monthIndex + 1 : toMonth(numericMonthMatch?.[1]),
    year: toYear(yearMatch?.[1]) || new Date().getFullYear()
  };
};

export const extractDateReferences = (message) => {
  const text = String(message || "");
  const lower = text.toLowerCase();
  const now = new Date();
  const toKey = (date) => date.toISOString().slice(0, 10);
  const references = {};

  if (lower.includes("tomorrow")) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    references.date = toKey(date);
  }

  if (lower.includes("today")) {
    references.date = toKey(now);
  }

  const monthPattern = new RegExp(`\\b(${monthNames.join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(20\\d{2}))?`, "gi");
  const matches = [...text.matchAll(monthPattern)];
  const parsedDates = matches
    .map((match) => {
      const month = monthNames.indexOf(match[1].toLowerCase());
      const day = Number(match[2]);
      const year = Number(match[3] || now.getFullYear());
      const date = new Date(Date.UTC(year, month, day));
      return Number.isNaN(date.getTime()) ? "" : toKey(date);
    })
    .filter(Boolean);

  if (parsedDates[0]) references.date = parsedDates[0];
  if (parsedDates[1]) references.dueDate = parsedDates[1];

  const numericDates = [...text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)].map((match) => match[0]);
  if (!references.date && numericDates[0]) references.date = numericDates[0];
  if (!references.dueDate && numericDates[1]) references.dueDate = numericDates[1];

  return references;
};

const extractSearchTerm = (text) => {
  const normalized = sanitizeText(text, 120);
  const patterns = [
    /(?:product|item|stock|inventory|router|onu|modem|cable|name)\s+(?:called|named|for|of)?\s*["']?([^"']{2,60})/i,
    /(?:how many|remaining|remain|left|available)\s+([^?.,]{2,60})/i,
    /(?:search|find|look up)\s+([^?.,]{2,60})/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return sanitizeText(match[1].replace(/\b(remain|remaining|left|available|in stock)\b/gi, ""), 60);
    }
  }

  return normalized;
};

export class IntentPlanner {
  plan({ message, context }) {
    const text = String(message || "").toLowerCase();
    const calls = [];

    if (includesAny(text, ["today", "date", "current day", "what day"])) {
      calls.push({ name: "currentDate", parameters: {} });
    }

    if (includesAny(text, ["company", "business", "ninja fiber"])) {
      calls.push({ name: "companyInformation", parameters: {} });
    }

    if (includesAny(text, ["low stock", "reorder", "below reorder"])) {
      calls.push({ name: "lowStockProducts", parameters: { limit: 20 } });
    }

    if (includesAny(text, ["inventory summary", "stock summary", "inventory status", "total products"])) {
      calls.push({ name: "inventorySummary", parameters: {} });
    }

    if (includesAny(text, ["inventory value", "stock value", "total inventory value"])) {
      calls.push({ name: "totalInventoryValue", parameters: {} });
    }

    if (includesAny(text, ["product", "item", "sku", "stock", "inventory", "router", "onu", "modem", "cable"])) {
      const query = extractSearchTerm(message);
      const productTool = includesAny(text, ["how many", "remain", "remaining", "left", "available", "quantity", "stock of"])
        ? "productByName"
        : "searchProducts";

      calls.push({ name: productTool, parameters: { query, limit: 8 } });
    }

    if (includesAny(text, ["payroll summary", "payroll total", "salary total", "payroll expense"])) {
      calls.push({ name: "payrollSummary", parameters: extractMonthYear(text) });
    }

    if (includesAny(text, ["payroll history", "recent payroll", "payroll records"])) {
      calls.push({ name: "payrollHistory", parameters: { ...extractMonthYear(text), limit: 10 } });
    }

    if (includesAny(text, ["employee payroll", "payroll for", "salary for", "payslip for"])) {
      calls.push({ name: "employeePayroll", parameters: { employeeName: extractSearchTerm(message), limit: 8 } });
    }

    if (includesAny(text, ["dashboard", "overview", "business summary", "operations summary"])) {
      calls.push({
        name: "dashboardSummary",
        parameters: {
          accountId: context.identity?.accountId,
          role: context.identity?.role
        }
      });
    }

    if (includesAny(text, ["monthly summary", "this month", "month summary", "monthly report"])) {
      calls.push({ name: "monthlySummary", parameters: extractMonthYear(text) });
    }

    if (includesAny(text, ["activity", "activities", "recent changes", "logs", "timeline"])) {
      const activityTool = includesAny(text, ["search", "find", "lookup", "look up"]) ? "searchActivities" : "recentActivities";
      calls.push({ name: activityTool, parameters: { query: extractSearchTerm(message), limit: 10 } });
    }

    if (includesAny(text, ["task", "tasks", "scheduled", "deadline", "due date", "calendar", "appointment"])) {
      const dates = extractDateReferences(message);

      if (dates.date) {
        calls.push({ name: "tasksByDate", parameters: { ...dates, limit: 20 } });
      } else if (includesAny(text, ["summary", "overview", "open tasks", "urgent"])) {
        calls.push({ name: "taskSummary", parameters: {} });
      } else {
        calls.push({ name: "searchTasks", parameters: { query: extractSearchTerm(message), limit: 10 } });
      }
    }

    const uniqueCalls = [];
    const seen = new Set();

    calls.forEach((call) => {
      const key = `${call.name}:${JSON.stringify(call.parameters || {})}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCalls.push(call);
      }
    });

    return uniqueCalls.slice(0, 4);
  }
}
