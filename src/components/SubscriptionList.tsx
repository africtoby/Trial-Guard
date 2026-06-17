/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Ban, ShieldAlert, Sparkles, Filter, Trash2, Calendar, ClipboardX, CreditCard, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subscription } from '../types';
import { formatDateForDisplay } from '../utils/date';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onCancelSubscription: (id: string) => void;
  onRemoveSubscription?: (id: string) => void; // Optional clean state-remover
}

export default function SubscriptionList({
  subscriptions,
  onCancelSubscription,
  onRemoveSubscription,
}: SubscriptionListProps) {
  const [filterType, setFilterType] = useState<'all' | 'trials' | 'paid' | 'canceled'>('all');

  const filteredSubs = subscriptions.filter((sub) => {
    if (filterType === 'all') return true;
    if (filterType === 'trials') return sub.isTrial && sub.status === 'active';
    if (filterType === 'paid') return !sub.isTrial && sub.status === 'active';
    if (filterType === 'canceled') return sub.status === 'canceled';
    return true;
  });

  // Calculate remaining days helper
  const getRemainingDays = (endDateStr: string): { days: number; text: string; urgent: boolean } => {
    if (!endDateStr) return { days: 0, text: 'No expiration', urgent: false };
    
    // Default system reference date is 2026-06-17
    const today = new Date('2026-06-17');
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: diffDays, text: `Expired ${Math.abs(diffDays)}d ago`, urgent: false };
    } else if (diffDays === 0) {
      return { days: 0, text: 'Expires today!', urgent: true };
    } else if (diffDays === 1) {
      return { days: 1, text: '1 day left!', urgent: true };
    } else {
      return { days: diffDays, text: `${diffDays} days left`, urgent: diffDays <= 3 };
    }
  };

  return (
    <div id="trialguard-list-container" className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          Tracked Services ({filteredSubs.length})
        </span>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
          {(['all', 'trials', 'paid', 'canceled'] as const).map((type) => (
            <button
              key={type}
              id={`filter-btn-${type}`}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Subscription cards / table list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredSubs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
              id="empty-list-placeholder"
            >
              <div className="p-3 bg-white rounded-full border border-slate-100 shadow-xs mb-3">
                <ClipboardX className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No subscriptions found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Create a entry using the form above to trigger live, reactive state calculations.
              </p>
            </motion.div>
          ) : (
            filteredSubs.map((sub) => {
              const remaining = getRemainingDays(sub.endDate);
              const isCanceled = sub.status === 'canceled';

              return (
                <motion.div
                  key={sub.id}
                  id={`sub-item-${sub.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 rounded-2xl border transition-all relative ${
                    isCanceled
                      ? 'bg-slate-50/40 border-slate-100 opacity-60'
                      : sub.isTrial
                      ? 'bg-indigo-50/10 border-indigo-100/50 hover:bg-indigo-50/20'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  } shadow-xs hover:shadow-sm`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Brand Info */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border uppercase font-mono font-black text-sm ${
                          isCanceled
                            ? 'bg-slate-100 border-slate-200 text-slate-400'
                            : sub.isTrial
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : 'bg-slate-900 border-slate-900 text-white'
                        }`}
                      >
                        {sub.name.slice(0, 2)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{sub.name}</h4>
                          
                          {/* Trial vs Paid Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                              isCanceled
                                ? 'bg-slate-200 border-slate-300 text-slate-600'
                                : sub.isTrial
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                : 'bg-green-50 border-green-100 text-green-700'
                            }`}
                          >
                            {isCanceled ? 'Canceled' : sub.isTrial ? 'Free Trial' : 'Paid'}
                          </span>

                          {/* Countdown Badge */}
                          {!isCanceled && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                                remaining.urgent
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {remaining.text}
                            </span>
                          )}
                        </div>

                        {/* Date metadata */}
                        <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>Started: <strong className="text-slate-600">{formatDateForDisplay(sub.startDate)}</strong></span>
                          <span className="text-slate-300">•</span>
                          <span>Ends: <strong className="text-slate-600">{formatDateForDisplay(sub.endDate)}</strong></span>
                          <span className="text-slate-300">•</span>
                          <span>Duration: <strong className="text-slate-600">{sub.durationDays} days</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Financial details & cancellation actions */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Monthly Equivalent
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          ${sub.cost.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.status === 'active' ? (
                          <button
                            id={`cancel-btn-${sub.id}`}
                            onClick={() => onCancelSubscription(sub.id)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer flex items-center gap-1.5 border border-rose-200/40"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold px-3 py-2 bg-slate-100 border border-slate-100 rounded-xl">
                            <ClipboardX className="w-3.5 h-3.5 text-slate-400" />
                            Inactive
                          </div>
                        )}

                        {onRemoveSubscription && (
                          <button
                            id={`remove-btn-${sub.id}`}
                            onClick={() => onRemoveSubscription(sub.id)}
                            className="p-2 border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
