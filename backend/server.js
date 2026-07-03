import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import productRoutes from "./routes/productRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import aiRoutes from "./modules/ai/routes/aiRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { scheduleDailyTaskReset } from "./services/dailyReset.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "";

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Ninja Fiber Inventory API" });
});

app.use("/api/products", productRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
    scheduleDailyTaskReset();
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
