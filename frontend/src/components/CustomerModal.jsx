import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Send, 
  Mail, 
  PhoneCall, 
  Award,
  Sparkles,
  DollarSign,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import { RiskBadge, SegmentBadge } from './RiskBadge';
import { getCustomerExplanation, getCustomerRecommendation } from '../services/api';

export const CustomerModal = ({ customer, onClose }) => {
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation' | 'recommendation' | 'diagnostics'
  const [explanation, setExplanation] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customer) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getCustomerExplanation(customer.customer_id),
      getCustomerRecommendation(customer.customer_id)
    ])
      .then(([expData, recData]) => {
        if (isMounted) {
          setExplanation(expData);
          setRecommendation(recData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load customer deep dive:", err);
          setError("Failed to load real-time SHAP explanation.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [customer]);

  if (!customer) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {customer.name}
              </h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {customer.customer_id}
              </span>
              <RiskBadge level={customer.risk_level} />
              <SegmentBadge segment={customer.segment} />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {customer.email} • {customer.subscription_plan} Plan • {customer.location} • Joined {customer.signup_date || `${customer.tenure_months} months ago`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-900 text-white border-b border-slate-800">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Churn Probability</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">
                {(customer.churn_probability * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">risk</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Predicted LTV</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrency(customer.predicted_ltv)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Revenue at Risk</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-amber-400">
                {formatCurrency(customer.revenue_at_risk)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Monthly Spend</span>
            <div className="mt-1">
              <span className="text-2xl font-bold text-slate-200">
                {formatCurrency(customer.monthly_spend)}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'explanation'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            SHAP Explainability (Why at Risk?)
          </button>

          <button
            onClick={() => setActiveTab('recommendation')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'recommendation'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Award className="h-4 w-4" />
            Prescriptive Retention Action
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'diagnostics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Activity className="h-4 w-4" />
            Behavioral Diagnostics
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
              <p className="text-sm">Calculating TreeSHAP feature attributions...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-200">
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: SHAP EXPLANATION */}
              {activeTab === 'explanation' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                    <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                      <strong>TreeSHAP Attribution Engine:</strong> Feature contributions mathematically explain the delta between the baseline population churn log-odds and this customer's predicted probability ({(customer.churn_probability * 100).toFixed(1)}%).
                    </p>
                  </div>

                  {/* Positive Risk Contributors */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-rose-600" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Key Factors Increasing Churn Risk
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {explanation?.increasing_churn_risk?.length > 0 ? (
                        explanation.increasing_churn_risk.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                                  {item.label}
                                </span>
                                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                                  +{item.impact.toFixed(3)} SHAP
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {item.description}
                              </p>
                            </div>
                            <div className="hidden sm:block text-right">
                              <span className="text-xs text-slate-400">Observed Value</span>
                              <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                                {String(item.raw_value)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No significant risk increasing factors identified.</p>
                      )}
                    </div>
                  </div>

                  {/* Negative Risk Contributors */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Protective Factors Reducing Churn Risk
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {explanation?.reducing_churn_risk?.length > 0 ? (
                        explanation.reducing_churn_risk.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                                  {item.label}
                                </span>
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                  {item.impact.toFixed(3)} SHAP
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {item.description}
                              </p>
                            </div>
                            <div className="hidden sm:block text-right">
                              <span className="text-xs text-slate-400">Observed Value</span>
                              <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                                {String(item.raw_value)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No significant protective factors identified.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RECOMMENDATION PLAN */}
              {activeTab === 'recommendation' && recommendation && (
                <div className="space-y-6">
                  {/* Strategy Header */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {recommendation.strategy_tier}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Segment: {recommendation.segment}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                      {recommendation.recommendation_title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {recommendation.recommendation_summary}
                    </p>
                  </div>

                  {/* Business Rationale */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Business Rationale
                    </h4>
                    <ul className="space-y-1.5">
                      {recommendation.rationale.map((r, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Plan Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Prescriptive Action Plan
                    </h4>
                    <div className="space-y-3">
                      {recommendation.action_plan.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {item.action}
                                </h5>
                              </div>
                              <p className="mt-1.5 ml-7 text-xs text-slate-500 dark:text-slate-400">
                                <strong>Impact:</strong> {item.impact}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                <Clock className="h-3 w-3" />
                                {item.timeline}
                              </span>
                              <p className="mt-1 text-[11px] text-slate-400 font-mono">
                                {item.channel}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DIAGNOSTICS */}
              {activeTab === 'diagnostics' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Days Since Last Active</span>
                    <p className={`text-lg font-bold mt-1 ${customer.days_since_last_login > 14 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {customer.days_since_last_login} days
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Feature Usage Score</span>
                    <p className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                      {customer.feature_usage_score} / 10
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Satisfaction (CSAT)</span>
                    <p className={`text-lg font-bold mt-1 ${customer.customer_satisfaction_score <= 2 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {customer.customer_satisfaction_score} / 5
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Support Tickets & Complaints</span>
                    <p className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                      {customer.support_tickets} tickets ({customer.complaints} complaints)
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Avg Resolution Time</span>
                    <p className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                      {customer.avg_resolution_time_hours} hrs
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Payment Failures (3m)</span>
                    <p className={`text-lg font-bold mt-1 ${customer.payment_failures_last_3m > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {customer.payment_failures_last_3m} failures
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">30-Day Usage Trend</span>
                    <p className={`text-lg font-bold mt-1 ${customer.usage_change_30d_pct < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {customer.usage_change_30d_pct > 0 ? `+${customer.usage_change_30d_pct}%` : `${customer.usage_change_30d_pct}%`}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Weekly Active Hours</span>
                    <p className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                      {((customer.sessions_per_week * customer.avg_session_duration_mins) / 60.0).toFixed(1)} hrs/wk
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs text-slate-500">Marketing Email Open Rate</span>
                    <p className="text-lg font-bold mt-1 text-slate-900 dark:text-white">
                      {customer.marketing_emails_opened_pct}%
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
