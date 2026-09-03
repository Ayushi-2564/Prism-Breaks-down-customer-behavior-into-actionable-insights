import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Overview } from './pages/Overview';
import { Customers } from './pages/Customers';
import { ModelPerformance } from './pages/ModelPerformance';
import { PredictLive } from './pages/PredictLive';
import { CustomerModal } from './components/CustomerModal';

export function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [inspectCustomer, setInspectCustomer] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Professional Navbar */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && (
          <Overview 
            onInspectCustomer={(c) => setInspectCustomer(c)}
            onNavigateToCustomers={() => setCurrentTab('customers')}
          />
        )}

        {currentTab === 'customers' && (
          <Customers 
            onSelectCustomer={(c) => setInspectCustomer(c)}
          />
        )}

        {currentTab === 'model' && (
          <ModelPerformance />
        )}

        {currentTab === 'simulator' && (
          <PredictLive />
        )}
      </main>

      {/* Standalone Customer Profile Inspection Modal */}
      {inspectCustomer && (
        <CustomerModal
          customer={inspectCustomer}
          onClose={() => setInspectCustomer(null)}
        />
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 mt-16 py-6 bg-white dark:bg-slate-900 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Customer Intelligence Platform • Churn Risk & Lifetime Value Prediction System
          </p>
          <div className="flex items-center gap-4">
            <span>FastAPI + SQLite/PostgreSQL</span>
            <span>•</span>
            <span>XGBoost + TreeSHAP</span>
            <span>•</span>
            <span>React + Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
