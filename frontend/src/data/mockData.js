import importedExcelData from "./importedExcelData.json";

const fallbackProducts = [
  {
    _id: "demo-1",
    name: "Fiber Optic Cable 1 Core",
    sku: "NFI-CBL-001",
    category: "Fiber Cables",
    supplier: "CoreLink Supplies",
    quantity: 240,
    reorderPoint: 80
  },
  {
    _id: "demo-2",
    name: "ONU Router X1200",
    sku: "NFI-ONU-1200",
    category: "Network Devices",
    supplier: "SignalPro",
    quantity: 34,
    reorderPoint: 40
  },
  {
    _id: "demo-3",
    name: "Patch Cord SC/APC",
    sku: "NFI-PCH-044",
    category: "Accessories",
    supplier: "FiberMate",
    quantity: 420,
    reorderPoint: 100
  },
  {
    _id: "demo-4",
    name: "Splitter 1x8 PLC",
    sku: "NFI-SPL-108",
    category: "Splitters",
    supplier: "CoreLink Supplies",
    quantity: 18,
    reorderPoint: 25
  }
];

const fallbackTasks = [
  {
    _id: "task-1",
    type: "Install",
    title: "Install ONU routers for new customers",
    description: "Prepare equipment and complete three new customer installations.",
    assigneeId: "rhea",
    assigneeName: "RHEA",
    priority: "High",
    status: "In Progress",
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    notes: "Two routers ready. Waiting for final address confirmation."
  },
  {
    _id: "task-2",
    type: "Reactivate",
    title: "Reactivate dormant subscriber accounts",
    description: "Verify billing clearance and restore service access.",
    assigneeId: "jules",
    assigneeName: "JULES",
    priority: "Medium",
    status: "Pending",
    date: new Date(Date.now() - 86400000).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    notes: "Confirm account list with billing before activation."
  },
  {
    _id: "task-3",
    type: "Repairs",
    title: "Repair field issue at Zone 4",
    description: "Diagnose intermittent fiber signal loss.",
    assigneeId: "jun",
    assigneeName: "JUN",
    priority: "Urgent",
    status: "Completed",
    date: new Date().toISOString(),
    dueDate: "",
    completedAt: new Date().toISOString(),
    notes: "Line repaired and customer confirmed service restoration."
  },
  {
    _id: "task-4",
    type: "Install",
    title: "Schedule condo building installation",
    description: "Coordinate access pass and fiber route for Building B.",
    assigneeId: "rhea",
    assigneeName: "RHEA",
    priority: "Medium",
    status: "Scheduled",
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    notes: "Building admin available after 10 AM."
  }
];

export const mockActivity = [
  { _id: "act-1", message: "Added product Fiber Optic Cable 1 Core", type: "product", createdAt: new Date().toISOString() },
  { _id: "act-2", message: "Task \"Repair field issue at Zone 4\" completed", type: "task", createdAt: new Date().toISOString() },
  { _id: "act-3", message: "Stock adjusted for Splitter 1x8 PLC (-4)", type: "stock", createdAt: new Date().toISOString() },
  { _id: "act-4", message: "Updated product ONU Router X1200", type: "product", createdAt: new Date().toISOString() },
  { _id: "act-5", message: "Created task \"Reactivate dormant subscriber accounts\"", type: "task", createdAt: new Date().toISOString() }
];

export const mockMovement = Array.from({ length: 30 }, (_, index) => ({
  day: `Day ${index + 1}`,
  quantity: 610 + index * 3 + Math.round(Math.sin((index + 1) / 3) * 12)
}));

export const importedSummary = importedExcelData.summary || {};
export const importedInventoryRecords = importedExcelData.inventoryRecords || [];
export const importedPayments = importedExcelData.payments || [];
export const importedExpenses = importedExcelData.expenses || [];
export const importedSubscribers = importedExcelData.subscribers || [];
export const importedGcashRefs = importedExcelData.gcashRefs || [];
export const importedSourceFiles = importedExcelData.sourceFiles || [];

export const mockProducts = importedExcelData.products?.length ? importedExcelData.products : fallbackProducts;
export const mockTasks = importedExcelData.tasks?.length ? importedExcelData.tasks : fallbackTasks;
