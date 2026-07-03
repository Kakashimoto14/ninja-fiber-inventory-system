import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleLabel } from "../../data/taskConfig.js";
import Sidebar from "./Sidebar.jsx";
import NotificationBell from "./NotificationBell.jsx";
import GlobalSearch from "../common/GlobalSearch.jsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { account, signOut } = useAuth();
  const initials = account?.name.slice(0, 2) || "AD";

  return (
    <div className="min-h-screen bg-soft">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 md:ml-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Global Search — replaces old static placeholder */}
          <GlobalSearch />

          {/* Mobile search icon */}
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            {/* Live notification bell */}
            <NotificationBell />

            <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
              <div className="h-8 w-8 rounded-md bg-teal text-center text-sm font-extrabold leading-8 text-white">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-950">{account?.name}</p>
                <p className="text-xs text-slate-500">{roleLabel(account?.role)} account</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:border-red-200 hover:text-red-600 transition-colors"
              onClick={signOut}
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
