import { useEffect, useState } from "react";
import { Activity, Banknote, FileText, UserRound, UsersRound } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import { payrollApi } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";
import { formatPayrollPeriod, formatPeso } from "../../utils/payroll.js";

export default function PayrollDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummary(await payrollApi.dashboard());
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load payroll dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading payroll dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Payroll</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Payroll Dashboard</h1>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Total Employees" value={summary.totalEmployees} icon={UsersRound} helper="All payroll employees" />
            <StatCard title="Payroll Records" value={summary.payrollRecords} icon={FileText} accent="bg-teal" helper="Generated payroll slips" />
            <StatCard
              title="Current Month Expense"
              value={formatPeso(summary.currentMonthExpense, 0)}
              icon={Banknote}
              accent="bg-cta"
              helper="Net payroll total"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <section className="card p-5">
              <h2 className="text-lg font-extrabold text-slate-950">Recent Payrolls</h2>
              <div className="mt-5 space-y-3">
                {summary.recentPayrolls.length === 0 && <EmptyState label="No payroll records yet." />}
                {summary.recentPayrolls.map((payroll) => (
                  <div key={payroll._id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-soft p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-950">{payroll.employeeName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatPayrollPeriod(payroll.month, payroll.year)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-primary">{formatPeso(payroll.netPay)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="text-lg font-extrabold text-slate-950">Latest Employees</h2>
              <div className="mt-5 space-y-3">
                {summary.latestEmployees.length === 0 && <EmptyState label="No employees yet." />}
                {summary.latestEmployees.map((employee) => (
                  <div key={employee._id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-soft p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-950">{employee.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{employee.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal" />
              <h2 className="text-lg font-extrabold text-slate-950">Recent Activity</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {summary.recentActivity.length === 0 && <EmptyState label="No payroll activity yet." />}
              {summary.recentActivity.map((item) => (
                <div key={item._id} className="rounded-lg border border-slate-100 bg-soft p-4">
                  <p className="text-sm font-semibold text-slate-700">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">{label}</p>;
}
