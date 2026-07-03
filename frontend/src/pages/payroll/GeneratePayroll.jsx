import { useEffect, useMemo, useState } from "react";
import { Calculator, Save } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import PayslipModal from "../../components/payroll/PayslipModal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { employeesApi, payrollApi } from "../../services/api.js";
import { calculatePayroll, formatPeso, monthOptions } from "../../utils/payroll.js";

const currentDate = new Date();

const emptyForm = {
  employeeId: "",
  month: currentDate.getMonth() + 1,
  year: currentDate.getFullYear(),
  daysWorked: 0,
  dailyRate: 0,
  otHours: 0,
  otMultiplier: 1.25,
  allowance: 0,
  bonus: 0,
  cashAdvance: 0,
  otherDeductions: 0,
  remarks: ""
};

export default function GeneratePayroll() {
  const { account } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createdPayroll, setCreatedPayroll] = useState(null);

  const selectedEmployee = employees.find((employee) => employee._id === form.employeeId);
  const totals = useMemo(() => calculatePayroll(form), [form]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const result = await employeesApi.list({ status: "Active", limit: 100 });
        setEmployees(result.data);
        if (result.data[0]) {
          setForm((current) => ({
            ...current,
            employeeId: result.data[0]._id,
            dailyRate: result.data[0].dailyRate
          }));
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load active employees.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateEmployee = (employeeId) => {
    const employee = employees.find((item) => item._id === employeeId);
    setForm((current) => ({
      ...current,
      employeeId,
      dailyRate: employee?.dailyRate ?? current.dailyRate
    }));
  };

  const validateForm = () => {
    if (!form.employeeId) return "Employee is required.";
    if (Number(form.year) < 2000) return "Payroll year is invalid.";

    const numberFields = [
      ["Days worked", form.daysWorked],
      ["Daily rate", form.dailyRate],
      ["OT hours", form.otHours],
      ["OT multiplier", form.otMultiplier],
      ["Allowance", form.allowance],
      ["Bonus", form.bonus],
      ["Cash advance", form.cashAdvance],
      ["Other deductions", form.otherDeductions]
    ];

    const invalidField = numberFields.find(([, value]) => Number(value) < 0);
    return invalidField ? `${invalidField[0]} cannot be negative.` : "";
  };

  const submitPayroll = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const created = await payrollApi.create({
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        daysWorked: Number(form.daysWorked),
        dailyRate: Number(form.dailyRate),
        otHours: Number(form.otHours),
        otMultiplier: Number(form.otMultiplier),
        allowance: Number(form.allowance),
        bonus: Number(form.bonus),
        cashAdvance: Number(form.cashAdvance),
        otherDeductions: Number(form.otherDeductions),
        createdBy: account.name
      });
      setCreatedPayroll(created);
      setMessage("Payroll generated successfully.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to generate payroll.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading payroll form..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Payroll</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Generate Payroll</h1>
      </div>

      {(message || error) && (
        <div className={`rounded-md px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {error || message}
        </div>
      )}

      {employees.length === 0 ? (
        <section className="card p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">Add an active employee before generating payroll.</p>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <form onSubmit={submitPayroll} className="card p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="label">Employee</span>
                <select className="input" value={form.employeeId} onChange={(event) => updateEmployee(event.target.value)}>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.fullName} - {employee.position}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="label">Payroll Month</span>
                <select className="input" value={form.month} onChange={(event) => updateField("month", event.target.value)}>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
              <NumberField label="Payroll Year" value={form.year} onChange={(value) => updateField("year", value)} min="2000" />
              <NumberField label="Days Worked" value={form.daysWorked} onChange={(value) => updateField("daysWorked", value)} />
              <NumberField label="Daily Rate" value={form.dailyRate} onChange={(value) => updateField("dailyRate", value)} />
              <NumberField label="OT Hours" value={form.otHours} onChange={(value) => updateField("otHours", value)} />
              <NumberField label="OT Multiplier" value={form.otMultiplier} onChange={(value) => updateField("otMultiplier", value)} step="0.01" />
              <NumberField label="Allowance" value={form.allowance} onChange={(value) => updateField("allowance", value)} />
              <NumberField label="Bonus" value={form.bonus} onChange={(value) => updateField("bonus", value)} />
              <NumberField label="Cash Advance" value={form.cashAdvance} onChange={(value) => updateField("cashAdvance", value)} />
              <NumberField label="Other Deductions" value={form.otherDeductions} onChange={(value) => updateField("otherDeductions", value)} />
              <label className="space-y-1.5 md:col-span-2">
                <span className="label">Remarks</span>
                <textarea className="input min-h-24 resize-y" value={form.remarks} onChange={(event) => updateField("remarks", event.target.value)} />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Generating..." : "Generate Payroll"}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <section className="card p-5">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-teal" />
                <h2 className="text-lg font-extrabold text-slate-950">Live Computation</h2>
              </div>
              <div className="mt-5 space-y-3">
                <AmountRow label="Hourly Rate" value={formatPeso(totals.hourlyRate)} />
                <AmountRow label="OT Pay" value={formatPeso(totals.otPay)} />
                <AmountRow label="Gross Pay" value={formatPeso(totals.grossPay)} />
                <div className="rounded-lg bg-primary p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/70">Net Pay</p>
                  <p className="mt-1 text-3xl font-extrabold">{formatPeso(totals.netPay)}</p>
                </div>
              </div>
            </section>
            <section className="card p-5">
              <p className="text-sm font-extrabold text-slate-950">{selectedEmployee?.fullName || "No employee selected"}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedEmployee?.position || "-"}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">Prepared by {account.name}</p>
            </section>
          </aside>
        </div>
      )}

      {createdPayroll && <PayslipModal payroll={createdPayroll} onClose={() => setCreatedPayroll(null)} />}
    </div>
  );
}

function NumberField({ label, value, onChange, min = "0", step = "0.01" }) {
  return (
    <label className="space-y-1.5">
      <span className="label">{label}</span>
      <input className="input" min={min} step={step} type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AmountRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-extrabold text-slate-950">{value}</span>
    </div>
  );
}
