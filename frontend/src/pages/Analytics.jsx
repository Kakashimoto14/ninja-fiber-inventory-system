import { useMemo, useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Users,
  Zap, CheckCircle2, BarChart2, PieChartIcon
} from "lucide-react";
import {
  importedPayments,
  importedExpenses,
  importedSubscribers,
  mockTasks
} from "../data/mockData.js";
import { applyDailyReset } from "../utils/taskReset.js";
import { useAuth } from "../context/AuthContext.jsx";

/* ─── helpers ─── */
const toYMD = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const peso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 0 });

const COLORS = ["#0C4E8A", "#14B8A6", "#F97316", "#8B5CF6", "#10B981", "#EF4444"];

/* ─── Animated count card ─── */
function StatCard({ label, value, sub, icon: Icon, color = "text-primary", bg = "bg-primary/10" }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`mt-0.5 text-2xl font-extrabold ${color}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Custom tooltip ─── */
function CustomTooltip({ active, payload, label, prefix = "₱" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {prefix}{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { account } = useAuth();
  const [revenueTab, setRevenueTab] = useState("daily"); // daily | method

  /* ── Revenue by day ── */
  const revenueByDay = useMemo(() => {
    const map = {};
    importedPayments.forEach((r) => {
      const d = toYMD(r.date);
      if (!d) return;
      const day = d.slice(8); // "01".."26"
      map[day] = (map[day] || 0) + Number(r.amount || 0);
    });
    const expMap = {};
    importedExpenses.forEach((r) => {
      const d = toYMD(r.date);
      if (!d) return;
      const day = d.slice(8);
      expMap[day] = (expMap[day] || 0) + Number(r.amount || 0);
    });
    return Object.keys(map)
      .sort()
      .map((day) => ({
        day: `Jun ${parseInt(day)}`,
        Revenue: map[day] || 0,
        Expenses: expMap[day] || 0,
        Net: (map[day] || 0) - (expMap[day] || 0)
      }));
  }, []);

  /* ── Payment method breakdown ── */
  const methodData = useMemo(() => {
    const map = {};
    importedPayments.forEach((r) => {
      const m = r.paymentMethod || "Unknown";
      map[m] = (map[m] || 0) + Number(r.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, []);

  /* ── Service type breakdown ── */
  const serviceData = useMemo(() => {
    const map = {};
    importedPayments.forEach((r) => {
      const s = r.serviceType || "Other";
      map[s] = (map[s] || 0) + Number(r.amount || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, []);

  /* ── Top subscribers ── */
  const topSubscribers = useMemo(() => {
    const map = {};
    importedPayments.forEach((r) => {
      const name = r.subscriberName || "Unknown";
      map[name] = (map[name] || 0) + Number(r.amount || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, total]) => ({ name, total }));
  }, []);

  /* ── Task analytics ── */
  const tasks = useMemo(() => applyDailyReset(mockTasks), []);
  const tasksByType = useMemo(() => {
    const types = {};
    tasks.forEach((t) => {
      if (!types[t.type]) types[t.type] = { type: t.type, total: 0, completed: 0 };
      types[t.type].total++;
      if (t.status === "Completed") types[t.type].completed++;
    });
    return Object.values(types).map((t) => ({
      ...t,
      rate: t.total ? Math.round((t.completed / t.total) * 100) : 0
    }));
  }, [tasks]);

  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  /* ── Summary stats ── */
  const totalRevenue = importedPayments.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalExpenses = importedExpenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const todayYMD = toYMD(new Date());
  const revenueToday = importedPayments
    .filter((r) => toYMD(r.date) === todayYMD)
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Analytics</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Business Analytics & Reports</h1>
        <p className="mt-1 text-sm text-slate-500">June 2026 — real data from imported records</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={peso(totalRevenue)} sub={`${importedPayments.length} payments`} icon={DollarSign} color="text-emerald-700" bg="bg-emerald-50" />
        <StatCard label="Total Expenses" value={peso(totalExpenses)} sub={`${importedExpenses.length} entries`} icon={TrendingDown} color="text-red-600" bg="bg-red-50" />
        <StatCard label="Net Profit" value={peso(netProfit)} sub="Revenue minus expenses" icon={TrendingUp} color={netProfit >= 0 ? "text-primary" : "text-red-600"} bg={netProfit >= 0 ? "bg-primary/10" : "bg-red-50"} />
        <StatCard label="Revenue Today" value={peso(revenueToday)} sub={todayYMD} icon={Zap} color="text-teal" bg="bg-teal/10" />
      </div>

      {/* Revenue vs Expenses Chart */}
      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Revenue vs Expenses</h2>
            <p className="text-sm text-slate-500">Daily breakdown for June 2026</p>
          </div>
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-1">
            {["daily", "method"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded px-3 py-1.5 text-sm font-bold capitalize transition ${
                  revenueTab === tab ? "bg-primary text-white" : "text-slate-500 hover:text-primary"
                }`}
                onClick={() => setRevenueTab(tab)}
              >
                {tab === "daily" ? "By Day" : "By Method"}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {revenueTab === "daily" ? (
              <BarChart data={revenueByDay} barGap={2}>
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
                <YAxis tick={{ fontSize: 11 }} width={55} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Revenue" fill="url(#revGrad)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Expenses" fill="url(#expGrad)" radius={[3, 3, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={methodData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {methodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* Net Profit Trend + Service Breakdown */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-slate-950">Net Profit Trend</h2>
          <p className="mt-1 text-sm text-slate-500">Daily net (revenue − expenses) for June</p>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="netGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} width={55} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Net" stroke="#14B8A6" fill="url(#netGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-slate-950">Service Breakdown</h2>
          <p className="mt-1 text-sm text-slate-500">Revenue by service type</p>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, "Revenue"]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Top Subscribers + Task Analytics */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Top subscribers */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Top Subscribers</h2>
              <p className="text-xs text-slate-500">By total payment amount</p>
            </div>
          </div>
          <div className="space-y-2">
            {topSubscribers.map((sub, i) => {
              const pct = Math.round((sub.total / topSubscribers[0].total) * 100);
              return (
                <div key={sub.name} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs font-bold text-slate-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="truncate text-sm font-semibold text-slate-800">{sub.name}</span>
                      <span className="shrink-0 text-sm font-bold text-primary">{peso(sub.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-primary to-teal transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Task analytics */}
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10">
              <CheckCircle2 className="h-5 w-5 text-teal" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Task Performance</h2>
              <p className="text-xs text-slate-500">Completion rate by task type</p>
            </div>
          </div>

          {/* Overall rate */}
          <div className="mb-5 rounded-xl bg-gradient-to-r from-primary/5 to-teal/5 border border-teal/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-600">Overall Completion Rate</span>
              <span className="text-xl font-extrabold text-primary">{completionRate}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-primary to-teal transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{completedTasks} of {tasks.length} tasks completed</p>
          </div>

          {/* By type */}
          <div className="space-y-3">
            {tasksByType.map((t) => (
              <div key={t.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">{t.type}</span>
                  <span className="text-xs font-bold text-slate-500">{t.completed}/{t.total} · {t.rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal transition-all duration-500"
                    style={{ width: `${t.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Priority distribution */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Priority Distribution</p>
            <div className="grid grid-cols-4 gap-2">
              {["Low", "Medium", "High", "Urgent"].map((p) => {
                const count = tasks.filter((t) => t.priority === p).length;
                const colors = {
                  Low: "bg-slate-100 text-slate-600",
                  Medium: "bg-blue-50 text-primary",
                  High: "bg-orange-50 text-orange-700",
                  Urgent: "bg-red-50 text-red-700"
                };
                return (
                  <div key={p} className={`rounded-lg p-2 text-center ${colors[p]}`}>
                    <p className="text-lg font-extrabold">{count}</p>
                    <p className="text-[10px] font-bold">{p}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Subscriber count */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
            <BarChart2 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Revenue Summary</h2>
            <p className="text-xs text-slate-500">Key financial metrics</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Subscribers", value: importedSubscribers.length.toLocaleString(), sub: "in database", color: "text-violet-700", bg: "bg-violet-50" },
            { label: "Avg Revenue/Day", value: peso(totalRevenue / (revenueByDay.length || 1)), sub: "over 26 days", color: "text-primary", bg: "bg-primary/10" },
            { label: "Profit Margin", value: `${totalRevenue ? Math.round((netProfit / totalRevenue) * 100) : 0}%`, sub: "net / revenue", color: "text-emerald-700", bg: "bg-emerald-50" }
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
