import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, alert }) => {
  return (
    <div className={`p-5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 hover:shadow-md ${
      alert 
        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20' 
        : 'border-slate-200/80 dark:border-slate-800'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${
            alert 
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.isPositive 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
          }`}>
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
