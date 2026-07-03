import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import TaskCalendar from "../components/tasks/TaskCalendar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { mockTasks } from "../data/mockData.js";
import { tasksApi } from "../services/api.js";
import { applyDailyReset, toDateInputValue } from "../utils/taskReset.js";

export default function Calendar() {
  const { account } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [mode, setMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

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

  const visibleTasks = useMemo(
    () => (account.role === "superadmin" ? tasks : tasks.filter((task) => task.assigneeId === account.id)),
    [account, tasks]
  );

  if (loading) {
    return <LoadingSpinner label="Loading calendar..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Calendar</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
            {account.role === "superadmin" ? "Aggregated Task Calendar" : "My Task Calendar"}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {demoMode && (
            <span className="rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
              Using local demo data
            </span>
          )}
          <input className="input min-w-40" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-1">
            {["day", "week", "month"].map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded px-3 py-2 text-sm font-bold capitalize ${
                  mode === item ? "bg-primary text-white" : "text-slate-500 hover:text-primary"
                }`}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="card p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal/10 text-teal">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Scheduled Tasks</h2>
            <p className="text-sm text-slate-500">{visibleTasks.length} tasks in current scope</p>
          </div>
        </div>
        <TaskCalendar
          tasks={visibleTasks}
          mode={mode}
          selectedDate={new Date(selectedDate)}
          showAssignee={account.role === "superadmin"}
        />
      </section>
    </div>
  );
}
