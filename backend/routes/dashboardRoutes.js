import express from "express";
import { getActivity, getStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getStats);
router.get("/activity", getActivity);

export default router;

