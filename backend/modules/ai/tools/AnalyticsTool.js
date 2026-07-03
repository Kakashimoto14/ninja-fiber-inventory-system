import Activity from "../../../models/Activity.js";
import Payroll from "../../../models/Payroll.js";
import Product from "../../../models/Product.js";
import Task from "../../../models/Task.js";
import { aiConfig } from "../config/aiConfig.js";
import { getOrSetCachedValue } from "../utils/cache.js";
import { createTool } from "./ToolDefinition.js";
import { requireSuperAdminToolAccess, toMonth, toYear } from "./toolValidation.js";

const buildInventoryMovement = (products) => {
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);

  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const wave = Math.round(Math.sin(day / 4) * 9);
    const drift = day * 2;

    return {
      day: `Day ${day}`,
      quantity: Math.max(totalQuantity - 60 + drift + wave, 0)
    };
  });
};

const monthRange = ({ month, year }) => {
  const now = new Date();
  const parsedMonth = toMonth(month) || now.getMonth() + 1;
  const parsedYear = toYear(year) || now.getFullYear();
  const start = new Date(parsedYear, parsedMonth - 1, 1);
  const end = new Date(parsedYear, parsedMonth, 1);

  return { month: parsedMonth, year: parsedYear, start, end };
};

export const getAnalyticsTools = () => [
  createTool({
    name: "dashboardSummary",
    label: "Reading Dashboard",
    category: "analytics",
    description: "Summarize dashboard inventory, task, and activity metrics.",
    parameters: {
      accountId: { type: "string", required: false },
      role: { type: "string", required: false }
    },
    execute: async (_params, context) => {
      requireSuperAdminToolAccess(context);

      const { value } = await getOrSetCachedValue("ai:dashboardSummary", aiConfig.summaryCacheTtlMs, async () => {
        const [products, totalTasks, completedTasks, recentActivity] = await Promise.all([
          Product.find().select("name quantity reorderPoint category").lean(),
          Task.countDocuments(),
          Task.countDocuments({ status: "Completed" }),
          Activity.find().sort({ createdAt: -1 }).limit(5).lean()
        ]);
        const lowStockCount = products.filter((product) => product.quantity <= product.reorderPoint).length;

        return {
          totalProducts: products.length,
          lowStockCount,
          totalTasks,
          openTasks: totalTasks - completedTasks,
          completedTasks,
          inventoryMovement: buildInventoryMovement(products).slice(-7),
          recentActivity: recentActivity.map((activity) => ({
            id: String(activity._id),
            message: activity.message,
            type: activity.type,
            createdAt: activity.createdAt
          }))
        };
      });

      return value;
    }
  }),

  createTool({
    name: "monthlySummary",
    label: "Building Monthly Summary",
    category: "analytics",
    description: "Summarize tasks, payroll, inventory, and activities for a month.",
    parameters: {
      month: { type: "number", required: false },
      year: { type: "number", required: false }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const range = monthRange(params);
      const cacheKey = `ai:monthlySummary:${range.month}:${range.year}`;

      const { value } = await getOrSetCachedValue(cacheKey, aiConfig.summaryCacheTtlMs, async () => {
        const dateQuery = { $gte: range.start, $lt: range.end };
        const [createdTasks, completedTasks, payrolls, activities, products, lowStockProducts] =
          await Promise.all([
            Task.countDocuments({ createdAt: dateQuery }),
            Task.countDocuments({ completedAt: dateQuery }),
            Payroll.find({ createdAt: dateQuery }).lean(),
            Activity.find({ createdAt: dateQuery }).sort({ createdAt: -1 }).limit(10).lean(),
            Product.countDocuments(),
            Product.find({ $expr: { $lte: ["$quantity", "$reorderPoint"] } })
              .select("name sku quantity reorderPoint")
              .sort({ quantity: 1 })
              .limit(10)
              .lean()
          ]);

        return {
          month: range.month,
          year: range.year,
          createdTasks,
          completedTasks,
          payrollRecords: payrolls.length,
          payrollNetTotal: payrolls.reduce((sum, payroll) => sum + payroll.netPay, 0),
          totalProducts: products,
          lowStockCount: lowStockProducts.length,
          lowStockProducts: lowStockProducts.map((product) => ({
            id: String(product._id),
            name: product.name,
            sku: product.sku,
            quantity: product.quantity,
            reorderPoint: product.reorderPoint
          })),
          recentActivities: activities.map((activity) => ({
            id: String(activity._id),
            message: activity.message,
            type: activity.type,
            createdAt: activity.createdAt
          }))
        };
      });

      return value;
    }
  })
];
