import express from "express";
import { createTask, deleteTask, getTasks, resetTasks, updateTask } from "../controllers/taskController.js";

const router = express.Router();

router.route("/").get(getTasks).post(createTask);
router.post("/reset", resetTasks);
router.route("/:id").put(updateTask).delete(deleteTask);

export default router;
