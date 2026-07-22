interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: string;
  accent?: 'teal' | 'amber' | 'blue' | 'rose' | 'slate' | 'green';
}

const accentMap = {
  teal: 'from-teal-500 to-teal-600',
  amber: 'from-amber-500 to-amber-600',
  blue: 'from-blue-500 to-blue-600',
  rose: 'from-rose-500 to-rose-600',
  slate: 'from-slate-600 to-slate-700',
  green: 'from-green-500 to-green-600',
};

export function StatCard({ label, value, icon, trend, accent = 'teal' }: StatCardProps) {
  return (
    <div className="mi-card p-5 animate-in hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{value}</p>
          {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
        </div>
        {icon && (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[accent]} text-white shadow-sm`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
