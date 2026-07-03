import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import { RESET_PROTECTED_STATUSES } from "../config/taskConfig.js";

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const runDailyTaskReset = async () => {
  const today = startOfToday();

  const result = await Task.updateMany(
    {
      status: { $nin: RESET_PROTECTED_STATUSES }
    },
    {
      $set: {
        status: "Pending",
        date: today,
        lastResetAt: new Date()
      }
    }
  );

  if (result.modifiedCount > 0) {
    await Activity.create({
      message: `Daily reset moved ${result.modifiedCount} task(s) back to Pending`,
      type: "task"
    }).catch(() => null);
  }

  return result;
};

export const scheduleDailyTaskReset = () => {
  const scheduleNextRun = () => {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);

    setTimeout(async () => {
      try {
        await runDailyTaskReset();
      } catch (error) {
        console.error("Daily task reset failed:", error.message);
      } finally {
        scheduleNextRun();
      }
    }, nextRun.getTime() - now.getTime());
  };

  scheduleNextRun();
};

