import "dotenv/config";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Task from "../models/Task.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import { env } from "../config/env.js";

const products = [
  {
    name: "Fiber Optic Cable 1 Core",
    sku: "NFI-CBL-001",
    category: "Fiber Cables",
    supplier: "CoreLink Supplies",
    quantity: 240,
    reorderPoint: 80
  },
  {
    name: "ONU Router X1200",
    sku: "NFI-ONU-1200",
    category: "Network Devices",
    supplier: "SignalPro",
    quantity: 34,
    reorderPoint: 40
  },
  {
    name: "Patch Cord SC/APC",
    sku: "NFI-PCH-044",
    category: "Accessories",
    supplier: "FiberMate",
    quantity: 420,
    reorderPoint: 100
  },
  {
    name: "Splitter 1x8 PLC",
    sku: "NFI-SPL-108",
    category: "Splitters",
    supplier: "CoreLink Supplies",
    quantity: 18,
    reorderPoint: 25
  }
];

const tasks = [
  {
    type: "Install",
    title: "Install ONU routers for new customers",
    description: "Confirm incoming delivery ETA with supplier.",
    status: "In Progress",
    priority: "High",
    assigneeId: "rhea",
    assigneeName: "RHEA",
    date: new Date(),
    dueDate: new Date(Date.now() + 86400000 * 2),
    notes: "Supplier said dispatch is pending warehouse confirmation."
  },
  {
    type: "Reactivate",
    title: "Reactivate dormant subscriber accounts",
    description: "Verify payment confirmation before reactivation.",
    status: "Pending",
    priority: "Medium",
    assigneeId: "jules",
    assigneeName: "JULES",
    date: new Date(),
    dueDate: new Date(Date.now() + 86400000 * 5),
    notes: "Coordinate with billing before changing service status."
  },
  {
    type: "Repairs",
    title: "Repair field issue at Zone 4",
    description: "Diagnose intermittent fiber signal loss.",
    status: "Completed",
    priority: "Urgent",
    assigneeId: "jun",
    assigneeName: "JUN",
    date: new Date(),
    completedAt: new Date(),
    notes: "Line repaired and customer confirmed service restoration."
  }
];

const users = [
  { id: "rhea", name: "RHEA", role: "admin", password: "1234" },
  { id: "jules", name: "JULES", role: "admin", password: "1234" },
  { id: "jun", name: "JUN", role: "admin", password: "1234" },
  { id: "superadmin", name: "SUPERADMIN", role: "superadmin", password: "1234" }
];

const loadImportedExcelSeed = async () => {
  try {
    const importPath = new URL("../../frontend/src/data/importedExcelData.json", import.meta.url);
    const importedData = JSON.parse(await fs.readFile(importPath, "utf8"));
    const importedProducts = (importedData.products || []).map((product) => ({
      name: product.name,
      sku: product.sku,
      category: product.category || "Imported",
      supplier: product.supplier || "Imported Excel",
      quantity: Number(product.quantity || 0),
      reorderPoint: Number(product.reorderPoint || 0)
    }));
    const importedTasks = (importedData.tasks || []).map((task) => ({
      type: task.type,
      title: task.title,
      description: task.description || "",
      status: task.status || "Pending",
      priority: task.priority || "Medium",
      assigneeId: task.assigneeId || "rhea",
      assigneeName: task.assigneeName || "RHEA",
      date: task.date ? new Date(task.date) : new Date(),
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      notes: task.notes || ""
    }));

    return {
      products: importedProducts.length ? importedProducts : products,
      tasks: importedTasks.length ? importedTasks : tasks
    };
  } catch {
    return { products, tasks };
  }
};

const seed = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    await Promise.all([Product.deleteMany(), Task.deleteMany(), Activity.deleteMany(), User.deleteMany()]);

    const seedData = await loadImportedExcelSeed();
    const createdProducts = await Product.insertMany(seedData.products);
    const createdTasks = await Task.insertMany(seedData.tasks);
    await User.insertMany(users);

    await Activity.insertMany([
      { message: `Added product ${createdProducts[0].name}`, type: "product", entityId: createdProducts[0]._id },
      { message: `Added product ${createdProducts[1].name}`, type: "product", entityId: createdProducts[1]._id },
      { message: `Created task "${createdTasks[0].title}"`, type: "task", entityId: createdTasks[0]._id },
      { message: `Task "${createdTasks[2].title}" completed`, type: "task", entityId: createdTasks[2]._id },
      { message: `Stock adjusted for ${createdProducts[3].name} (-4)`, type: "stock", entityId: createdProducts[3]._id }
    ]);

    console.log("Seed data inserted");
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
