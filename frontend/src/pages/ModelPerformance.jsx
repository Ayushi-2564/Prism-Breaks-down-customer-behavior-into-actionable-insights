import React, { useState, useEffect } from 'react';
import { 
  Binary, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  BarChart2, 
  Activity, 
  LineChart as LineChartIcon, 
  ShieldCheck, 
  Layers, 
  Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';

import { getModelMetrics } from '../services/api';

export const ModelPerformance = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getModelMetrics()
      .then((res) => {
        if (isMounted) {
          setMetrics(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load model diagnostics:", err);
          setError("Failed to fetch model metrics. Ensure ML training pipeline has run.");
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
        <p className="text-sm font-medium">Extracting model validation curves, confusion matrices, and SHAP importances...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
        <h4 className="font-bold mb-1">Model Diagnostics Unavailable</h4>
        <p>{error || "No model metadata found."}</p>
      </div>
    );
  }

  const churnMetrics = metrics.churn_metrics || {};
  const ltvMetrics = metrics.ltv_metrics || {};
  const cm = churnMetrics.confusion_matrix || { true_negative: 0, false_positive: 0, false_negative: 0, true_positive: 0, total: 1 };
  const comparison = metrics.churn_comparison || {};
  const globalImportance = metrics.global_feature_importance || [];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Machine Learning Pipeline & Model Diagnostics
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {metrics.best_churn_model_name || "Production Model"}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Rigorous out-of-sample evaluation: Classification metrics, ROC/PR curves, Confusion Matrix, TreeSHAP global importances, and LTV regression diagnostics.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ROC-AUC</span>
          <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {churnMetrics.roc_auc}
          </p>
          <span className="text-[10px] text-slate-400">Rank discrimination</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recall (Sensitivity)</span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {(churnMetrics.recall * 100).toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-400">Churners identified</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Precision</span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {(churnMetrics.precision * 100).toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-400">Positive accuracy</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">F1-Score</span>
          <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {churnMetrics.f1_score}
          </p>
          <span className="text-[10px] text-slate-400">Harmonic mean</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">LTV R² Score</span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {ltvMetrics.r2_score}
          </p>
          <span className="text-[10px] text-slate-400">Variance explained</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">LTV MAE</span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(ltvMetrics.mae)}
          </p>
          <span className="text-[10px] text-slate-400">Mean Abs Error</span>
        </div>

      </div>

      {/* Model Comparison Table */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Model Benchmark & Selection Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated on 20% holdout test set with balanced class weights and stratified sampling
            </p>
          </div>
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-50 dark:bg-slate-800/40">
              <tr>
                <th className="py-2.5 px-4">Model Architecture</th>
                <th className="py-2.5 px-4 text-right">Accuracy</th>
                <th className="py-2.5 px-4 text-right">Precision</th>
                <th className="py-2.5 px-4 text-right">Recall (Churners)</th>
                <th className="py-2.5 px-4 text-right">F1-Score</th>
                <th className="py-2.5 px-4 text-right">ROC-AUC</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {Object.entries(comparison).map(([modelName, m], idx) => {
                const isSelected = modelName === metrics.best_churn_model_name;
                return (
                  <tr key={idx} className={isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-bold' : ''}>
                    <td className="py-3 px-4 text-slate-900 dark:text-white">
                      {modelName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {(m.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {(m.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {(m.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {m.f1_score}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400">
                      {m.roc_auc}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                          SELECTED
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          BENCHMARK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Confusion Matrix & ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Confusion Matrix Heatmap */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Confusion Matrix
              </h3>
              <p className="text-xs text-slate-500">Holdout evaluation sample (N = {cm.total})</p>
            </div>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {/* True Negative */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase">
                True Negative (TN)
              </span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {cm.true_negative}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Correctly identified retained accounts</p>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-center">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase">
                False Positive (FP)
              </span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {cm.false_positive}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Retained flagged as churners (Type I)</p>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-center">
              <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase">
                False Negative (FN)
              </span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
                {cm.false_negative}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Missed churners (Costly Type II error)</p>
            </div>

            {/* True Positive */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-center">
              <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase">
                True Positive (TP)
              </span>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
                {cm.true_positive}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Successfully caught churners</p>
            </div>
          </div>
        </div>

        {/* ROC & PR Curves */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Receiver Operating Characteristic (ROC Curve)
              </h3>
              <p className="text-xs text-slate-500">True Positive Rate vs. False Positive Rate (AUC = {churnMetrics.roc_auc})</p>
            </div>
            <LineChartIcon className="h-4 w-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnMetrics.roc_curve || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="fpr" tick={{ fontSize: 11 }} label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="tpr" tick={{ fontSize: 11 }} label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={(val) => [val, 'Rate']} />
                <Line type="monotone" dataKey="tpr" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Model ROC" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Global SHAP Feature Importance */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Global Feature Importance (TreeSHAP Mean |SHAP|)
            </h3>
            <p className="text-xs text-slate-500">
              Ranking top behavioral, financial, and service factors governing customer churn risk
            </p>
          </div>
          <BarChart2 className="h-4 w-4 text-slate-400" />
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={globalImportance} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={160} />
              <Tooltip formatter={(val) => [`${val} mean |SHAP|`, 'Impact']} />
              <Bar dataKey="importance" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Methodology & Governance Notes */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white space-y-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Model Governance & Validation Methodology
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <h4 className="font-bold text-indigo-300 mb-1">1. Class Imbalance & Evaluation Objective</h4>
            <p>
              In SaaS churn prediction, class distribution is naturally skewed (~9% churn rate). An uncalibrated model predicting all negative gains high accuracy while missing at-risk accounts. The objective function prioritizes <strong>Recall ({churnMetrics.recall * 100}%)</strong> and <strong>ROC-AUC ({churnMetrics.roc_auc})</strong> to minimize Type II errors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <h4 className="font-bold text-indigo-300 mb-1">2. Strict Temporal Observation Cutoff</h4>
            <p>
              Features are extracted exclusively from the pre-prediction observation window (e.g. 30-day usage velocity, 90-day payment failures). Post-event attributes (such as cancellation reasons or post-churn tickets) are excluded to prevent target leakage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <h4 className="font-bold text-indigo-300 mb-1">3. Game-Theoretic SHAP Attributions</h4>
            <p>
              TreeSHAP computes exact Shapley values based on marginal contributions across feature subsets in polynomial time. This provides mathematical consistency for both <strong>Global Feature Importance</strong> and <strong>Local Customer Waterfall Explanations</strong>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
