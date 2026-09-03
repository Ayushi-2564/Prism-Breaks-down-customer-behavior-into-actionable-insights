import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  PiggyBank, 
  CheckCircle2, 
  RefreshCw,
  Store,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

import { MetricCard } from '../components/MetricCard';
import { getDashboardMetrics, getTimeSeriesForecast } from '../services/api';

export const Overview = () => {
  const [metrics, setMetrics] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [selectedStore, setSelectedStore] = useState(1);
  const [selectedItem, setSelectedItem] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
      
      const fData = await getTimeSeriesForecast(selectedStore, selectedItem);
      setForecastData(fData);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError("Failed to connect to FastAPI backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSelectStoreItem = async (s, i) => {
    setSelectedStore(s);
    setSelectedItem(i);
    try {
      const fData = await getTimeSeriesForecast(s, i);
      setForecastData(fData);
    } catch (err) {
      console.error("Forecast load failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
          <span>Loading Supply Chain Analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
          <h3 className="font-bold text-base">Backend Connection Required</h3>
        </div>
        <p className="text-sm mt-2 text-rose-200/80">{error}</p>
      </div>
    );
  }

  // Format forecast chart data
  const chartData = forecastData?.time_series?.dates?.map((d, idx) => ({
    date: d.slice(5),
    actual: forecastData.time_series.actual_sales[idx],
    forecast: forecastData.time_series.forecast_sales[idx],
    upper: forecastData.time_series.upper_bound[idx],
    lower: forecastData.time_series.lower_bound[idx]
  })) || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Supply Chain & Inventory Executive Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time demand forecasting across 10 stores & 50 item categories with Safety Stock optimization.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Analytics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="LightGBM WAPE Score"
          value={`${metrics?.system_wape_score}%`}
          subtitle={`Vs Baseline Naive WAPE: ${metrics?.baseline_wape_score}%`}
          trend={`↓ ${metrics?.wape_improvement_pct}% error reduction`}
          icon={TrendingUp}
          color="emerald"
        />
        <MetricCard
          title="Annual Holding Cost Savings"
          value={`₹${(metrics?.total_annual_holding_savings || 0).toLocaleString()}`}
          subtitle="Savings from optimized Safety Stock"
          icon={PiggyBank}
          color="indigo"
        />
        <MetricCard
          title="Active Stockout Alerts"
          value={metrics?.reorder_alerts_count || 0}
          subtitle="Items below Reorder Point (ROP)"
          icon={AlertTriangle}
          color="rose"
        />
        <MetricCard
          title="Total Demand Analyzed"
          value={`${(metrics?.total_sales_records || 0).toLocaleString()}`}
          subtitle="2-Year Daily Kaggle Transactions"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Main Time-Series Forecast Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Daily Demand Forecast & Confidence Bounds</h2>
            <p className="text-xs text-slate-400">
              Showing actuals vs LightGBM forecasted sales for {forecastData?.store_name} — {forecastData?.item_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedStore}
              onChange={(e) => handleSelectStoreItem(Number(e.target.value), selectedItem)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {[1,2,3,4,5,6,7,8,9,10].map((s) => (
                <option key={s} value={s}>Store #{s}</option>
              ))}
            </select>
            <select
              value={selectedItem}
              onChange={(e) => handleSelectStoreItem(selectedStore, Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {[1,5,10,15,20,25,30,35,40,45,50].map((i) => (
                <option key={i} value={i}>Item #{i}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="actual" name="Actual Sales" stroke="#6366f1" fillOpacity={1} fill="url(#actualGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="forecast" name="LightGBM Forecast" stroke="#10b981" fillOpacity={1} fill="url(#forecastGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown & Store Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Demand & Savings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Demand & Savings by Product Category</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.category_breakdown || []} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Bar dataKey="avg_daily_demand" name="Avg Daily Units" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Store Risk & Volume Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Store Location</th>
                  <th className="py-2.5 px-3">Item Count</th>
                  <th className="py-2.5 px-3">Avg Daily Demand</th>
                  <th className="py-2.5 px-3 text-right">High Risk Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {metrics?.store_performance?.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{s.store_name}</td>
                    <td className="py-2.5 px-3">{s.item_count} items</td>
                    <td className="py-2.5 px-3 font-mono">{s.avg_daily_demand} units</td>
                    <td className="py-2.5 px-3 text-right">
                      {s.high_risk_items > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          {s.high_risk_items} Alert
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                          0 Alert
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
