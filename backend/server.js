import express from "express";
import cors from "cors";
import "dotenv/config";
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
import { env, isProduction } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { scheduleDailyTaskReset } from "./services/dailyReset.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));

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
    await mongoose.connect(env.mongodbUri);
    console.log("MongoDB connected");
    scheduleDailyTaskReset();
    app.listen(env.port, () => {
      console.log(`API running on port ${env.port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
