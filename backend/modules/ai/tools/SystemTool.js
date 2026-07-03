import { createTool } from "./ToolDefinition.js";
import { requireSuperAdminToolAccess } from "./toolValidation.js";

export const getSystemTools = () => [
  createTool({
    name: "currentDate",
    label: "Checking Current Date",
    category: "system",
    description: "Return the current server date and time.",
    parameters: {},
    execute: async (_params, context) => {
      requireSuperAdminToolAccess(context);
      const now = new Date();

      return {
        iso: now.toISOString(),
        date: now.toLocaleDateString("en-US", { timeZone: "Asia/Singapore" }),
        time: now.toLocaleTimeString("en-US", { timeZone: "Asia/Singapore" }),
        timezone: "Asia/Singapore"
      };
    }
  }),

  createTool({
    name: "companyInformation",
    label: "Reading Company Information",
    category: "system",
    description: "Return safe high-level company/application context.",
    parameters: {},
    execute: async (_params, context) => {
      requireSuperAdminToolAccess(context);

      return {
        companyName: "Ninja Fiber",
        systemName: "Ninja Fiber Inventory Management",
        businessType: "WiFi/ISP operations",
        modules: ["Authentication", "Inventory", "Products", "Analytics", "Activity Logs", "Tasks/Notes", "Payroll", "AI Assistant"],
        note: "Only high-level company/system information is available in this tool."
      };
    }
  })
];
