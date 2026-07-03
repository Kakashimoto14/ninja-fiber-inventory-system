export default function StatCard({ title, value, icon: Icon, accent = "bg-primary", helper }) {
  return (
    <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">{value}</p>
          {helper && <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-md ${accent} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

