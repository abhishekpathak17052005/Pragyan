export function DashboardHeaderSkeleton() {
  return (
    <div className="text-slate-900">
      <div className="h-10 bg-slate-200 rounded-lg w-64 mb-2 animate-pulse" />
      <div className="h-5 bg-slate-200 rounded-lg w-48 animate-pulse" />
    </div>
  );
}

export function ContinueLearningSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
      <div className="h-6 bg-slate-200 rounded-lg w-40 animate-pulse" />
      
      {/* Career Path */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded-lg w-32 animate-pulse" />
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
      </div>

      {/* Current Position */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="h-3 bg-slate-200 rounded-lg w-24 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-slate-200 rounded-lg w-16 animate-pulse" />
              <div className="h-5 bg-slate-200 rounded-lg w-20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-slate-200 rounded-lg w-20 animate-pulse" />
            <div className="h-2 bg-slate-200 rounded-full w-full animate-pulse" />
          </div>
        ))}
      </div>

      {/* Button */}
      <div className="h-10 bg-slate-200 rounded-full w-32 animate-pulse" />
    </div>
  );
}

export function StatWidgetSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl shadow-lg p-6 animate-pulse h-32" />
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-2">
      <div className="h-5 bg-slate-200 rounded-lg w-24 mb-4 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-lg w-full animate-pulse" />
      ))}
    </div>
  );
}
