import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import EmployeeModal from "../../components/payroll/EmployeeModal.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { employeesApi } from "../../services/api.js";
import { getId } from "../../utils/format.js";
import { formatPeso } from "../../utils/payroll.js";

export default function PayrollEmployees() {
  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const params = useMemo(() => ({ search, status, page: meta.page, limit: 10 }), [meta.page, search, status]);

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const result = await employeesApi.list(params);
        setEmployees(result.data);
        setMeta({ page: result.page, pages: result.pages, total: result.total });
        setError("");
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load employees.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [params]);

  const saveEmployee = async (payload) => {
    setSaving(true);
    try {
      if (editingEmployee && Object.keys(editingEmployee).length) {
        const updated = await employeesApi.update(getId(editingEmployee), payload);
        setEmployees((current) => current.map((item) => (getId(item) === getId(updated) ? updated : item)));
        setMessage("Employee updated successfully.");
      } else {
        const created = await employeesApi.create(payload);
        setEmployees((current) => [created, ...current]);
        setMeta((current) => ({ ...current, total: current.total + 1 }));
        setMessage("Employee added successfully.");
      }
      setEditingEmployee(null);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (employee) => {
    if (!window.confirm(`Delete ${employee.fullName}? This cannot be undone.`)) return;

    try {
      await employeesApi.remove(getId(employee));
      setEmployees((current) => current.filter((item) => getId(item) !== getId(employee)));
      setMeta((current) => ({ ...current, total: Math.max(current.total - 1, 0) }));
      setMessage("Employee deleted successfully.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete employee.");
    }
  };

  const changePage = (nextPage) => {
    setMeta((current) => ({ ...current, page: Math.min(Math.max(nextPage, 1), current.pages) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Payroll</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Employees</h1>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEditingEmployee({})}>
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {(message || error) && (
        <div className={`rounded-md px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {error || message}
        </div>
      )}

      <section className="card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setMeta((current) => ({ ...current, page: 1 }));
              }}
              placeholder="Search employees"
            />
          </label>
          <select
            className="input"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setMeta((current) => ({ ...current, page: 1 }));
            }}
          >
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </section>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-5">
            <LoadingSpinner label="Loading employees..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Employee", "Position", "Daily Rate", "Status", "Notes", "Actions"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                      No employees found.
                    </td>
                  </tr>
                )}
                {employees.map((employee) => (
                  <tr key={getId(employee)} className="hover:bg-slate-50">
                    <td className="min-w-56 px-4 py-4">
                      <p className="text-sm font-bold text-slate-950">{employee.fullName}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{employee.position}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-700">{formatPeso(employee.dailyRate)}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${employee.status === "Active" ? "bg-teal/10 text-teal" : "bg-slate-100 text-slate-600"}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-sm text-slate-600">
                      <span className="line-clamp-2">{employee.notes || "-"}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex gap-2">
                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-teal hover:text-primary" onClick={() => setEditingEmployee(employee)} aria-label={`Edit ${employee.fullName}`}>
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:border-red-200 hover:text-red-600" onClick={() => deleteEmployee(employee)} aria-label={`Delete ${employee.fullName}`}>
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

      {editingEmployee && (
        <EmployeeModal
          employee={Object.keys(editingEmployee).length ? editingEmployee : null}
          onClose={() => setEditingEmployee(null)}
          onSave={saveEmployee}
          saving={saving}
        />
      )}
    </div>
  );
}

function Pagination({ meta, onChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-500">{meta.total} employee records</p>
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
