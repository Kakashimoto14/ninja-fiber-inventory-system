export const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

export const getMonthName = (month) =>
  monthOptions.find((item) => item.value === Number(month))?.label || "Unknown";

export const formatPeso = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits
  }).format(Number(value || 0));

export const formatPayrollPeriod = (month, year) => `${getMonthName(month)} ${year}`;

export const calculatePayroll = (form) => {
  const dailyRate = Number(form.dailyRate || 0);
  const daysWorked = Number(form.daysWorked || 0);
  const otHours = Number(form.otHours || 0);
  const otMultiplier = Number(form.otMultiplier || 0);
  const allowance = Number(form.allowance || 0);
  const bonus = Number(form.bonus || 0);
  const cashAdvance = Number(form.cashAdvance || 0);
  const otherDeductions = Number(form.otherDeductions || 0);
  const hourlyRate = dailyRate / 8;
  const otPay = hourlyRate * otHours * otMultiplier;
  const grossPay = daysWorked * dailyRate + otPay + allowance + bonus;
  const netPay = grossPay - cashAdvance - otherDeductions;

  return {
    hourlyRate,
    otPay,
    grossPay,
    netPay
  };
};
