import express from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee
} from "../controllers/employeeController.js";
import { requireSuperAdmin } from "../middleware/payrollAuth.js";

const router = express.Router();

router.use(requireSuperAdmin);
router.route("/").get(getEmployees).post(createEmployee);
router.route("/:id").put(updateEmployee).delete(deleteEmployee);

export default router;
