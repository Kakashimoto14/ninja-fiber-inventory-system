import Product from "../models/Product.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";

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

export const getStats = async (_req, res, next) => {
  try {
    const taskQuery =
      _req.query.role === "superadmin" || !_req.query.accountId ? {} : { assigneeId: _req.query.accountId };
    const [products, totalTasks, completedTasks] = await Promise.all([
      Product.find(),
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: "Completed" })
    ]);

    const totalProducts = products.length;
    const lowStockCount = products.filter(
      (product) => product.quantity <= product.reorderPoint
    ).length;
    const openTasks = totalTasks - completedTasks;

    res.json({
      totalProducts,
      lowStockCount,
      totalTasks,
      openTasks,
      completedTasks,
      inventoryMovement: buildInventoryMovement(products)
    });
  } catch (error) {
    next(error);
  }
};

export const getActivity = async (_req, res, next) => {
  try {
    const activity = await Activity.find().sort({ createdAt: -1 }).limit(5);
    res.json(activity);
  } catch (error) {
    next(error);
  }
};
