import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  SlidersHorizontal,
  RefreshCw,
  Download
} from 'lucide-react';
import { RiskBadge, SegmentBadge } from '../components/RiskBadge';
import { CustomerModal } from '../components/CustomerModal';
import { getCustomers } from '../services/api';

export const Customers = ({ onSelectCustomer }) => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [segment, setSegment] = useState('ALL');
  const [plan, setPlan] = useState('ALL');
  const [sortBy, setSortBy] = useState('churn_probability');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = () => {
    setLoading(true);
    const params = {
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (search.trim()) params.search = search.trim();
    if (riskLevel !== 'ALL') params.risk_level = riskLevel;
    if (segment !== 'ALL') params.segment = segment;
    if (plan !== 'ALL') params.subscription_plan = plan;

    getCustomers(params)
      .then((res) => {
        setCustomers(res.customers || []);
        setTotal(res.total || 0);
        setTotalPages(res.total_pages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load customers:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, pageSize, riskLevel, segment, plan, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleSortChange = (columnKey) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(columnKey);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Customer Risk Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and prioritize accounts by churn risk score, predicted lifetime value, and retention opportunity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {total.toLocaleString()} Accounts Filtered
          </span>
          <button
            onClick={fetchCustomers}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Table"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </form>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskLevel}
              onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk (&gt;60%)</option>
              <option value="MEDIUM">Medium Risk (30-60%)</option>
              <option value="LOW">Low Risk (&lt;30%)</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div>
            <select
              value={plan}
              onChange={(e) => { setPlan(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Premium">Premium</option>
              <option value="Standard">Standard</option>
              <option value="Basic">Basic</option>
            </select>
          </div>

          {/* Segment Filter */}
          <div>
            <select
              value={segment}
              onChange={(e) => { setSegment(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Segments</option>
              <option value="At-Risk High Value">At-Risk High Value</option>
              <option value="At-Risk Standard">At-Risk Standard</option>
              <option value="Champions & VIPs">Champions & VIPs</option>
              <option value="Nurture Priority">Nurture Priority</option>
              <option value="New / Onboarding">New / Onboarding</option>
              <option value="Loyal Active">Loyal Active</option>
              <option value="Dormant Accounts">Dormant Accounts</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Customer Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Segment</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => handleSortChange('churn_probability')}
                >
                  <div className="flex items-center gap-1">
                    <span>Churn Risk</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition text-right"
                  onClick={() => handleSortChange('predicted_ltv')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Predicted LTV</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition text-right"
                  onClick={() => handleSortChange('revenue_at_risk')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Rev at Risk</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition text-right"
                  onClick={() => handleSortChange('monthly_spend')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Monthly Spend</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition text-center"
                  onClick={() => handleSortChange('days_since_last_login')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Last Active</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4 text-center">Profile</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2" />
                    <p>Loading filtered customer risks...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-400">
                    No customers match the active filters.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr 
                    key={c.customer_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Customer info */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">
                            {c.customer_id}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            • {c.subscription_plan}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Segment */}
                    <td className="py-3.5 px-4">
                      <SegmentBadge segment={c.segment} />
                    </td>

                    {/* Churn Risk */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {c.churn_percentage}%
                          </span>
                          <RiskBadge level={c.risk_level} size="sm" />
                        </div>
                        {/* Progress Bar */}
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              c.churn_probability >= 0.6 ? 'bg-rose-500' : (c.churn_probability >= 0.3 ? 'bg-amber-500' : 'bg-emerald-500')
                            }`}
                            style={{ width: `${c.churn_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Predicted LTV */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(c.predicted_ltv)}
                    </td>

                    {/* Revenue at Risk */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(c.revenue_at_risk)}
                    </td>

                    {/* Monthly Spend */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(c.monthly_spend)}
                    </td>

                    {/* Last Active */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        c.days_since_last_login > 14 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 font-bold' 
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {c.days_since_last_login}d ago
                      </span>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block max-w-[200px] truncate text-slate-700 dark:text-slate-300 font-medium" title={c.recommended_action}>
                        {c.recommended_action}
                      </span>
                    </td>

                    {/* Inspect Profile Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                        title="Inspect Diagnostics & SHAP"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing page</span>
            <span className="font-bold text-slate-800 dark:text-white font-mono">{page}</span>
            <span>of</span>
            <span className="font-bold text-slate-800 dark:text-white font-mono">{totalPages}</span>
            <span>({total.toLocaleString()} total accounts)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Select */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="py-1 px-2 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {/* Prev / Next */}
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Customer Diagnostics & SHAP Modal */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

    </div>
  );
};
