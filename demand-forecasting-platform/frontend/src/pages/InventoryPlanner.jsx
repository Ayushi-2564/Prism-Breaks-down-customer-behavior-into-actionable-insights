import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';

import { getInventoryItems } from '../services/api';

export const InventoryPlanner = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedRisk) params.risk = selectedRisk;
      const data = await getInventoryItems(params);
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedCategory, selectedRisk]);

  const filteredItems = items.filter(i => 
    i.item_name.toLowerCase().includes(search.toLowerCase()) ||
    i.store_name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Inventory & Reorder Planning Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated Reorder Point (ROP) thresholds and Safety Stock calculations across stores.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search store, item, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          <option value="Fresh Produce">Fresh Produce</option>
          <option value="Dairy & Packaged">Dairy & Packaged</option>
          <option value="Beverages">Beverages</option>
          <option value="Personal Care">Personal Care</option>
          <option value="Electronics Accessories">Electronics Accessories</option>
        </select>

        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Stockout Risk Tiers</option>
          <option value="HIGH">High Reorder Alert</option>
          <option value="MEDIUM">Medium Buffer</option>
          <option value="LOW">Optimal Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
            Loading Inventory Directory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Store & Location</th>
                  <th className="py-3 px-4">Item & Category</th>
                  <th className="py-3 px-4">Daily Demand (Mean ± Std)</th>
                  <th className="py-3 px-4">Lead Time</th>
                  <th className="py-3 px-4">Safety Stock</th>
                  <th className="py-3 px-4">Reorder Point (ROP)</th>
                  <th className="py-3 px-4 text-right">Holding Savings</th>
                  <th className="py-3 px-4 text-right">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{item.store_name}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-indigo-300">{item.item_name}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.daily_demand_mean} ± {item.daily_demand_std} units/day
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {item.lead_days} Days
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400">
                      {item.safety_stock_units} units
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-400">
                      {item.reorder_point_units} units
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                      ₹{item.holding_cost_savings.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.stockout_risk_level === 'HIGH' ? (
                        <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                          Reorder Alert
                        </span>
                      ) : item.stockout_risk_level === 'MEDIUM' ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                          Medium Buffer
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
