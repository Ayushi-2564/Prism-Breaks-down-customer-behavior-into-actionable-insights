import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { InventoryPlanner } from './pages/InventoryPlanner';
import { Analytics } from './pages/Analytics';
import { Simulator } from './pages/Simulator';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && <Overview />}
        {currentTab === 'inventory' && <InventoryPlanner />}
        {currentTab === 'analytics' && <Analytics />}
        {currentTab === 'simulator' && <Simulator />}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        DemandIQ Platform • Multi-Store Demand Forecasting & Inventory Optimization • LightGBM + FastAPI + React
      </footer>
    </div>
  );
}
