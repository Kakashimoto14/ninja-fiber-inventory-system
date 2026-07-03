import Employee from "../../../models/Employee.js";
import Payroll from "../../../models/Payroll.js";
import { aiConfig } from "../config/aiConfig.js";
import { getOrSetCachedValue } from "../utils/cache.js";
import { createTool } from "./ToolDefinition.js";
import {
  requireSuperAdminToolAccess,
  escapeRegex,
  sanitizeText,
  toMonth,
  toPositiveInteger,
  toYear
} from "./toolValidation.js";

const serializePayroll = (payroll) => ({
  id: String(payroll._id),
  employeeName: payroll.employeeName,
  position: payroll.position,
  month: payroll.month,
  year: payroll.year,
  grossPay: payroll.grossPay,
  netPay: payroll.netPay,
  daysWorked: payroll.daysWorked,
  otPay: payroll.otPay,
  allowance: payroll.allowance,
  bonus: payroll.bonus,
  cashAdvance: payroll.cashAdvance,
  otherDeductions: payroll.otherDeductions,
  createdBy: payroll.createdBy,
  createdAt: payroll.createdAt
});

const payrollDateQuery = ({ month, year }) => {
  const query = {};
  const parsedMonth = toMonth(month);
  const parsedYear = toYear(year);

  if (parsedMonth) query.month = parsedMonth;
  if (parsedYear) query.year = parsedYear;

  return query;
};

export const getPayrollTools = () => [
  createTool({
    name: "payrollSummary",
    label: "Analyzing Payroll",
    category: "payroll",
    description: "Summarize payroll records, net pay, gross pay, and employee totals.",
    parameters: {
      month: { type: "number", required: false },
      year: { type: "number", required: false }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const query = payrollDateQuery(params);
      const cacheKey = `ai:payrollSummary:${query.month || "all"}:${query.year || "all"}`;

      const { value } = await getOrSetCachedValue(cacheKey, aiConfig.summaryCacheTtlMs, async () => {
        const [records, employeeCount, activeEmployees] = await Promise.all([
          Payroll.find(query).sort({ createdAt: -1 }).lean(),
          Employee.countDocuments(),
          Employee.countDocuments({ status: "Active" })
        ]);

        return {
          filter: query,
          payrollRecords: records.length,
          employeeCount,
          activeEmployees,
          totalGrossPay: records.reduce((sum, payroll) => sum + payroll.grossPay, 0),
          totalNetPay: records.reduce((sum, payroll) => sum + payroll.netPay, 0),
          totalDeductions: records.reduce(
            (sum, payroll) => sum + payroll.cashAdvance + payroll.otherDeductions,
            0
          ),
          recentPayrolls: records.slice(0, 5).map(serializePayroll)
        };
      });

      return value;
    }
  }),

  createTool({
    name: "payrollHistory",
    label: "Reading Payroll History",
    category: "payroll",
    description: "List recent payroll records, optionally filtered by month and year.",
    parameters: {
      month: { type: "number", required: false },
      year: { type: "number", required: false },
      limit: { type: "number", default: 10 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const limit = toPositiveInteger(params.limit, 10, 50);
      const records = await Payroll.find(payrollDateQuery(params))
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return {
        count: records.length,
        payrolls: records.map(serializePayroll)
      };
    }
  }),

  createTool({
    name: "employeePayroll",
    label: "Reading Employee Payroll",
    category: "payroll",
    description: "Find payroll records for an employee by name.",
    parameters: {
      employeeName: { type: "string", required: true },
      limit: { type: "number", default: 8 }
    },
    execute: async (params, context) => {
      requireSuperAdminToolAccess(context);
      const employeeName = sanitizeText(params.employeeName, 80);
      const limit = toPositiveInteger(params.limit, 8, 25);

      if (!employeeName) {
        return { employeeName, payrolls: [], note: "No employee name provided." };
      }

      const [employee, payrolls] = await Promise.all([
        Employee.findOne({ fullName: { $regex: escapeRegex(employeeName), $options: "i" } }).lean(),
        Payroll.find({ employeeName: { $regex: escapeRegex(employeeName), $options: "i" } })
          .sort({ year: -1, month: -1, createdAt: -1 })
          .limit(limit)
          .lean()
      ]);

      return {
        employee: employee
          ? {
              id: String(employee._id),
              fullName: employee.fullName,
              position: employee.position,
              status: employee.status,
              dailyRate: employee.dailyRate
            }
          : null,
        count: payrolls.length,
        payrolls: payrolls.map(serializePayroll),
        note: payrolls.length ? "" : "No payroll records found for this employee search."
      };
    }
  })
];
