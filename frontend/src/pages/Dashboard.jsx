import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  Package,
  PackagePlus,
  TrendingUp,
  Zap
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import TaskCalendar from "../components/tasks/TaskCalendar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardApi, tasksApi } from "../services/api.js";
import {
  importedPayments,
  importedExpenses,
  mockActivity,
  mockMovement,
  mockProducts,
  mockTasks
} from "../data/mockData.js";
import { formatDate } from "../utils/format.js";
import { applyDailyReset, toDateInputValue } from "../utils/taskReset.js";

/* ─── helpers ─── */
const toYMD = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const peso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 });

/* Revenue by day (real data) */
const buildRevenueData = () => {
  const revMap = {};
  const expMap = {};
  importedPayments.forEach((r) => {
    const d = toYMD(r.date);
    if (d) revMap[d] = (revMap[d] || 0) + Number(r.amount || 0);
  });
  importedExpenses.forEach((r) => {
    const d = toYMD(r.date);
    if (d) expMap[d] = (expMap[d] || 0) + Number(r.amount || 0);
  });
  const days = [...new Set([...Object.keys(revMap), ...Object.keys(expMap)])].sort();
  return days.map((d) => ({
    day: `${parseInt(d.slice(8))}`,
    Revenue: revMap[d] || 0,
    Expenses: expMap[d] || 0
  }));
};

const revenueData = buildRevenueData();

/* Quick action button */
function QuickAction({ icon: Icon, label, sub, color, bg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:border-transparent`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg} transition-transform group-hover:scale-110`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-extrabold text-slate-950">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </button>
  );
}

/* Custom chart tooltip */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-bold text-slate-700 mb-1">Jun {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: ₱{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const todayYMD = toYMD(new Date());
  const revenueToday = importedPayments
    .filter((r) => toYMD(r.date) === todayYMD)
    .reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalRevenue = importedPayments.reduce((s, r) => s + Number(r.amount || 0), 0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const params = { accountId: account.id, role: account.role };
        const [statsData, activityData, taskData] = await Promise.all([
          dashboardApi.stats(params),
          dashboardApi.activity(),
          tasksApi.list(params)
        ]);
        setStats(statsData);
        setActivity(activityData);
        setTasks(applyDailyReset(taskData));
      } catch {
        const resetTasks = applyDailyReset(mockTasks);
        const visibleTasks =
          account.role === "superadmin"
            ? resetTasks
            : resetTasks.filter((task) => task.assigneeId === account.id);
        const completedTasks = visibleTasks.filter((task) => task.status === "Completed").length;
        setDemoMode(true);
        setStats({
          totalProducts: mockProducts.length,
          lowStockCount: mockProducts.filter((p) => p.quantity <= p.reorderPoint).length,
          openTasks: visibleTasks.length - completedTasks,
          completedTasks,
          inventoryMovement: mockMovement
        });
        setActivity(mockActivity);
        setTasks(visibleTasks);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [account]);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  const todayTasks = tasks.filter((t) => {
    const d = toDateInputValue(t.date || t.dueDate || new Date());
    return d === toDateInputValue() && t.status !== "Completed";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Overview</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
            {account.role === "superadmin" ? "Superadmin Dashboard" : "Inventory Dashboard"}
          </h1>
        </div>
        {demoMode && (
          <span className="rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
            Using local demo data
          </span>
        )}
      </div>

      {/* KPI Stat Cards — now 5 including Revenue Today */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} helper="Active inventory items" />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          accent="bg-cta"
          helper="Quantity at or below reorder point"
        />
        <StatCard title="Open Tasks" value={stats.openTasks} icon={ClipboardList} accent="bg-teal" helper="Pending or in progress" />
        <StatCard title="Completed Tasks" value={stats.completedTasks} icon={CheckCircle2} accent="bg-emerald-600" helper="Finished follow-ups" />
        <StatCard
          title="Revenue Today"
          value={peso(revenueToday)}
          icon={Zap}
          accent="bg-violet-600"
          helper={`Total: ${peso(totalRevenue)}`}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Quick Actions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={ClipboardPlus}
            label="Add New Task"
            sub="Schedule an install, repair, or reactivation"
            color="text-teal"
            bg="bg-teal/10"
            onClick={() => navigate("/app/tasks")}
          />
          <QuickAction
            icon={PackagePlus}
            label="Add Product"
            sub="Register a new inventory item"
            color="text-primary"
            bg="bg-primary/10"
            onClick={() => navigate("/app/products")}
          />
          <QuickAction
            icon={BarChart2}
            label="View Analytics"
            sub="Revenue, expenses & task performance"
            color="text-violet-700"
            bg="bg-violet-50"
            onClick={() => navigate("/app/analytics")}
          />
          <QuickAction
            icon={TrendingUp}
            label="Business Records"
            sub="Payments, expenses & subscribers"
            color="text-emerald-700"
            bg="bg-emerald-50"
            onClick={() => navigate("/app/records")}
          />
        </div>
      </div>

      {/* Revenue chart (real data) + Activity feed */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Revenue vs Expenses</h2>
              <p className="mt-1 text-sm text-slate-500">June 2026 — actual daily data</p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => navigate("/app/analytics")}
            >
              Full report →
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} barGap={2}>
                <defs>
                  <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0C4E8A" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0C4E8A" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} width={58} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Revenue" fill="url(#revGrad)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Expenses" fill="url(#expGrad)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-slate-950">Recent Activity</h2>
          <div className="mt-5 space-y-4">
            {activity.map((item) => (
              <div key={item._id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-teal shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Today's Tasks highlight */}
      {todayTasks.length > 0 && (
        <section className="card border-teal/30 p-5" style={{ borderColor: "rgba(20,184,166,0.3)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Today's Open Tasks
                <span className="ml-2 rounded-full bg-teal/10 px-2 py-0.5 text-sm font-bold text-teal">
                  {todayTasks.length}
                </span>
              </h2>
              <p className="mt-1 text-sm text-slate-500">Tasks scheduled for today that need attention</p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => navigate("/app/tasks")}
            >
              View all →
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {todayTasks.slice(0, 4).map((task) => (
              <div
                key={task._id || task.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-soft p-3"
              >
                <div
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    task.priority === "Urgent"
                      ? "bg-red-500"
                      : task.priority === "High"
                        ? "bg-orange-400"
                        : task.priority === "Medium"
                          ? "bg-blue-400"
                          : "bg-slate-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {task.type} · {task.assigneeName} · {task.priority}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weekly calendar */}
      <section className="card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              {account.role === "superadmin" ? "All Admins Weekly Calendar" : "My Weekly Calendar"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Install, reactivate, and repair tasks by date</p>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => navigate("/app/tasks")}
          >
            Full calendar →
          </button>
        </div>
        <TaskCalendar
          tasks={tasks}
          mode="week"
          selectedDate={new Date()}
          showAssignee={account.role === "superadmin"}
          onDateSelect={() => navigate("/app/tasks")}
        />
      </section>
    </div>
  );
}
