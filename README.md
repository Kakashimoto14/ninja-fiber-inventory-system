# Ninja Fiber Inventory Management

Production-ready MERN starter for a Zoho-inspired inventory SaaS dashboard.

## Project Tree

```text
ninja-fiber-inventory/
  backend/
    controllers/
      dashboardController.js
      productController.js
      taskController.js
    middleware/
      errorMiddleware.js
    models/
      Activity.js
      Product.js
      Task.js
    routes/
      dashboardRoutes.js
      productRoutes.js
      taskRoutes.js
    scripts/
      seed.js
    .env.example
    package.json
    server.js
  frontend/
    src/
      components/
        common/
          LoadingSpinner.jsx
          Modal.jsx
        dashboard/
          StatCard.jsx
        layout/
          AppLayout.jsx
          Sidebar.jsx
        products/
          ProductModal.jsx
          StockAdjustModal.jsx
        tasks/
          TaskModal.jsx
      data/
        mockData.js
      pages/
        Dashboard.jsx
        Landing.jsx
        Products.jsx
        Settings.jsx
        TasksNotes.jsx
      services/
        api.js
      utils/
        format.js
      App.jsx
      index.css
      main.jsx
    .env.example
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
  .gitignore
  package.json
  README.md
```

## Run Locally

```bash
cd ninja-fiber-inventory
npm install
```

Create environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Start MongoDB locally, then seed demo data:

```bash
npm run seed
```

Run backend and frontend in two terminals:

```bash
npm run backend
npm run frontend
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000/api/health`

## Notes On Core Logic

Low-stock alerts are calculated by comparing each product's `quantity` to its `reorderPoint`. A product is considered low stock when `quantity <= reorderPoint`.

Task completion is handled by updating the task status to `Completed`. The frontend immediately moves completed items into the Completed section, while the backend logs a task activity event.

The dashboard chart uses `inventoryMovement` from `/api/dashboard/stats`. The current implementation derives a stable 30-day movement trend from the total on-hand quantity so the chart is useful before a dedicated order history module exists.
