import Activity from "../models/Activity.js";
import Employee from "../models/Employee.js";

const createActivity = (message, entityId) =>
  Activity.create({ message, type: "employee", entityId }).catch(() => null);

const normalizeEmployeePayload = (body) => ({
  fullName: String(body.fullName || "").trim(),
  position: String(body.position || "").trim(),
  dailyRate: Number(body.dailyRate ?? 0),
  status: body.status === "Inactive" ? "Inactive" : "Active",
  notes: String(body.notes || "").trim()
});

const buildEmployeeQuery = ({ search = "", status = "" }) => {
  const query = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
      { notes: { $regex: search, $options: "i" } }
    ];
  }

  if (["Active", "Inactive"].includes(status)) {
    query.status = status;
  }

  return query;
};

export const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
    const query = buildEmployeeQuery(req.query);
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(query)
    ]);

    res.json({ data: employees, page, limit, total, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.create(normalizeEmployeePayload(req.body));
    await createActivity(`Added employee ${employee.fullName}`, employee._id);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    Object.assign(employee, normalizeEmployeePayload({ ...employee.toObject(), ...req.body }));
    const updatedEmployee = await employee.save();
    await createActivity(`Updated employee ${updatedEmployee.fullName}`, updatedEmployee._id);
    res.json(updatedEmployee);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    await employee.deleteOne();
    await createActivity(`Deleted employee ${employee.fullName}`, employee._id);
    res.json({ message: "Employee deleted" });
  } catch (error) {
    next(error);
  }
};
