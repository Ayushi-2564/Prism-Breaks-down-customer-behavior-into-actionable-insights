import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  PieChart as PieIcon, 
  BarChart3, 
  Activity,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

import { MetricCard } from '../components/MetricCard';
import { getDashboardMetrics } from '../services/api';

const RISK_COLORS = {
  HIGH: '#f43f5e',
  MEDIUM: '#f59e0b',
  LOW: '#10b981'
};

export const Overview = ({ onInspectCustomer, onNavigateToCustomers }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getDashboardMetrics()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Dashboard error:", err);
          setError("Failed to fetch dashboard intelligence. Ensure FastAPI backend is running.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4" />
        <p className="text-sm font-medium">Aggregating customer risk distributions & revenue exposure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
        <h4 className="font-bold mb-1">Backend Connection Notice</h4>
        <p>{error}</p>
      </div>
    );
  }

  const pieData = [
    { name: 'High Risk (>60%)', value: data.risk_distribution.HIGH, color: RISK_COLORS.HIGH },
    { name: 'Medium Risk (30-60%)', value: data.risk_distribution.MEDIUM, color: RISK_COLORS.MEDIUM },
    { name: 'Low Risk (<30%)', value: data.risk_distribution.LOW, color: RISK_COLORS.LOW },
  ];

  return (
    <div className="space-y-8">
      
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Executive Intelligence Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time portfolio churn risk, predictive revenue exposure, and retention opportunity modeling.
          </p>
        </div>

        <button
          onClick={onNavigateToCustomers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          <span>View Customer Risk Table</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* 8 Metric KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Monitored Accounts"
          value={data.total_customers.toLocaleString()}
          subtitle="Active enterprise & retail customers"
          icon={Users}
        />

        <MetricCard
          title="Accounts at Risk"
          value={data.customers_at_risk.toLocaleString()}
          subtitle={`${((data.customers_at_risk / data.total_customers) * 100).toFixed(1)}% of total customer base`}
          icon={AlertTriangle}
          alert={true}
        />

        <MetricCard
          title="High Risk (Immediate)"
          value={data.high_risk_customers.toLocaleString()}
          subtitle="Churn probability exceeding 60%"
          icon={ShieldAlert}
          alert={true}
        />

        <MetricCard
          title="Portfolio Churn Rate"
          value={`${data.overall_churn_rate}%`}
          subtitle="Model baseline probability"
          icon={Activity}
        />

        <MetricCard
          title="Estimated Revenue at Risk"
          value={formatCurrency(data.total_revenue_at_risk)}
          subtitle="Sum of (Churn Prob × Predicted LTV)"
          icon={DollarSign}
          alert={true}
        />

        <MetricCard
          title="Average Predicted LTV"
          value={formatCurrency(data.avg_predicted_ltv)}
          subtitle="Forecasted customer lifetime value"
          icon={TrendingUp}
        />

        <MetricCard
          title="Average Historical LTV"
          value={formatCurrency(data.avg_customer_ltv)}
          subtitle="Realized spend baseline"
          icon={Layers}
        />

        <MetricCard
          title="Retention Opportunity"
          value={formatCurrency(data.retention_opportunity_amount)}
          subtitle="Estimated recoverable revenue"
          icon={Sparkles}
        />
      </div>

      {/* Section 2: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Distribution Donut */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Churn Risk Breakdown
              </h3>
              <p className="text-xs text-slate-500">Account distribution across risk tiers</p>
            </div>
            <PieIcon className="h-4 w-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} accounts (${((value/data.total_customers)*100).toFixed(1)}%)`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">High Risk</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{data.risk_distribution.HIGH}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Medium Risk</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{data.risk_distribution.MEDIUM}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Low Risk</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{data.risk_distribution.LOW}</p>
            </div>
          </div>
        </div>

        {/* Revenue at Risk by Plan */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Revenue at Risk & Churn Rate by Plan
              </h3>
              <p className="text-xs text-slate-500">Plan vulnerability & revenue exposure</p>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.churn_by_plan}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(val, name) => [
                    name === 'Revenue at Risk' ? formatCurrency(val) : `${val}%`, 
                    name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="revenue_at_risk" name="Revenue at Risk" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avg_churn_rate" name="Avg Churn Rate (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Section 3: Churn by Tenure Cohort & Segment Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tenure Cohort Area Chart */}
        <div className="lg:col-span-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Churn Rate Across Customer Tenure
              </h3>
              <p className="text-xs text-slate-500">New onboarding cohorts vs seasoned loyal accounts</p>
            </div>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.churn_by_tenure}>
                <defs>
                  <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="cohort" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(val) => [`${val}%`, 'Avg Churn Rate']} />
                <Area type="monotone" dataKey="avg_churn_rate" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#churnGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Segments Table */}
        <div className="lg:col-span-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Strategic Customer Segments
              </h3>
              <p className="text-xs text-slate-500">Volume and revenue exposure per behavioral segment</p>
            </div>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="pb-2">Segment</th>
                  <th className="pb-2 text-right">Accounts</th>
                  <th className="pb-2 text-right">Avg Churn</th>
                  <th className="pb-2 text-right">Revenue at Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {data.customer_segments.map((seg, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                      {seg.segment}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                      {seg.count}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                        seg.avg_churn_rate >= 50 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {seg.avg_churn_rate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-900 dark:text-slate-200">
                      {formatCurrency(seg.revenue_at_risk)}
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
