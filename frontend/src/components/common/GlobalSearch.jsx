import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, ClipboardList, Users, X, ArrowRight } from "lucide-react";
import { mockProducts, mockTasks } from "../../data/mockData.js";
import { importedSubscribers } from "../../data/mockData.js";
import { applyDailyReset } from "../../utils/taskReset.js";

const SECTIONS = [
  {
    key: "products",
    label: "Products",
    icon: Package,
    color: "text-primary",
    bg: "bg-primary/10",
    route: "/app/products",
    items: mockProducts,
    match: (item, q) =>
      item.name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q) || item.supplier?.toLowerCase().includes(q),
    render: (item) => (
      <div>
        <p className="text-sm font-bold text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">{item.sku} · {item.supplier} · Qty: {item.quantity}</p>
      </div>
    )
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: ClipboardList,
    color: "text-teal",
    bg: "bg-teal/10",
    route: "/app/tasks",
    items: applyDailyReset(mockTasks),
    match: (item, q) =>
      item.title?.toLowerCase().includes(q) || item.type?.toLowerCase().includes(q) || item.assigneeName?.toLowerCase().includes(q),
    render: (item) => (
      <div>
        <p className="text-sm font-bold text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-500">{item.type} · {item.status} · {item.assigneeName}</p>
      </div>
    )
  },
  {
    key: "subscribers",
    label: "Subscribers",
    icon: Users,
    color: "text-violet-700",
    bg: "bg-violet-50",
    route: "/app/records",
    items: importedSubscribers,
    match: (item, q) =>
      item.name?.toLowerCase().includes(q) || String(item.accountNumber || "").includes(q),
    render: (item) => (
      <div>
        <p className="text-sm font-bold text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">Account #{item.accountNumber} · ₱{item.amount}</p>
      </div>
    )
  }
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut: "/"
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SECTIONS.map((section) => ({
      ...section,
      hits: section.items.filter((item) => section.match(item, q)).slice(0, 5)
    })).filter((s) => s.hits.length > 0);
  }, [query]);

  const totalHits = results.reduce((s, r) => s + r.hits.length, 0);

  const go = (route) => {
    navigate(route);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button in header */}
      <button
        type="button"
        id="global-search-trigger"
        onClick={() => setOpen(true)}
        className="hidden max-w-md flex-1 items-center gap-2 rounded-md border border-slate-200 bg-soft px-3 py-2 text-sm text-slate-500 transition hover:border-teal hover:text-slate-700 md:flex"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search products, tasks, subscribers…</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400">/</kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          style={{ animation: "backdropIn 0.15s ease" }}
        >
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            style={{ animation: "modalIn 0.2s ease" }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-teal" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Search anything…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {!query && (
                <div className="px-4 py-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">Type to search across products, tasks & subscribers</p>
                  <p className="mt-1 text-xs text-slate-300">Press <kbd className="rounded border border-slate-200 px-1 text-[10px]">/</kbd> anytime to open</p>
                </div>
              )}

              {query && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-500">No results for "<strong>{query}</strong>"</p>
                  <p className="mt-1 text-xs text-slate-400">Try a different keyword</p>
                </div>
              )}

              {results.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.key}>
                    <div className="flex items-center gap-2 border-t border-slate-50 bg-slate-50/60 px-4 py-2">
                      <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {section.label} ({section.hits.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => go(section.route)}
                        className="ml-auto flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
                      >
                        View all <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    {section.hits.map((item, i) => (
                      <button
                        key={item._id || item.id || i}
                        type="button"
                        onClick={() => go(section.route)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 border-b border-slate-50 last:border-0"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${section.bg}`}>
                          <Icon className={`h-4 w-4 ${section.color}`} />
                        </div>
                        {section.render(item)}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {totalHits > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5">
                <p className="text-[11px] text-slate-400">{totalHits} result{totalHits !== 1 ? "s" : ""} found</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes backdropIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalIn {
          from { opacity:0; transform:translateY(-12px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
