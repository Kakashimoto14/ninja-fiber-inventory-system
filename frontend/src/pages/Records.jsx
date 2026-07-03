import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  X
} from "lucide-react";
import {
  importedExpenses,
  importedGcashRefs,
  importedInventoryRecords,
  importedPayments,
  importedSubscribers,
  importedSummary
} from "../data/mockData.js";

/* ─────────────────────────────────────────
   Dataset definitions
───────────────────────────────────────── */
const datasets = {
  Inventory: {
    rows: importedInventoryRecords,
    columns: [
      ["itemName", "Item"],
      ["category", "Category"],
      ["team", "Team"],
      ["distributed", "Distributed"],
      ["used", "Used"],
      ["defective", "Defective"],
      ["remainingStocks", "Remaining"],
      ["loss", "Loss"]
    ],
    dateField: null
  },
  Payments: {
    rows: importedPayments,
    columns: [
      ["subscriberName", "Subscriber"],
      ["accountId", "Account"],
      ["serviceType", "Service"],
      ["amount", "Amount"],
      ["paymentMethod", "Method"],
      ["date", "Date"]
    ],
    dateField: "date"
  },
  Expenses: {
    rows: importedExpenses,
    columns: [
      ["name", "Name"],
      ["amount", "Amount"],
      ["date", "Date"]
    ],
    dateField: "date"
  },
  Subscribers: {
    rows: importedSubscribers,
    columns: [
      ["accountNumber", "Account"],
      ["name", "Name"],
      ["dueDay", "Due Day"],
      ["amount", "Amount"]
    ],
    dateField: null
  },
  GCash: {
    rows: importedGcashRefs,
    columns: [
      ["accountNumber", "Account"],
      ["name", "Name"],
      ["month", "Month"],
      ["referenceNumber", "Reference Number"]
    ],
    dateField: "month"
  }
};

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const pageSize = 75;
const editsStorageKey = "nfi_records_edits";

const getRowId = (row, index) => row._id || `row-${index}`;

const formatValue = (value) => {
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return value ?? "";
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const toYMD = (dateValue) => {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue).slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getMonthDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leading = first.getDay();
  const days = [];
  for (let i = 0; i < leading; i++) days.push(addDays(first, i - leading));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(addDays(last, days.length - leading - last.getDate() + 1));
  return days;
};

const DAY_HEADS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/* ─────────────────────────────────────────
   Mini Records Calendar
───────────────────────────────────────── */
function RecordsCalendar({ rows, dateField, selectedDate, onSelect }) {
  const today = new Date();
  const todayYMD = toYMD(today);

  // Determine initial month from data or today
  const firstDataDate = useMemo(() => {
    if (!dateField) return today;
    const sorted = rows
      .map((r) => r[dateField])
      .filter(Boolean)
      .sort();
    return sorted.length ? new Date(sorted[0]) : today;
  }, [rows, dateField]);

  // Start calendar at the month that has the most recent data
  const latestDataDate = useMemo(() => {
    if (!dateField) return today;
    const sorted = rows
      .map((r) => r[dateField])
      .filter(Boolean)
      .sort();
    return sorted.length ? new Date(sorted[sorted.length - 1]) : today;
  }, [rows, dateField]);

  const [calYear, setCalYear] = useState(() => latestDataDate.getFullYear());
  const [calMonth, setCalMonth] = useState(() => latestDataDate.getMonth());

  // Build per-day count map
  const dayCountMap = useMemo(() => {
    if (!dateField) return {};
    return rows.reduce((acc, row) => {
      const ymd = toYMD(row[dateField]);
      if (ymd) acc[ymd] = (acc[ymd] || 0) + 1;
      return acc;
    }, {});
  }, [rows, dateField]);

  const days = useMemo(() => getMonthDays(calYear, calMonth), [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const maxCount = Math.max(...Object.values(dayCountMap), 1);

  if (!dateField) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
        This dataset has no date field — all records are shown.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal/10 text-teal">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-950">
              {MONTH_NAMES[calMonth]} {calYear}
            </p>
            <p className="text-xs text-slate-500">Click a date to filter records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); onSelect(todayYMD); }}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedDate === todayYMD
                ? "border-teal bg-teal/10 text-teal"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal hover:text-teal"
            }`}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:border-teal hover:text-teal transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:border-teal hover:text-teal transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAY_HEADS.map((d) => (
            <div key={d} className="py-0.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const ymd = toYMD(day);
            const count = dayCountMap[ymd] || 0;
            const isCurrentMonth = day.getMonth() === calMonth;
            const isSelected = ymd === selectedDate;
            const isToday = ymd === todayYMD;
            const hasData = count > 0 && isCurrentMonth;
            // Intensity from 0–1 based on relative count
            const intensity = hasData ? count / maxCount : 0;

            return (
              <button
                key={`${ymd}-${idx}`}
                type="button"
                disabled={!isCurrentMonth}
                onClick={() => isCurrentMonth && onSelect(isSelected ? null : ymd)}
                className={`relative flex flex-col items-center rounded-lg p-1.5 transition-all duration-150 ${
                  !isCurrentMonth
                    ? "cursor-default opacity-30"
                    : isSelected
                      ? "ring-2 ring-teal ring-offset-1 shadow-sm"
                      : "hover:ring-1 hover:ring-teal/40"
                }`}
                style={
                  isCurrentMonth && hasData && !isSelected
                    ? { backgroundColor: `rgba(13,148,136,${0.06 + intensity * 0.22})` }
                    : isSelected
                      ? { backgroundColor: "rgba(13,148,136,0.12)" }
                      : {}
                }
              >
                {/* Day number */}
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected
                      ? "bg-teal text-white"
                      : isToday
                        ? "bg-primary text-white"
                        : isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-300"
                  }`}
                >
                  {day.getDate()}
                </span>

                {/* Count badge */}
                {hasData && (
                  <span
                    className={`mt-0.5 text-[9px] font-bold leading-none ${
                      isSelected ? "text-teal" : "text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                )}

                {/* Activity dot */}
                {hasData && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-teal/60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-teal/40" /> Has records
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-5 w-5 rounded-full bg-primary text-[9px] font-bold text-white flex items-center justify-center">•</span>
          Today
        </span>
        {selectedDate && (
          <span className="ml-auto font-semibold text-teal">
            Filtered: {selectedDate}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Records Page
───────────────────────────────────────── */
export default function Records() {
  const [activeTab, setActiveTab] = useState("Payments");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const tableRef = useRef(null);
  const [edits, setEdits] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(editsStorageKey) || "{}");
    } catch {
      return {};
    }
  });

  const current = datasets[activeTab];

  const rowsWithEdits = useMemo(() => {
    return current.rows.map((row, index) => {
      const rowId = getRowId(row, index);
      return { ...row, ...(edits[activeTab]?.[rowId] || {}) };
    });
  }, [activeTab, current.rows, edits]);

  // Date filter (only for tabs with dateField)
  const dateFilteredRows = useMemo(() => {
    if (!current.dateField || !selectedDate) return rowsWithEdits;
    return rowsWithEdits.filter((row) => {
      const ymd = toYMD(row[current.dateField]);
      return ymd === selectedDate;
    });
  }, [rowsWithEdits, current.dateField, selectedDate]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return dateFilteredRows;
    return dateFilteredRows.filter((row) =>
      current.columns.some(([key]) => String(row[key] ?? "").toLowerCase().includes(term))
    );
  }, [current.columns, dateFilteredRows, search]);

  const totalPages = Math.max(Math.ceil(filteredRows.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Daily summary stats for selected date
  const dailyStats = useMemo(() => {
    if (!selectedDate) return null;
    const dayPayments = importedPayments.filter((r) => toYMD(r.date) === selectedDate);
    const dayExpenses = importedExpenses.filter((r) => toYMD(r.date) === selectedDate);
    const totalIncome = dayPayments.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalExpense = dayExpenses.reduce((s, r) => s + Number(r.amount || 0), 0);
    return { payments: dayPayments.length, expenses: dayExpenses.length, totalIncome, totalExpense };
  }, [selectedDate]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setPage(1);
    // Keep selectedDate when switching tabs if new tab has dateField, else clear
    if (!datasets[tab].dateField) setSelectedDate(null);
  };

  const handleDateSelect = (ymd) => {
    setSelectedDate(ymd);
    setPage(1);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const updateCell = (row, rowIndex, key, value) => {
    const rowId = getRowId(row, rowIndex);
    const nextEdits = {
      ...edits,
      [activeTab]: {
        ...(edits[activeTab] || {}),
        [rowId]: {
          ...(edits[activeTab]?.[rowId] || {}),
          [key]: value
        }
      }
    };
    setEdits(nextEdits);
    localStorage.setItem(editsStorageKey, JSON.stringify(nextEdits));
  };

  const exportRows = () => {
    const header = current.columns.map(([, label]) => label).join(",");
    const body = filteredRows
      .map((row) => current.columns.map(([key]) => csvEscape(row[key])).join(","))
      .join("\n");
    const csv = `${header}\n${body}`;
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${activeTab.toLowerCase()}-records.csv`);
  };

  const exportPdf = () => {
    const rows = filteredRows.slice(0, 500);
    const headers = current.columns.map(([, label]) => `<th>${label}</th>`).join("");
    const body = rows
      .map(
        (row) =>
          `<tr>${current.columns
            .map(([key]) => `<td>${String(row[key] ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</td>`)
            .join("")}</tr>`
      )
      .join("");
    const popup = window.open("", "_blank");
    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>${activeTab} Records${selectedDate ? ` — ${selectedDate}` : ""}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin: 0 0 4px; }
            p { color: #475569; margin: 0 0 16px; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; vertical-align: top; }
            th { background: #0C4E8A; color: white; }
          </style>
        </head>
        <body>
          <h1>${activeTab} Records${selectedDate ? ` — ${selectedDate}` : ""}</h1>
          <p>${rows.length} rows included. Use Save as PDF in the print dialog.</p>
          <table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>
          <script>window.onload = () => window.print();<\/script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal">Records</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Business Records</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-secondary" onClick={exportRows}>
            <FileSpreadsheet className="h-4 w-4" />
            Download Excel
          </button>
          <button type="button" className="btn-secondary" onClick={exportPdf}>
            <FileText className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Object.entries({
          Products: importedSummary.products,
          Tasks: importedSummary.tasks,
          Payments: importedSummary.payments,
          Subscribers: importedSummary.subscribers,
          GCash: importedSummary.gcashRefs
        }).map(([label, value]) => (
          <section key={label} className="card p-4">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-950">{Number(value || 0).toLocaleString()}</p>
          </section>
        ))}
      </div>

      {/* Daily calendar */}
      <RecordsCalendar
        rows={current.rows}
        dateField={current.dateField}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
      />

      {/* Daily snapshot bar (only when date selected & tab has date) */}
      {selectedDate && dailyStats && (
        <div
          className="grid gap-3 sm:grid-cols-4"
          style={{ animation: "fadeSlideIn 0.35s ease" }}
        >
          {[
            { label: "Payments today", value: dailyStats.payments, color: "text-primary" },
            {
              label: "Income today",
              value: `₱${dailyStats.totalIncome.toLocaleString()}`,
              color: "text-emerald-700"
            },
            { label: "Expenses today", value: dailyStats.expenses, color: "text-orange-700" },
            {
              label: "Total expenses",
              value: `₱${dailyStats.totalExpense.toLocaleString()}`,
              color: "text-red-600"
            }
          ].map((s) => (
            <section key={s.label} className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-xl font-extrabold ${s.color}`}>{s.value}</p>
            </section>
          ))}
        </div>
      )}

      {/* Data table */}
      <section ref={tableRef} className="card overflow-hidden" style={{ scrollMarginTop: "1.5rem" }}>
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.keys(datasets).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm font-bold ${
                    activeTab === tab ? "bg-primary text-white" : "bg-soft text-slate-600 hover:text-primary"
                  }`}
                  onClick={() => changeTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <input
              className="input lg:max-w-sm"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={`Search ${activeTab.toLowerCase()} records`}
            />
          </div>

          {/* Active filter pill */}
          {selectedDate && current.dateField && (
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                <CalendarDays className="h-3.5 w-3.5" />
                Showing records for {selectedDate}
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="ml-1 text-teal/60 hover:text-teal"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}

          <p className="mt-3 text-sm font-semibold text-slate-500">
            Showing {visibleRows.length} of {filteredRows.length.toLocaleString()} records
            {!selectedDate && current.dateField && " · Click a calendar date to filter by day"}
            {". Cells are editable."}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {current.columns.map(([, label]) => (
                  <th key={label} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={current.columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                    {selectedDate
                      ? `No records found for ${selectedDate}. Try a different date or clear the filter.`
                      : "No records match your search."}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, index) => {
                  const absoluteIndex = (safePage - 1) * pageSize + index;
                  return (
                    <tr key={getRowId(row, absoluteIndex)} className="hover:bg-slate-50 transition-colors">
                      {current.columns.map(([key]) => (
                        <td key={key} className="min-w-36 max-w-sm px-2 py-2 text-sm text-slate-700">
                          <input
                            className="w-full rounded border border-transparent bg-transparent px-2 py-1 outline-none focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/20"
                            value={formatValue(row[key])}
                            onChange={(event) => updateCell(row, absoluteIndex, key, event.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={safePage === 1}
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={safePage === totalPages}
              onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
