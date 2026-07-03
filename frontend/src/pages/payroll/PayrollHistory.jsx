import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Printer, Search, Trash2 } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PayslipModal from "../../components/payroll/PayslipModal.jsx";
import { payrollApi } from "../../services/api.js";
import { formatDate, getId } from "../../utils/format.js";
import { formatPayrollPeriod, formatPeso } from "../../utils/payroll.js";

export default function PayrollHistory() {
  const [payrolls, setPayrolls] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const params = useMemo(
    () => ({ search, sortBy, sortOrder, page: meta.page, limit: 10 }),
    [meta.page, search, sortBy, sortOrder]
  );

  useEffect(() => {
    const loadPayrolls = async () => {
      setLoading(true);
      try {
        const result = await payrollApi.list(params);
        setPayrolls(result.data);
        setMeta({ page: result.page, pages: result.pages, total: result.total });
        setError("");
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load payroll history.");
      } finally {
        setLoading(false);
      }
    };

    loadPayrolls();
  }, [params]);

  const deletePayroll = async (payroll) => {
    if (!window.confirm(`Delete payroll for ${payroll.employeeName}? This cannot be undone.`)) return;

    try {
      await payrollApi.remove(getId(payroll));
      setPayrolls((current) => current.filter((item) => getId(item) !== getId(payroll)));
      setMeta((current) => ({ ...current, total: Math.max(current.total - 1, 0) }));
      setMessage("Payroll record deleted successfully.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete payroll record.");
    }
  };

  const viewPayroll = async (payroll, shouldPrint = false) => {
    try {
      const data = await payrollApi.get(getId(payroll));
      setSelectedPayroll(data);
      if (shouldPrint) {
        window.setTimeout(() => window.print(), 150);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to open payroll record.");
    }
  };

  const changeSort = (field) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setMeta((current) => ({ ...current, page: 1 }));
  };

  const changePage = (nextPage) => {
    setMeta((current) => ({ ...current, page: Math.min(Math.max(nextPage, 1), current.pages) }));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Payroll</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Payroll History</h1>
      </div>

      {(message || error) && (
        <div className={`rounded-md px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {error || message}
        </div>
      )}

      <section className="card p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setMeta((current) => ({ ...current, page: 1 }));
            }}
            placeholder="Search by employee, prepared by, or remarks"
          />
        </label>
      </section>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-5">
            <LoadingSpinner label="Loading payroll history..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <Sortable heading="Employee" field="employeeName" sortBy={sortBy} sortOrder={sortOrder} onClick={changeSort} />
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Payroll Period</th>
                  <Sortable heading="Gross Pay" field="grossPay" sortBy={sortBy} sortOrder={sortOrder} onClick={changeSort} />
                  <Sortable heading="Net Pay" field="netPay" sortBy={sortBy} sortOrder={sortOrder} onClick={changeSort} />
                  <Sortable heading="Created Date" field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onClick={changeSort} />
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Created By</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                      No payroll records found.
                    </td>
                  </tr>
                )}
                {payrolls.map((payroll) => (
                  <tr key={getId(payroll)} className="hover:bg-slate-50">
                    <td className="min-w-56 px-4 py-4">
                      <p className="text-sm font-bold text-slate-950">{payroll.employeeName}</p>
                      <p className="mt-1 text-xs text-slate-500">{payroll.position || "-"}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatPayrollPeriod(payroll.month, payroll.year)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-700">{formatPeso(payroll.grossPay)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-extrabold text-primary">{formatPeso(payroll.netPay)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(payroll.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{payroll.createdBy}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex gap-2">
                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-teal hover:text-primary" onClick={() => viewPayroll(payroll)} aria-label={`View payroll for ${payroll.employeeName}`}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-teal hover:text-primary" onClick={() => viewPayroll(payroll, true)} aria-label={`Print payroll for ${payroll.employeeName}`}>
                          <Printer className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:text-red-600" onClick={() => deletePayroll(payroll)} aria-label={`Delete payroll for ${payroll.employeeName}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination meta={meta} onChange={changePage} />

      {selectedPayroll && <PayslipModal payroll={selectedPayroll} onClose={() => setSelectedPayroll(null)} />}
    </div>
  );
}

function Sortable({ heading, field, sortBy, sortOrder, onClick }) {
  const active = sortBy === field;
  const Icon = active ? (sortOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      <button type="button" className="flex items-center gap-1 hover:text-slate-950" onClick={() => onClick(field)}>
        {heading}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </th>
  );
}

function Pagination({ meta, onChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-500">{meta.total} payroll records</p>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary px-3 py-2" disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)}>
          Previous
        </button>
        <span className="text-sm font-bold text-slate-700">
          Page {meta.page} of {meta.pages}
        </span>
        <button type="button" className="btn-secondary px-3 py-2" disabled={meta.page >= meta.pages} onClick={() => onChange(meta.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
