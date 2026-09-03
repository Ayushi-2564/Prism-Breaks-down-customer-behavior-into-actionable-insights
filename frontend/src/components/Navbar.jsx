import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Binary, 
  SlidersHorizontal, 
  Activity, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

export const Navbar = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'customers', label: 'Customer Risk Hub', icon: Users },
    { id: 'model', label: 'Model Performance & SHAP', icon: Binary },
    { id: 'simulator', label: 'Real-Time Simulator', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-inner">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Customer Intelligence</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ML Studio
                </span>
              </div>
              <p className="text-xs text-slate-400">Churn Risk & Lifetime Value Prediction</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-600/90 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Engine Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">ML Pipeline:</span>
            <span className="font-semibold text-emerald-400">Active</span>
          </div>

        </div>
      </div>
    </header>
  );
};
