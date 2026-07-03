import express from "express";
import {
  createPayroll,
  deletePayroll,
  getPayrollById,
  getPayrollDashboard,
  getPayrolls,
  updatePayroll
} from "../controllers/payrollController.js";
import { requireSuperAdmin } from "../middleware/payrollAuth.js";

const router = express.Router();

router.use(requireSuperAdmin);
router.get("/dashboard", getPayrollDashboard);
router.route("/").get(getPayrolls).post(createPayroll);
router.route("/:id").get(getPayrollById).put(updatePayroll).delete(deletePayroll);

export default router;
