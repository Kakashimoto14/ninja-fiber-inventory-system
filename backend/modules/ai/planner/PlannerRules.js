import { IntentPlanner, extractDateReferences } from "../orchestrator/IntentPlanner.js";
import { ExecutionStep } from "./ExecutionStep.js";

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const profileTerms = {
  executive_summary: [
    "how is the business doing",
    "executive summary",
    "monthly business report",
    "company overview",
    "business health",
    "business report"
  ],
  inventory_health: ["inventory health", "stock health", "inventory risk", "stock risk", "low stock"],
  business_health: ["operations health", "operational health", "business status", "company health"]
};

export const detectPlanningProfile = (message) => {
  const text = String(message || "").toLowerCase();

  if (includesAny(text, profileTerms.executive_summary)) return "executive_summary";
  if (includesAny(text, profileTerms.inventory_health)) return "inventory_health";
  if (includesAny(text, profileTerms.business_health)) return "business_health";
  return "general";
};

export const buildProfileSteps = ({ profile, message, context }) => {
  if (profile === "executive_summary") {
    return [
      new ExecutionStep({
        id: "dashboard",
        tool: "dashboardSummary",
        label: "Analyzing Dashboard",
        parameters: { accountId: context.identity?.accountId, role: context.identity?.role },
        expectedOutput: "High-level operational KPIs"
      }),
      new ExecutionStep({
        id: "inventory",
        tool: "inventorySummary",
        label: "Summarizing Inventory",
        expectedOutput: "Inventory totals and low-stock exposure"
      }),
      new ExecutionStep({
        id: "payroll",
        tool: "payrollSummary",
        label: "Reading Payroll",
        expectedOutput: "Payroll cost and employee record summary"
      }),
      new ExecutionStep({
        id: "activity",
        tool: "recentActivities",
        label: "Reviewing Activities",
        parameters: { limit: 10 },
        expectedOutput: "Recent operational changes"
      }),
      new ExecutionStep({
        id: "tasks",
        tool: "taskSummary",
        label: "Reviewing Tasks",
        expectedOutput: "Open, urgent, and upcoming task workload"
      })
    ];
  }

  if (profile === "inventory_health") {
    return [
      new ExecutionStep({
        id: "inventory-summary",
        tool: "inventorySummary",
        label: "Summarizing Inventory",
        expectedOutput: "Inventory totals and category spread"
      }),
      new ExecutionStep({
        id: "low-stock",
        tool: "lowStockProducts",
        label: "Reading Low Stock",
        parameters: { limit: 25 },
        dependencies: ["inventory-summary"],
        expectedOutput: "Products at or below reorder point"
      })
    ];
  }

  if (profile === "business_health") {
    return [
      new ExecutionStep({
        id: "dashboard",
        tool: "dashboardSummary",
        label: "Analyzing Dashboard",
        parameters: { accountId: context.identity?.accountId, role: context.identity?.role },
        expectedOutput: "Operational KPI health"
      }),
      new ExecutionStep({
        id: "payroll",
        tool: "payrollSummary",
        label: "Reading Payroll",
        expectedOutput: "Payroll load"
      }),
      new ExecutionStep({
        id: "activity",
        tool: "recentActivities",
        label: "Reviewing Activities",
        parameters: { limit: 10 },
        expectedOutput: "Operational activity"
      }),
      new ExecutionStep({
        id: "tasks",
        tool: "taskSummary",
        label: "Reviewing Tasks",
        expectedOutput: "Task workload and urgency"
      })
    ];
  }

  if (String(message || "").toLowerCase().includes("task")) {
    const dates = extractDateReferences(message);
    if (dates.date) {
      return [
        new ExecutionStep({
          id: "tasks-by-date",
          tool: "tasksByDate",
          label: "Reading Scheduled Tasks",
          parameters: { ...dates, limit: 20 },
          expectedOutput: "Scheduled task matches for the requested date"
        })
      ];
    }
  }

  const intentPlanner = new IntentPlanner();
  return intentPlanner.plan({ message, context }).map(
    (call, index) =>
      new ExecutionStep({
        id: `step-${index + 1}`,
        tool: call.name,
        label: context.toolLabelFor?.(call.name) || call.name,
        parameters: call.parameters,
        expectedOutput: "Requested business information"
      })
  );
};
