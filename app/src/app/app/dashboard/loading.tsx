export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded-lg w-64" />
      <div className="h-4 bg-slate-100 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-5">
            <div className="h-4 bg-slate-100 rounded w-20 mb-3" />
            <div className="h-6 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="h-48 bg-white rounded-2xl border border-slate-100" />
    </div>
  );
}
