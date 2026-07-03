import { getActivityTools } from "./ActivityTool.js";
import { getAnalyticsTools } from "./AnalyticsTool.js";
import { getInventoryTools } from "./InventoryTool.js";
import { getPayrollTools } from "./PayrollTool.js";
import { getSystemTools } from "./SystemTool.js";
import { getTaskTools } from "./TaskTool.js";

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(tool) {
    this.tools.set(tool.name, tool);
    return this;
  }

  registerMany(tools) {
    tools.forEach((tool) => this.register(tool));
    return this;
  }

  get(name) {
    return this.tools.get(name);
  }

  list(context = {}) {
    return [...this.tools.values()].filter((tool) => {
      if (tool.category === "payroll") {
        return context.identity?.role === "superadmin";
      }

      return true;
    });
  }

  definitions(context = {}) {
    return this.list(context).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      category: tool.category,
      label: tool.label
    }));
  }
}

export const createDefaultToolRegistry = () =>
  new ToolRegistry()
    .registerMany(getInventoryTools())
    .registerMany(getPayrollTools())
    .registerMany(getAnalyticsTools())
    .registerMany(getActivityTools())
    .registerMany(getTaskTools())
    .registerMany(getSystemTools());
