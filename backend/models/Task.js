import mongoose from "mongoose";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "../config/taskConfig.js";

const taskSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: TASK_TYPES,
      default: "Install"
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "Pending"
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "Medium"
    },
    assigneeId: {
      type: String,
      required: true,
      trim: true
    },
    assigneeName: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    lastResetAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
