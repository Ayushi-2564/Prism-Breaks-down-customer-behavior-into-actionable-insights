import React from 'react';

export const RiskBadge = ({ level, size = 'md' }) => {
  const normalized = (level || '').toUpperCase();
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs font-semibold' 
    : 'px-2.5 py-1 text-xs font-bold tracking-wider';

  if (normalized === 'HIGH' || normalized.includes('HIGH')) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50 ${sizeClasses}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
        HIGH RISK
      </span>
    );
  }

  if (normalized === 'MEDIUM' || normalized.includes('MEDIUM')) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 ${sizeClasses}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        MEDIUM RISK
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 ${sizeClasses}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      LOW RISK
    </span>
  );
};

export const SegmentBadge = ({ segment }) => {
  const seg = segment || 'Standard';
  
  let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  
  if (seg.includes('Champions') || seg.includes('VIP')) {
    color = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
  } else if (seg.includes('At-Risk High Value')) {
    color = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
  } else if (seg.includes('At-Risk')) {
    color = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800';
  } else if (seg.includes('New') || seg.includes('Onboarding')) {
    color = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
  } else if (seg.includes('Loyal')) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {seg}
    </span>
  );
};
