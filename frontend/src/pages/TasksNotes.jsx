import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardPlus, Edit3, Trash2, CalendarCheck } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import TaskCalendar from "../components/tasks/TaskCalendar.jsx";
import TaskModal from "../components/tasks/TaskModal.jsx";
import { mockTasks } from "../data/mockData.js";
import { taskTypes } from "../data/taskConfig.js";
import { tasksApi } from "../services/api.js";
import { formatDate, getId } from "../utils/format.js";
import { applyDailyReset, toDateInputValue } from "../utils/taskReset.js";
import { useAuth } from "../context/AuthContext.jsx";

const statusClasses = {
  Pending: "bg-slate-100 text-slate-700",
  Scheduled: "bg-cyan-50 text-cyan-700",
  Verification: "bg-violet-50 text-violet-700",
  Diagnosing: "bg-amber-50 text-amber-700",
  "In Progress": "bg-blue-50 text-primary",
  Completed: "bg-emerald-50 text-emerald-700"
};

const priorityClasses = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-primary",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700"
};

export default function TasksNotes() {
  const { account, adminAccounts } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [taskPanelKey, setTaskPanelKey] = useState(0); // triggers re-animation
  const taskSectionRef = useRef(null);

  const roleScopedTasks = useMemo(
    () =>
      account?.role === "superadmin"
        ? tasks
        : tasks.filter((task) => task.assigneeId === account?.id),
    [account, tasks]
  );

  const scopedTasks = useMemo(() => {
    return roleScopedTasks.filter((task) => {
      const matchesType = typeFilter === "All" || task.type === typeFilter;
      const matchesDate = toDateInputValue(task.date || task.dueDate || new Date()) === selectedDate;
      return matchesType && matchesDate;
    });
  }, [roleScopedTasks, selectedDate, typeFilter]);

  const activeTasks = useMemo(() => scopedTasks.filter((task) => task.status !== "Completed"), [scopedTasks]);
  const completedTasks = useMemo(() => scopedTasks.filter((task) => task.status === "Completed"), [scopedTasks]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await tasksApi.list({ accountId: account.id, role: account.role });
        setTasks(applyDailyReset(data));
      } catch {
        setDemoMode(true);
        setTasks(applyDailyReset(mockTasks));
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [account]);

  const handleDateSelect = (dateKey) => {
    setSelectedDate(dateKey);
    setTaskPanelKey((prev) => prev + 1); // re-trigger animation
    // Smooth scroll to task section after a small delay for re-render
    setTimeout(() => {
      taskSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleTodayClick = () => {
    handleDateSelect(toDateInputValue());
  };

  const normalizePayloadForRole = (payload) => {
    if (account.role === "superadmin") {
      return payload;
    }

    return {
      ...payload,
      assigneeId: account.id,
      assigneeName: account.name
    };
  };

  const saveTask = async (payload) => {
    const normalizedPayload = normalizePayloadForRole(payload);

    const editingTaskId = getId(editingTask);

    if (editingTaskId) {
      const id = editingTaskId;
      try {
        const updated = await tasksApi.update(id, normalizedPayload);
        setTasks((current) => current.map((task) => (getId(task) === id ? updated : task)));
      } catch {
        setDemoMode(true);
        setTasks((current) => current.map((task) => (getId(task) === id ? { ...task, ...normalizedPayload } : task)));
      }
    } else {
      try {
        const created = await tasksApi.create(normalizedPayload);
        setTasks((current) => [created, ...current]);
      } catch {
        setDemoMode(true);
        setTasks((current) => [{ ...normalizedPayload, _id: `task-${Date.now()}` }, ...current]);
      }
    }
    setEditingTask(null);
    setTaskModalOpen(false);
  };

  const updateTask = async (task, payload) => {
    const id = getId(task);
    const nextTask = { ...task, ...payload };
    setTasks((current) => current.map((item) => (getId(item) === id ? nextTask : item)));

    try {
      const updated = await tasksApi.update(id, payload);
      setTasks((current) => current.map((item) => (getId(item) === id ? updated : item)));
    } catch {
      setDemoMode(true);
    }
  };

  const deleteTask = async (task) => {
    const id = getId(task);
    try {
      await tasksApi.remove(id);
    } catch {
      setDemoMode(true);
    }
    setTasks((current) => current.filter((item) => getId(item) !== id));
  };

  const renderTask = (task) => (
    <article key={getId(task)} className="card p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateTask(task, { status: task.status === "Completed" ? "Pending" : "Completed" })}
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
              task.status === "Completed"
                ? "border-emerald-500 bg-emerald-500 text-white scale-110"
                : "border-slate-300 bg-white text-transparent hover:border-emerald-400"
            }`}
            aria-label={`Mark ${task.title} complete`}
          >
            <CheckCircle2 className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-base font-extrabold ${task.status === "Completed" ? "text-slate-400 line-through" : "text-slate-950"}`}>
                {task.title}
              </h3>
              <span className="rounded-md bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal">{task.type}</span>
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${statusClasses[task.status]}`}>
                {task.status}
              </span>
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${priorityClasses[task.priority]}`}>
                {task.priority}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{task.description || "No description provided."}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
              <span>Assignee: {task.assigneeName}</span>
              <span>Date: {formatDate(task.date)}</span>
              <span>Deadline: {formatDate(task.dueDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-teal hover:text-primary transition-colors"
            onClick={() => {
              setEditingTask(task);
              setTaskModalOpen(true);
            }}
            aria-label={`Edit ${task.title}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:text-red-600 transition-colors"
            onClick={() => deleteTask(task)}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <label className="mt-4 block space-y-1.5">
        <span className="label">Notes</span>
        <textarea
          className="input min-h-28 resize-y"
          value={task.notes || ""}
          onChange={(event) => {
            const value = event.target.value;
            setTasks((current) =>
              current.map((item) => (getId(item) === getId(task) ? { ...item, notes: value } : item))
            );
          }}
          onBlur={(event) => updateTask(task, { notes: event.target.value })}
          placeholder="Write detailed task remarks here..."
        />
      </label>
    </article>
  );

  if (loading) {
    return <LoadingSpinner label="Loading tasks..." />;
  }

  const isToday = selectedDate === toDateInputValue();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Tasks & Calendar</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
            {account.role === "superadmin" ? "All Admin Tasks & Calendar" : "My Tasks, Notes & Calendar"}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {demoMode && (
            <span className="rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
              Using local demo data
            </span>
          )}
          <select className="input min-w-48" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option>All</option>
            {taskTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary whitespace-nowrap"
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
          >
            <ClipboardPlus className="h-4 w-4" />
            Add New Task
          </button>
        </div>
      </div>

      {/* Calendar card */}
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal/10 text-teal shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Task Calendar</h2>
              <p className="text-sm text-slate-500">Click any date to view its tasks & notes below</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTodayClick}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-all ${
                isToday
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal hover:text-teal"
              }`}
            >
              <CalendarCheck className="h-4 w-4" />
              Today
            </button>
            <input
              className="input max-w-44"
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateSelect(event.target.value)}
            />
          </div>
        </div>

        <TaskCalendar
          tasks={roleScopedTasks}
          mode="month"
          selectedDate={new Date(selectedDate)}
          showAssignee={account.role === "superadmin"}
          onDateSelect={handleDateSelect}
        />
      </section>

      {/* Task panel — scrolls into view when date selected */}
      <div ref={taskSectionRef} style={{ scrollMarginTop: "1.5rem" }}>
        {/* Selected date banner */}
        <div
          key={taskPanelKey}
          className="mb-4 flex items-center gap-3 rounded-xl border border-teal/30 bg-gradient-to-r from-teal/5 to-transparent px-5 py-3"
          style={{ animation: "fadeSlideIn 0.35s ease" }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal/10 text-teal">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal">
              {isToday ? "Today" : "Selected Day"}
            </p>
            <p className="text-base font-extrabold text-slate-950">{formatDate(selectedDate)}</p>
          </div>
          <span className="ml-auto rounded-full bg-teal/10 px-3 py-1 text-sm font-bold text-teal">
            {scopedTasks.length} task{scopedTasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Open tasks */}
        <section
          key={`active-${taskPanelKey}`}
          className="space-y-4"
          style={{ animation: "fadeSlideIn 0.4s ease" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-950">
              Open Work <span className="text-slate-400 font-medium text-base">— {formatDate(selectedDate)}</span>
            </h2>
            <span className="text-sm font-semibold text-slate-500">{activeTasks.length} tasks</span>
          </div>
          {activeTasks.length > 0
            ? activeTasks.map(renderTask)
            : (
              <div className="card p-8 text-center">
                <CalendarCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">No open tasks for this day.</p>
                <p className="mt-1 text-xs text-slate-400">Click a different date or add a new task.</p>
              </div>
            )}
        </section>

        {/* Completed tasks */}
        <section
          key={`done-${taskPanelKey}`}
          className="mt-6 space-y-4 border-t border-slate-200 pt-6"
          style={{ animation: "fadeSlideIn 0.45s ease" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-950">Completed</h2>
            <span className="text-sm font-semibold text-slate-500">{completedTasks.length} tasks</span>
          </div>
          {completedTasks.length > 0
            ? completedTasks.map(renderTask)
            : <div className="card p-6 text-sm text-slate-500">No completed tasks yet.</div>}
        </section>
      </div>

      {/* Keyframe style injected inline */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {taskModalOpen && (
        <TaskModal
          task={editingTask}
          currentAccount={account}
          adminAccounts={adminAccounts}
          onClose={() => {
            setEditingTask(null);
            setTaskModalOpen(false);
          }}
          onSave={saveTask}
        />
      )}
    </div>
  );
}
