import { NavLink } from "react-router-dom";
import {
  BarChart2,
  Bot,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  Package,
  Settings,
  UserRoundPlus,
  WalletCards
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleLabel } from "../../data/taskConfig.js";

const navItems = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard, end: true },
  { label: "Products", to: "/app/products", icon: Package },
  { label: "Tasks & Notes", to: "/app/tasks", icon: ClipboardCheck },
  { label: "Analytics", to: "/app/analytics", icon: BarChart2 },
  { label: "Records", to: "/app/records", icon: FileSpreadsheet },
  { label: "Settings", to: "/app/settings", icon: Settings }
];

const payrollItems = [
  { label: "Dashboard", to: "/app/payroll", icon: LayoutDashboard, end: true },
  { label: "Employees", to: "/app/payroll/employees", icon: UserRoundPlus },
  { label: "Generate Payroll", to: "/app/payroll/generate", icon: WalletCards },
  { label: "Payroll History", to: "/app/payroll/history", icon: History }
];

const aiItems = [{ label: "AI Assistant", to: "/app/ai", icon: Bot }];

export default function Sidebar({ isOpen, onClose }) {
  const { account } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-hidden border-r border-slate-200 bg-white transition-transform md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-slate-200">
            <img src="/assets/ninja-fiber-logo.png" alt="Ninja Fiber" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-950">Ninja Fiber</p>
            <p className="text-xs font-medium text-slate-500">Inventory Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-hidden px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}

          {account?.role === "superadmin" && (
            <>
              <div className="pt-3">
                <div className="mb-2 flex items-center gap-2 px-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  <Bot className="h-4 w-4" />
                  AI
                </div>
                <div className="space-y-1">
                  {aiItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                          }`
                        }
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3">
                <div className="mb-2 flex items-center gap-2 px-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  <WalletCards className="h-4 w-4" />
                  Payroll
                </div>
                <div className="space-y-1">
                  {payrollItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                          }`
                        }
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-soft p-3">
            <p className="text-sm font-bold text-slate-950">{account?.name}</p>
            <p className="mt-1 text-xs text-slate-500">{roleLabel(account?.role)} account signed in.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
