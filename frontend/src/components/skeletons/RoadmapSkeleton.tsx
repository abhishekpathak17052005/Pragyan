export function RoadmapHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
      <div className="h-4 bg-slate-200 rounded-lg w-96 animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-slate-200 rounded-lg w-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function ModuleCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-md overflow-hidden">
      <div className="px-6 py-5 space-y-4">
        <div className="h-3 bg-slate-200 rounded-lg w-32 animate-pulse" />
        <div className="h-6 bg-slate-200 rounded-lg w-48 animate-pulse" />
        <div className="h-2 bg-slate-200 rounded-full w-48 animate-pulse" />
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-200 rounded-lg w-32 animate-pulse" />
          <div className="h-8 bg-slate-200 rounded-full w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ModuleListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <ModuleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function WeekCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="h-4 bg-slate-100 rounded-lg w-40 animate-pulse" />
      <div className="h-5 bg-slate-100 rounded-lg w-32 animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-slate-100 rounded w-12 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function ResourceCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="h-4 bg-slate-200 rounded-lg w-48 animate-pulse" />
      <div className="flex justify-between items-center">
        <div className="h-3 bg-slate-200 rounded-lg w-32 animate-pulse" />
        <div className="h-8 bg-slate-200 rounded-full w-20 animate-pulse" />
      </div>
    </div>
  );
}
