import Activity from "../models/Activity.js";
import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";

const createActivity = (message, entityId) =>
  Activity.create({ message, type: "payroll", entityId }).catch(() => null);

const toNumber = (value, fallback = 0) => Number(value ?? fallback) || 0;

const calculatePayroll = (body) => {
  const dailyRate = toNumber(body.dailyRate);
  const daysWorked = toNumber(body.daysWorked);
  const otHours = toNumber(body.otHours);
  const otMultiplier = toNumber(body.otMultiplier, 1.25);
  const allowance = toNumber(body.allowance);
  const bonus = toNumber(body.bonus);
  const cashAdvance = toNumber(body.cashAdvance);
  const otherDeductions = toNumber(body.otherDeductions);
  const hourlyRate = dailyRate / 8;
  const otPay = hourlyRate * otHours * otMultiplier;
  const grossPay = daysWorked * dailyRate + otPay + allowance + bonus;
  const netPay = grossPay - cashAdvance - otherDeductions;

  return {
    daysWorked,
    dailyRate,
    hourlyRate,
    otHours,
    otMultiplier,
    otPay,
    allowance,
    bonus,
    cashAdvance,
    otherDeductions,
    grossPay,
    netPay
  };
};

const normalizePayrollPayload = async (body, accountName) => {
  const employee = await Employee.findById(body.employeeId);

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  if (employee.status !== "Active") {
    const error = new Error("Payroll can only be generated for active employees");
    error.statusCode = 400;
    throw error;
  }

  const computed = calculatePayroll({
    ...body,
    dailyRate: body.dailyRate ?? employee.dailyRate
  });

  return {
    employeeId: employee._id,
    employeeName: employee.fullName,
    position: employee.position,
    month: Number(body.month),
    year: Number(body.year),
    ...computed,
    remarks: String(body.remarks || "").trim(),
    createdBy: String(body.createdBy || accountName || "SUPERADMIN").trim()
  };
};

const buildPayrollQuery = ({ search = "", month = "", year = "" }) => {
  const query = {};

  if (search) {
    query.$or = [
      { employeeName: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
      { createdBy: { $regex: search, $options: "i" } },
      { remarks: { $regex: search, $options: "i" } }
    ];
  }

  if (month) {
    query.month = Number(month);
  }

  if (year) {
    query.year = Number(year);
  }

  return query;
};

export const getPayrolls = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const sortField = ["employeeName", "grossPay", "netPay", "createdAt"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const query = buildPayrollQuery(req.query);
    const [payrolls, total] = await Promise.all([
      Payroll.find(query)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Payroll.countDocuments(query)
    ]);

    res.json({ data: payrolls, page, limit, total, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    next(error);
  }
};

export const getPayrollById = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      res.status(404);
      throw new Error("Payroll record not found");
    }

    res.json(payroll);
  } catch (error) {
    next(error);
  }
};

export const createPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.create(
      await normalizePayrollPayload(req.body, req.header("x-account-name"))
    );
    await createActivity(`Generated payroll for ${payroll.employeeName}`, payroll._id);
    res.status(201).json(payroll);
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updatePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      res.status(404);
      throw new Error("Payroll record not found");
    }

    const payload = await normalizePayrollPayload(
      { ...payroll.toObject(), ...req.body },
      req.header("x-account-name")
    );
    Object.assign(payroll, payload);
    const updatedPayroll = await payroll.save();
    await createActivity(`Updated payroll for ${updatedPayroll.employeeName}`, updatedPayroll._id);
    res.json(updatedPayroll);
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const deletePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      res.status(404);
      throw new Error("Payroll record not found");
    }

    await payroll.deleteOne();
    await createActivity(`Deleted payroll for ${payroll.employeeName}`, payroll._id);
    res.json({ message: "Payroll record deleted" });
  } catch (error) {
    next(error);
  }
};

export const getPayrollDashboard = async (_req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const currentMonthQuery = { month, year };
    const [
      totalEmployees,
      payrollRecords,
      currentMonthPayrolls,
      recentPayrolls,
      latestEmployees,
      recentActivity
    ] = await Promise.all([
      Employee.countDocuments(),
      Payroll.countDocuments(),
      Payroll.find(currentMonthQuery),
      Payroll.find().sort({ createdAt: -1 }).limit(5),
      Employee.find().sort({ createdAt: -1 }).limit(5),
      Activity.find({ type: { $in: ["employee", "payroll"] } }).sort({ createdAt: -1 }).limit(6)
    ]);

    res.json({
      totalEmployees,
      payrollRecords,
      currentMonthExpense: currentMonthPayrolls.reduce((sum, payroll) => sum + payroll.netPay, 0),
      recentPayrolls,
      latestEmployees,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};
