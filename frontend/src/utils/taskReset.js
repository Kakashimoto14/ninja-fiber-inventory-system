import { protectedResetStatuses } from "../data/taskConfig.js";

export const toDateInputValue = (value = new Date()) => {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
};

export const startOfTodayIso = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

export const applyDailyReset = (tasks) => {
  const today = toDateInputValue();

  return tasks.map((task) => {
    const taskDate = toDateInputValue(task.date || task.dueDate || new Date());
    const shouldReset = taskDate < today && !protectedResetStatuses.includes(task.status);

    if (!shouldReset) {
      return task;
    }

    return {
      ...task,
      status: "Pending",
      date: startOfTodayIso(),
      lastResetAt: new Date().toISOString()
    };
  });
};

