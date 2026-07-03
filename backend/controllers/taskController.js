import mongoose from "mongoose";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import { runDailyTaskReset } from "../services/dailyReset.js";

const createActivity = (message, type, entityId) =>
  Activity.create({ message, type, entityId }).catch(() => null);

const getTaskQueryForRole = (query) => {
  if (query.role === "superadmin") {
    return {};
  }

  if (query.accountId) {
    return { assigneeId: query.accountId };
  }

  return {};
};

const assertValidTaskId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid task ID");
    error.statusCode = 400;
    throw error;
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find(getTaskQueryForRole(req.query)).sort({ date: 1, createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const task = await Task.create(req.body);
    await createActivity(`Created ${task.type.toLowerCase()} task "${task.title}" for ${task.assigneeName}`, "task", task._id);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    assertValidTaskId(req.params.id);
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    const previousStatus = task.status;
    Object.assign(task, req.body);

    if (task.status === "Completed" && previousStatus !== "Completed") {
      task.completedAt = new Date();
    }

    if (task.status !== "Completed") {
      task.completedAt = null;
    }

    const updatedTask = await task.save();

    const completedNow = previousStatus !== "Completed" && updatedTask.status === "Completed";
    await createActivity(
      completedNow ? `Task "${updatedTask.title}" completed` : `Updated task "${updatedTask.title}"`,
      "task",
      updatedTask._id
    );

    res.json(updatedTask);
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const resetTasks = async (_req, res, next) => {
  try {
    const result = await runDailyTaskReset();
    res.json({ message: "Daily task reset complete", modifiedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    assertValidTaskId(req.params.id);
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    await task.deleteOne();
    await createActivity(`Deleted task "${task.title}"`, "task", task._id);

    res.json({ message: "Task deleted" });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
