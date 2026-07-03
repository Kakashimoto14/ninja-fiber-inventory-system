import Activity from "../../../models/Activity.js";
import { createTool } from "./ToolDefinition.js";
import { escapeRegex, requireSuperAdminToolAccess, sanitizeText, toPositiveInteger } from "./toolValidation.js";

const serializeActivity = (activity) => ({
  id: String(activity._id),
  message: activity.message,
  type: activity.type,
  entityId: activity.entityId ? String(activity.entityId) : null,
  createdAt: activity.createdAt
});

export const getActivityTools = () => [
  createTool({
    name: "recentActivities",
    label: "Reading Activities",
    category: "activity",
    description: "List recent product, stock, task, employee, payroll, and system activities.",
    parameters: {
      limit: { type: "number", default: 10 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const limit = toPositiveInteger(params.limit, 10, 30);
      const activities = await Activity.find().sort({ createdAt: -1 }).limit(limit).lean();

      return {
        count: activities.length,
        activities: activities.map(serializeActivity)
      };
    }
  }),

  createTool({
    name: "searchActivities",
    label: "Searching Activities",
    category: "activity",
    description: "Search activity logs by message or type.",
    parameters: {
      query: { type: "string", required: true },
      limit: { type: "number", default: 10 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const query = sanitizeText(params.query, 80);
      const limit = toPositiveInteger(params.limit, 10, 30);

      if (!query) {
        return { query, activities: [], note: "No activity search term provided." };
      }

      const activities = await Activity.find({
        $or: [
          { message: { $regex: escapeRegex(query), $options: "i" } },
          { type: { $regex: escapeRegex(query), $options: "i" } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        query,
        count: activities.length,
        activities: activities.map(serializeActivity)
      };
    }
  })
];
