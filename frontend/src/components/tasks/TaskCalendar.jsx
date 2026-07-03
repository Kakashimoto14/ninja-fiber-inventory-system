import { useMemo } from "react";
import { formatDate } from "../../utils/format.js";
import { toDateInputValue } from "../../utils/taskReset.js";

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getMonthDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leadingDays = first.getDay();
  const days = [];

  for (let index = 0; index < leadingDays; index += 1) {
    days.push(addDays(first, index - leadingDays));
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(addDays(last, days.length - leadingDays - last.getDate() + 1));
  }

  return days;
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const priorityDot = {
  Urgent: "bg-red-500",
  High: "bg-orange-400",
  Medium: "bg-blue-400",
  Low: "bg-slate-400"
};

export default function TaskCalendar({
  tasks,
  mode = "week",
  selectedDate = new Date(),
  showAssignee = false,
  onDateSelect
}) {
  const todayKey = toDateInputValue(new Date());

  const days = useMemo(() => {
    const date = new Date(selectedDate);

    if (mode === "day") {
      return [date];
    }

    if (mode === "month") {
      return getMonthDays(date);
    }

    const start = addDays(date, -date.getDay());
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [mode, selectedDate]);

  const tasksByDate = useMemo(() => {
    return tasks.reduce((grouped, task) => {
      const key = toDateInputValue(task.date || task.dueDate || new Date());
      grouped[key] = grouped[key] || [];
      grouped[key].push(task);
      return grouped;
    }, {});
  }, [tasks]);

  /* ── Month view ── */
  if (mode === "month") {
    return (
      <div>
        {/* Day-of-week headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = toDateInputValue(day);
            const dayTasks = tasksByDate[key] || [];
            const isCurrentMonth = day.getMonth() === new Date(selectedDate).getMonth();
            const isSelected = key === toDateInputValue(selectedDate);
            const isToday = key === todayKey;
            const hasTasks = dayTasks.length > 0;

            // top priority colour for the day
            const topPriority = ["Urgent", "High", "Medium", "Low"].find((p) =>
              dayTasks.some((t) => t.priority === p)
            );

            return (
              <button
                type="button"
                key={key}
                onClick={() => onDateSelect?.(key)}
                className={`group relative flex min-h-20 flex-col rounded-lg border p-2 text-left transition-all duration-150
                  hover:-translate-y-0.5 hover:shadow-md
                  ${
                    isSelected
                      ? "border-teal bg-teal/5 ring-2 ring-teal/30 shadow-sm"
                      : isToday
                        ? "border-primary/40 bg-primary/5"
                        : isCurrentMonth
                          ? "border-slate-200 bg-white hover:border-teal/50"
                          : "border-slate-100 bg-slate-50/50"
                  }`}
              >
                {/* Day number */}
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors
                      ${
                        isSelected
                          ? "bg-teal text-white"
                          : isToday
                            ? "bg-primary text-white"
                            : isCurrentMonth
                              ? "text-slate-800 group-hover:text-teal"
                              : "text-slate-400"
                      }`}
                  >
                    {day.getDate()}
                  </span>

                  {/* Task count badge */}
                  {hasTasks && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                        isSelected ? "bg-teal text-white" : "bg-soft text-slate-500"
                      }`}
                    >
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Task dots / previews */}
                <div className="mt-1.5 flex-1 space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task._id || task.id}
                      className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${
                        isSelected ? "bg-teal/10" : "bg-soft"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityDot[task.priority] || "bg-slate-400"}`}
                      />
                      <p className="line-clamp-1 text-[10px] font-semibold text-slate-700">{task.title}</p>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="px-1.5 text-[10px] font-bold text-primary">+{dayTasks.length - 3} more</p>
                  )}
                  {!hasTasks && isCurrentMonth && (
                    <p className="px-1 text-[10px] text-slate-300">—</p>
                  )}
                </div>

                {/* Priority indicator stripe at bottom */}
                {topPriority && isCurrentMonth && (
                  <div
                    className={`absolute bottom-0 inset-x-0 h-0.5 rounded-b-lg opacity-60 ${priorityDot[topPriority]}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Day / Week view (unchanged visual) ── */
  return (
    <div className={mode === "day" ? "grid gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7"}>
      {days.map((day) => {
        const key = toDateInputValue(day);
        const dayTasks = tasksByDate[key] || [];
        const isCurrentMonth = day.getMonth() === new Date(selectedDate).getMonth();
        const isSelected = key === toDateInputValue(selectedDate);

        return (
          <button
            type="button"
            key={key}
            onClick={() => onDateSelect?.(key)}
            className={`min-h-36 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-teal hover:shadow-sm ${
              isSelected
                ? "border-teal bg-teal/5 ring-2 ring-teal/20"
                : mode === "month" && !isCurrentMonth
                  ? "border-slate-100 bg-slate-50/60"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-slate-950">{formatDate(day)}</p>
              <span className="rounded-md bg-soft px-2 py-1 text-xs font-bold text-slate-500">{dayTasks.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {dayTasks.slice(0, mode === "month" ? 3 : 8).map((task) => (
                <div key={task._id || task.id} className="rounded-md border border-slate-100 bg-soft p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-teal/10 px-1.5 py-0.5 text-[11px] font-bold text-teal">{task.type}</span>
                    <span className="text-[11px] font-bold text-slate-500">{task.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-800">{task.title}</p>
                  {showAssignee && <p className="mt-1 text-[11px] font-semibold text-primary">{task.assigneeName}</p>}
                </div>
              ))}
              {dayTasks.length === 0 && <p className="text-xs font-medium text-slate-400">No tasks</p>}
              {mode === "month" && dayTasks.length > 3 && (
                <p className="text-xs font-bold text-primary">+{dayTasks.length - 3} more</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
