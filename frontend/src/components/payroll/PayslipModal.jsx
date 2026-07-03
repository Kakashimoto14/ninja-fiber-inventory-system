import { Printer, X } from "lucide-react";
import { formatDate } from "../../utils/format.js";
import { formatPayrollPeriod, formatPeso } from "../../utils/payroll.js";

export default function PayslipModal({ payroll, onClose }) {
  const printPayslip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-4 py-4 sm:items-center">
      <div className="no-print flex max-h-[92vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Payroll Slip</h2>
            <p className="text-sm text-slate-500">{payroll.employeeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-primary px-3 py-2" onClick={printPayslip}>
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close payslip"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto bg-soft p-4">
          <Payslip payroll={payroll} />
        </div>
      </div>
      <div className="hidden print:block">
        <Payslip payroll={payroll} />
      </div>
    </div>
  );
}

function Payslip({ payroll }) {
  const earnings = [
    ["Basic Pay", formatPeso(payroll.daysWorked * payroll.dailyRate)],
    ["OT Pay", formatPeso(payroll.otPay)],
    ["Allowance", formatPeso(payroll.allowance)],
    ["Bonus", formatPeso(payroll.bonus)]
  ];
  const deductions = [
    ["Cash Advance", formatPeso(payroll.cashAdvance)],
    ["Other Deductions", formatPeso(payroll.otherDeductions)]
  ];

  return (
    <article className="printable-payslip mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-8 text-slate-950 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src="/assets/ninja-fiber-logo.png" alt="Ninja Fiber logo" className="h-20 w-20 rounded-md object-contain" />
          <div>
            <p className="text-2xl font-extrabold">Ninja Fiber</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Payroll Slip</p>
            <p className="mt-1 text-xs text-slate-500">Fast. Reliable. Connected.</p>
          </div>
        </div>
        <div className="rounded-lg bg-soft p-4 text-left sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payroll Period</p>
          <p className="mt-1 text-lg font-extrabold">{formatPayrollPeriod(payroll.month, payroll.year)}</p>
          <p className="mt-1 text-xs text-slate-500">Created {formatDate(payroll.createdAt)}</p>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label="Employee Name" value={payroll.employeeName} />
        <Info label="Position" value={payroll.position || "-"} />
        <Info label="Days Worked" value={payroll.daysWorked} />
        <Info label="Daily Rate" value={formatPeso(payroll.dailyRate)} />
        <Info label="OT Hours" value={payroll.otHours} />
        <Info label="Hourly Rate" value={formatPeso(payroll.hourlyRate)} />
      </section>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <PayTable title="Earnings" rows={earnings} totalLabel="Gross Pay" total={formatPeso(payroll.grossPay)} />
        <PayTable title="Deductions" rows={deductions} totalLabel="Net Pay" total={formatPeso(payroll.netPay)} highlight />
      </section>

      {payroll.remarks && (
        <section className="mt-6 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Remarks</p>
          <p className="mt-2 text-sm text-slate-700">{payroll.remarks}</p>
        </section>
      )}

      <section className="mt-10 grid gap-8 sm:grid-cols-3">
        <Signature label="Prepared By" name={payroll.createdBy} />
        <Signature label="Employee Signature" />
        <Signature label="Employer Signature" />
      </section>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function PayTable({ title, rows, totalLabel, total, highlight }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="bg-slate-50 px-4 py-3 text-sm font-extrabold">{title}</div>
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-slate-600">{label}</span>
            <span className="font-bold text-slate-950">{value}</span>
          </div>
        ))}
      </div>
      <div className={`flex items-center justify-between px-4 py-4 text-base font-extrabold ${highlight ? "bg-primary text-white" : "bg-soft text-slate-950"}`}>
        <span>{totalLabel}</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

function Signature({ label, name }) {
  return (
    <div className="pt-8 text-center">
      <div className="border-t border-slate-400 pt-2">
        <p className="text-sm font-extrabold text-slate-950">{name || label}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </div>
  );
}
