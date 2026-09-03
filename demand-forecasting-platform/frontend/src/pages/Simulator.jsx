import React, { useState } from 'react';
import { Sliders, Zap, Shield, PiggyBank, RefreshCw } from 'lucide-react';
import { simulateInventory } from '../services/api';

export const Simulator = () => {
  const [demandMean, setDemandMean] = useState(65);
  const [demandStd, setDemandStd] = useState(14);
  const [leadDays, setLeadDays] = useState(5);
  const [unitPrice, setUnitPrice] = useState(450);
  const [holdingRate, setHoldingRate] = useState(0.08);
  const [serviceLevel, setServiceLevel] = useState(0.95);
  
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await simulateInventory({
        daily_demand_mean: Number(demandMean),
        daily_demand_std: Number(demandStd),
        lead_days: Number(leadDays),
        unit_price: Number(unitPrice),
        holding_cost_rate: Number(holdingRate),
        service_level: Number(serviceLevel)
      });
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h1 className="text-xl font-bold text-white tracking-tight">Interactive Inventory & Safety Stock Simulator</h1>
        <p className="text-sm text-slate-400 mt-1">
          Simulate supply chain lead-time delays, demand surges, and service levels to compute dynamic Reorder Points (ROP) and Holding Savings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Controls Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Supply Chain Parameters</h2>
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Run Instant Simulation
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Daily Demand Mean */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Average Daily Demand (units)</span>
                <span className="text-indigo-400">{demandMean} units/day</span>
              </div>
              <input
                type="range"
                min="5"
                max="300"
                value={demandMean}
                onChange={(e) => setDemandMean(e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Daily Demand Std */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Demand Variation (Std Dev)</span>
                <span className="text-amber-400">± {demandStd} units</span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                value={demandStd}
                onChange={(e) => setDemandStd(e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Lead Time Days */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Restock Lead Time (Days)</span>
                <span className="text-emerald-400">{leadDays} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="21"
                value={leadDays}
                onChange={(e) => setLeadDays(e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Unit Retail Price (₹)</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Service Level Confidence */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Service Level Target (No Stockout Confidence)</label>
              <select
                value={serviceLevel}
                onChange={(e) => setServiceLevel(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={0.90}>90% Service Level (Z = 1.28)</option>
                <option value={0.95}>95% Service Level (Z = 1.65 - Standard)</option>
                <option value={0.99}>99% Critical Service Level (Z = 2.33)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-4">Calculated Inventory Thresholds</h2>
            
            {simulationResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Lead Time Demand</div>
                    <div className="text-lg font-bold text-slate-200">{simulationResult.lead_time_demand} units</div>
                  </div>
                  <div className="text-xs text-slate-400 text-right font-mono">
                    {demandMean} units × {leadDays} days
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-300 font-semibold">Calculated Safety Stock Buffer</div>
                    <div className="text-2xl font-bold text-amber-400">{simulationResult.safety_stock_units} units</div>
                  </div>
                  <Shield className="h-8 w-8 text-amber-400/80" />
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-indigo-300 font-semibold">Optimal Reorder Point (ROP) Trigger</div>
                    <div className="text-2xl font-bold text-indigo-400">{simulationResult.reorder_point_units} units</div>
                  </div>
                  <Zap className="h-8 w-8 text-indigo-400/80" />
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-300 font-semibold">Annual Holding Cost Savings</div>
                    <div className="text-2xl font-bold text-emerald-400">₹{simulationResult.holding_cost_savings.toLocaleString()}</div>
                  </div>
                  <PiggyBank className="h-8 w-8 text-emerald-400/80" />
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                Tweak parameters on the left and click <strong>"Run Instant Simulation"</strong> to evaluate inventory thresholds.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
