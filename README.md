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

## Production Deployment

The frontend can be hosted on Vercel, but this project also has a long-running Express/MongoDB backend. Do not point the production frontend at `localhost`; deploy the backend separately and set the frontend API URL to that deployed backend.

Recommended backend hosts:

- Render Web Service
- Railway Node.js service
- Fly.io Node app
- VPS with Node.js and a process manager

For the backend host, set these private environment variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=
CLIENT_URL=https://your-frontend.vercel.app
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_PROMPT_CHARS=6000
AI_MAX_HISTORY_MESSAGES=24
AI_HISTORY_SUMMARY_THRESHOLD=36
AI_HISTORY_RECENT_MESSAGES=16
AI_SUMMARY_CACHE_TTL_MS=30000
AI_TEMPERATURE=0.4
AI_MAX_OUTPUT_TOKENS=2048
SHOW_ERROR_STACK=false
```

For the Vercel frontend project, set only this public variable:

```env
VITE_API_URL=https://your-backend-host.com/api
```

Never put `MONGODB_URI`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `OPENROUTER_API_KEY` in Vercel frontend variables. Vite variables are bundled into browser code when prefixed with `VITE_`.

If secrets were previously committed or pushed, rotate them in MongoDB Atlas and Google AI Studio, then update the backend host environment variables.

### Backend Deploy Notes

For Render/Railway-style Node hosting:

- Root directory: `backend` if the host supports monorepo subdirectories.
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

If deploying from the repository root instead:

- Build command: `npm install`
- Start command: `npm --workspace backend start`

After the backend is live:

1. Open `https://your-backend-host.com/api/health`.
2. Confirm it returns `{"status":"ok","service":"Ninja Fiber Inventory API"}`.
3. In Vercel, set `VITE_API_URL=https://your-backend-host.com/api`.
4. Redeploy the frontend.
5. Set backend `CLIENT_URL` to your Vercel URL so CORS allows the frontend.

## Notes On Core Logic

Low-stock alerts are calculated by comparing each product's `quantity` to its `reorderPoint`. A product is considered low stock when `quantity <= reorderPoint`.

Task completion is handled by updating the task status to `Completed`. The frontend immediately moves completed items into the Completed section, while the backend logs a task activity event.

The dashboard chart uses `inventoryMovement` from `/api/dashboard/stats`. The current implementation derives a stable 30-day movement trend from the total on-hand quantity so the chart is useful before a dedicated order history module exists.
