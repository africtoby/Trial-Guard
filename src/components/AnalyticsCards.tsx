/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CreditCard, ShieldAlert, TrendingUp, AlertTriangle, HelpCircle } from 'lucide-react';
import { Subscription } from '../types';

interface AnalyticsCardsProps {
  guaranteedMonthlySpend: number;
  atRiskCapital: number;
  subscriptions: Subscription[];
}

export default function AnalyticsCards({
  guaranteedMonthlySpend,
  atRiskCapital,
  subscriptions,
}: AnalyticsCardsProps) {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const trialCount = activeSubs.filter((s) => s.isTrial).length;
  const paidCount = activeSubs.filter((s) => !s.isTrial).length;

  // Percentage calculations
  const totalCombined = guaranteedMonthlySpend + atRiskCapital;
  const trialPercentage = totalCombined > 0 ? (atRiskCapital / totalCombined) * 100 : 0;
  const paidPercentage = totalCombined > 0 ? (guaranteedMonthlySpend / totalCombined) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="analytics-grid">
      {/* Guaranteed Monthly Spend Card */}
      <div
        id="card-guaranteed-spend"
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Guaranteed Monthly Spend
            </span>
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span id="sum-guaranteed-spend" className="text-3xl font-black text-slate-950">
              ${guaranteedMonthlySpend.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ month</span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Sum of all <strong className="text-slate-800 font-semibold">{paidCount}</strong> active, paid recurring commitments.
          </p>
        </div>

        {/* Visual progress bar representation */}
        <div className="mt-6 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>Spend Share</span>
            <span>{paidPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-500"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* At-Risk Capital Card */}
      <div
        id="card-at-risk-capital"
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              At-Risk Trial Capital
            </span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span id="sum-at-risk-capital" className="text-3xl font-black text-orange-600">
              ${atRiskCapital.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-orange-400">/ trial phase</span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Active trials (<strong className="text-slate-800 font-semibold">{trialCount}</strong> items) that will auto-transition to paid bills if not canceled.
          </p>
        </div>

        {/* Visual progress bar representation */}
        <div className="mt-6 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-orange-500 uppercase">
            <span>Risk Index</span>
            <span>{trialPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-orange-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${trialPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
