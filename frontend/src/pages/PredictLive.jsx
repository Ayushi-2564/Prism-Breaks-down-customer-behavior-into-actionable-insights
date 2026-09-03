import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Award, 
  RefreshCw, 
  RotateCcw,
  Zap
} from 'lucide-react';
import { RiskBadge, SegmentBadge } from '../components/RiskBadge';
import { predictCustomer } from '../services/api';

const SCENARIOS = {
  at_risk_enterprise: {
    name: "Enterprise Account at Churn Risk",
    subscription_plan: "Enterprise",
    tenure_months: 8,
    monthly_spend: 24999.0,
    previous_month_spend: 26500.0,
    total_spend: 199992.0,
    days_since_last_login: 24,
    feature_usage_score: 3,
    usage_change_30d_pct: -52.0,
    sessions_per_week: 1.5,
    login_frequency_per_week: 1.0,
    avg_session_duration_mins: 8.0,
    support_tickets: 4,
    complaints: 3,
    avg_resolution_time_hours: 48.0,
    payment_failures_last_3m: 1,
    discount_received: 0,
    customer_satisfaction_score: 2,
    location: "Bengaluru",
    age: 38,
    gender: "Female",
    marketing_emails_opened_pct: 12.0
  },
  healthy_champion: {
    name: "Loyal High-Growth Champion",
    subscription_plan: "Premium",
    tenure_months: 24,
    monthly_spend: 8999.0,
    previous_month_spend: 8999.0,
    total_spend: 215976.0,
    days_since_last_login: 1,
    feature_usage_score: 9,
    usage_change_30d_pct: 22.0,
    sessions_per_week: 8.0,
    login_frequency_per_week: 5.5,
    avg_session_duration_mins: 32.0,
    support_tickets: 1,
    complaints: 0,
    avg_resolution_time_hours: 6.0,
    payment_failures_last_3m: 0,
    discount_received: 1,
    customer_satisfaction_score: 5,
    location: "Mumbai",
    age: 32,
    gender: "Male",
    marketing_emails_opened_pct: 75.0
  },
  struggling_newbie: {
    name: "New Onboarding Friction Account",
    subscription_plan: "Standard",
    tenure_months: 2,
    monthly_spend: 3999.0,
    previous_month_spend: 3999.0,
    total_spend: 7998.0,
    days_since_last_login: 16,
    feature_usage_score: 2,
    usage_change_30d_pct: -30.0,
    sessions_per_week: 2.0,
    login_frequency_per_week: 1.5,
    avg_session_duration_mins: 12.0,
    support_tickets: 2,
    complaints: 1,
    avg_resolution_time_hours: 28.0,
    payment_failures_last_3m: 1,
    discount_received: 0,
    customer_satisfaction_score: 2,
    location: "Delhi NCR",
    age: 27,
    gender: "Female",
    marketing_emails_opened_pct: 20.0
  }
};

export const PredictLive = () => {
  const [formData, setFormData] = useState({
    name: "Simulated Customer Alpha",
    email: "sim.alpha@example.com",
    age: 34,
    gender: "Female",
    location: "Bengaluru",
    subscription_plan: "Premium",
    tenure_months: 10,
    monthly_spend: 8999.0,
    previous_month_spend: 8999.0,
    total_spend: 89990.0,
    login_frequency_per_week: 3.5,
    sessions_per_week: 5.0,
    avg_session_duration_mins: 18.0,
    days_since_last_login: 12,
    feature_usage_score: 4,
    usage_change_30d_pct: -25.0,
    marketing_emails_opened_pct: 35.0,
    support_tickets: 3,
    complaints: 1,
    avg_resolution_time_hours: 24.0,
    payment_failures_last_3m: 1,
    discount_received: 0,
    customer_satisfaction_score: 3
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadScenario = (key) => {
    const s = SCENARIOS[key];
    if (s) {
      setFormData((prev) => ({
        ...prev,
        ...s,
        email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@sim.example.com`
      }));
    }
  };

  const handleRunInference = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await predictCustomer(formData);
      setResult(res);
      setLoading(false);
    } catch (err) {
      console.error("Live prediction error:", err);
      setError("Inference failed. Check if FastAPI backend is online.");
      setLoading(false);
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
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Real-Time Customer Simulator
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Test custom customer behavior vectors against the live ML Pipeline to generate instant Churn Probability, LTV, SHAP attribution, and Retention Playbooks.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Load Presets:</span>
          <button
            onClick={() => loadScenario('at_risk_enterprise')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
          >
            At-Risk Enterprise
          </button>
          <button
            onClick={() => loadScenario('healthy_champion')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
          >
            Loyal Champion
          </button>
          <button
            onClick={() => loadScenario('struggling_newbie')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition"
          >
            Onboarding Friction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls */}
        <form onSubmit={handleRunInference} className="lg:col-span-6 space-y-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Customer Feature Parameters
            </h3>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{loading ? 'Evaluating Model...' : 'Run Instant ML Scoring'}</span>
            </button>
          </div>

          {/* Core Plan & Demographics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subscription Tier
              </label>
              <select
                value={formData.subscription_plan}
                onChange={(e) => {
                  const p = e.target.value;
                  const spends = { Basic: 1499, Standard: 3999, Premium: 8999, Enterprise: 24999 };
                  handleInputChange('subscription_plan', p);
                  handleInputChange('monthly_spend', spends[p] || 3999);
                  handleInputChange('previous_month_spend', spends[p] || 3999);
                }}
                className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Basic">Basic (₹1,499/mo)</option>
                <option value="Standard">Standard (₹3,999/mo)</option>
                <option value="Premium">Premium (₹8,999/mo)</option>
                <option value="Enterprise">Enterprise (₹24,999/mo)</option>
              </select>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-4 pt-2">
            
            {/* Days Inactive */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 dark:text-slate-300">Days Since Last Login</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formData.days_since_last_login} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={formData.days_since_last_login}
                onChange={(e) => handleInputChange('days_since_last_login', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* 30d Usage Change */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 dark:text-slate-300">30-Day Usage Change (%)</span>
                <span className={`font-mono font-bold ${formData.usage_change_30d_pct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formData.usage_change_30d_pct > 0 ? `+${formData.usage_change_30d_pct}%` : `${formData.usage_change_30d_pct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-80"
                max="60"
                value={formData.usage_change_30d_pct}
                onChange={(e) => handleInputChange('usage_change_30d_pct', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Feature Usage Score */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 dark:text-slate-300">Feature Adoption Score (1-10)</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formData.feature_usage_score} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.feature_usage_score}
                onChange={(e) => handleInputChange('feature_usage_score', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Customer Satisfaction Score */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 dark:text-slate-300">Customer Satisfaction (CSAT 1-5)</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formData.customer_satisfaction_score} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.customer_satisfaction_score}
                onChange={(e) => handleInputChange('customer_satisfaction_score', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Complaints & Support Tickets */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Support Tickets (Total)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={formData.support_tickets}
                  onChange={(e) => handleInputChange('support_tickets', Number(e.target.value))}
                  className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unresolved Complaints
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.complaints}
                  onChange={(e) => handleInputChange('complaints', Number(e.target.value))}
                  className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Payment Failures & Tenure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Failures (Last 3m)
                </label>
                <select
                  value={formData.payment_failures_last_3m}
                  onChange={(e) => handleInputChange('payment_failures_last_3m', Number(e.target.value))}
                  className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={0}>0 (Smooth Billing)</option>
                  <option value={1}>1 failure</option>
                  <option value={2}>2 failures</option>
                  <option value={3}>3 failures (High Friction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenure (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={formData.tenure_months}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    handleInputChange('tenure_months', t);
                    handleInputChange('total_spend', t * formData.monthly_spend);
                  }}
                  className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

          </div>

        </form>

        {/* Right Column: Live Model Output */}
        <div className="lg:col-span-6 space-y-6">
          
          {result ? (
            <>
              {/* Prediction Banner */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Prediction Output</span>
                    <RiskBadge level={result.risk_level} />
                  </div>
                  <SegmentBadge segment={result.segment} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-xs text-slate-400">Predicted Churn Probability</span>
                    <p className="text-3xl font-black text-rose-400 mt-1">
                      {(result.churn_probability * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400">Predicted Lifetime Value</span>
                    <p className="text-3xl font-black text-emerald-400 mt-1">
                      {formatCurrency(result.predicted_ltv)}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Estimated Revenue Exposure:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {formatCurrency(result.revenue_at_risk)}
                  </span>
                </div>
              </div>

              {/* Dynamic SHAP Explanation */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Real-Time TreeSHAP Attribution
                  </h3>
                </div>

                {/* Factors Increasing Risk */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Risk-Increasing Drivers (+)
                  </span>
                  {result.explanation?.increasing_churn_risk?.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-rose-100 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">{item.description}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600">+{item.impact.toFixed(3)}</span>
                    </div>
                  ))}
                </div>

                {/* Factors Reducing Risk */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Protective Drivers (-)
                  </span>
                  {result.explanation?.reducing_churn_risk?.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">{item.description}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">{item.impact.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Retention Playbook */}
              {result.recommendation && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Prescriptive Retention Playbook
                    </h3>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {result.recommendation.strategy_tier}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {result.recommendation.recommendation_title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {result.recommendation.recommendation_summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {result.recommendation.action_plan?.map((a, i) => (
                      <div key={i} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-2 text-xs">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{a.action}</span>
                          <p className="text-slate-500 text-[11px] mt-0.5">{a.impact}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 flex-shrink-0 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {a.timeline}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
              <SlidersHorizontal className="h-10 w-10 text-slate-300 mb-3" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ready for Live Scoring</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Tweak parameters on the left or select a preset scenario, then click <strong>"Run Instant ML Scoring"</strong> to evaluate the live model pipeline.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
