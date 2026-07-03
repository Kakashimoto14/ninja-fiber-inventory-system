import Task from "../../../models/Task.js";
import { createTool } from "./ToolDefinition.js";
import { escapeRegex, requireSuperAdminToolAccess, sanitizeText, toPositiveInteger } from "./toolValidation.js";

const toDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const dateRange = (dateKey) => {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { $gte: start, $lt: end };
};

const serializeTask = (task) => ({
  id: String(task._id),
  type: task.type,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  assigneeId: task.assigneeId,
  assigneeName: task.assigneeName,
  date: task.date,
  dueDate: task.dueDate,
  completedAt: task.completedAt,
  notes: task.notes,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

export const getTaskTools = () => [
  createTool({
    name: "tasksByDate",
    label: "Reading Scheduled Tasks",
    category: "tasks",
    description: "Find tasks scheduled on a specific date, optionally matching a due date.",
    parameters: {
      date: { type: "string", required: true },
      dueDate: { type: "string", required: false },
      limit: { type: "number", default: 20 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const date = toDateKey(params.date);
      const dueDate = toDateKey(params.dueDate);
      const limit = toPositiveInteger(params.limit, 20, 50);

      if (!date) {
        return { tasks: [], count: 0, note: "No valid task date was provided." };
      }

      const query = { date: dateRange(date) };
      if (dueDate) {
        query.dueDate = dateRange(dueDate);
      }

      const tasks = await Task.find(query).sort({ priority: -1, createdAt: -1 }).limit(limit).lean();

      return {
        date,
        dueDate: dueDate || null,
        count: tasks.length,
        tasks: tasks.map(serializeTask),
        note: tasks.length ? "" : "No matching scheduled tasks were found."
      };
    }
  }),

  createTool({
    name: "searchTasks",
    label: "Searching Tasks",
    category: "tasks",
    description: "Search tasks by title, description, notes, assignee, type, or status.",
    parameters: {
      query: { type: "string", required: true },
      limit: { type: "number", default: 10 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const query = sanitizeText(params.query, 100);
      const limit = toPositiveInteger(params.limit, 10, 40);

      if (!query) {
        return { query, tasks: [], count: 0, note: "No task search term was provided." };
      }

      const escaped = escapeRegex(query);
      const tasks = await Task.find({
        $or: [
          { title: { $regex: escaped, $options: "i" } },
          { description: { $regex: escaped, $options: "i" } },
          { notes: { $regex: escaped, $options: "i" } },
          { assigneeName: { $regex: escaped, $options: "i" } },
          { type: { $regex: escaped, $options: "i" } },
          { status: { $regex: escaped, $options: "i" } }
        ]
      })
        .sort({ date: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        query,
        count: tasks.length,
        tasks: tasks.map(serializeTask)
      };
    }
  }),

  createTool({
    name: "taskSummary",
    label: "Summarizing Tasks",
    category: "tasks",
    description: "Summarize open, completed, scheduled, and urgent tasks.",
    parameters: {},
    execute: async (_params, context) => {
      requireSuperAdminToolAccess(context);
      const [totalTasks, completedTasks, urgentTasks, upcomingTasks] = await Promise.all([
        Task.countDocuments(),
        Task.countDocuments({ status: "Completed" }),
        Task.find({ priority: "Urgent", status: { $ne: "Completed" } }).sort({ date: 1 }).limit(10).lean(),
        Task.find({ status: { $ne: "Completed" }, date: { $gte: new Date() } })
          .sort({ date: 1 })
          .limit(10)
          .lean()
      ]);

      return {
        totalTasks,
        completedTasks,
        openTasks: totalTasks - completedTasks,
        urgentOpenTasks: urgentTasks.length,
        urgentTasks: urgentTasks.map(serializeTask),
        upcomingTasks: upcomingTasks.map(serializeTask)
      };
    }
  })
];
