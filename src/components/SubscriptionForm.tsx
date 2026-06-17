/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, Clock, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subscription } from '../types';
import { calculateEndDate } from '../utils/date';

interface SubscriptionFormProps {
  onAddSubscription: (sub: Omit<Subscription, 'id' | 'endDate'>) => void;
}

export default function SubscriptionForm({ onAddSubscription }: SubscriptionFormProps) {
  // Input states
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [isTrial, setIsTrial] = useState(false);
  
  // Set default start date to today (2026-06-17)
  const [startDate, setStartDate] = useState('2026-06-17');
  const [durationDays, setDurationDays] = useState('30');
  
  // Quick presets for duration
  const presets = [
    { label: '7 Days', val: 7 },
    { label: '14 Days', val: 14 },
    { label: '30 Days', val: 30 },
    { label: '1 Year', val: 365 },
  ];

  // Helper inputs for quick brand buttons
  const brandSuggestions = [
    { name: 'Netflix', cost: 15.49, isTrial: false },
    { name: 'Spotify', cost: 11.99, isTrial: true, duration: 30 },
    { name: 'Claude Pro', cost: 20.00, isTrial: false },
    { name: 'GitHub Copilot', cost: 10.00, isTrial: true, duration: 30 },
  ];

  // Live validation & endpoint previews
  const [calculatedEnd, setCalculatedEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const days = parseInt(durationDays, 10);
    if (startDate && !isNaN(days) && days >= 0) {
      setCalculatedEnd(calculateEndDate(startDate, days));
    } else {
      setCalculatedEnd('');
    }
  }, [startDate, durationDays]);

  const handleApplyPresetBrand = (brand: typeof brandSuggestions[0]) => {
    setName(brand.name);
    setCost(brand.cost.toString());
    setIsTrial(brand.isTrial);
    if (brand.duration) {
      setDurationDays(brand.duration.toString());
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a subscription or service name.');
      return;
    }

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      setError('Please enter a valid non-negative cost.');
      return;
    }

    const parsedDuration = parseInt(durationDays, 10);
    if (isNaN(parsedDuration) || parsedDuration < 0) {
      setError('Please enter a valid duration in days.');
      return;
    }

    if (!startDate) {
      setError('Please select a start date.');
      return;
    }

    // Call callback
    onAddSubscription({
      name: name.trim(),
      cost: parsedCost,
      isTrial,
      startDate,
      durationDays: parsedDuration,
      status: 'active'
    });

    // Reset some inputs with sleek UX animation triggers
    setName('');
    setCost('');
    setError(null);
  };

  return (
    <div id="trialguard-form-container" className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 id="form-heading" className="text-lg font-bold text-slate-950 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 block">
              <Plus className="w-5 h-5" />
            </span>
            Track New Subscription
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Calculate spend thresholds and dynamic trial expirations.
          </p>
        </div>
      </div>

      {/* Brand Suggestions Bar */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Quick-Fill Suggestions
        </label>
        <div className="flex flex-wrap gap-2">
          {brandSuggestions.map((brand) => (
            <button
              key={brand.name}
              type="button"
              id={`brand-tag-${brand.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleApplyPresetBrand(brand)}
              className="px-3 py-1.5 rounded-lg border border-slate-100 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error notification */}
        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2"
              id="form-error-banner"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name and cost row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7">
            <label htmlFor="sub-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Service Name
            </label>
            <input
              id="sub-name"
              type="text"
              placeholder="e.g. Netflix, AWS Cloud, Adobe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="md:col-span-5">
            <label htmlFor="sub-cost" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cost per Month
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 select-none">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="sub-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cost}
                onChange={(e) => {
                  setCost(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Trial check and dates row */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-slate-800">Free Trial Enrollment</span>
              <span className="text-xs text-slate-400">Costs are listed as "At-Risk Capital" until converted.</span>
            </div>
            <button
              type="button"
              id="trial-toggle-button"
              onClick={() => setIsTrial(!isTrial)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isTrial ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isTrial ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sub-start-date" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
              </label>
              <input
                id="sub-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="sub-duration" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration (Days)
              </label>
              <input
                id="sub-duration"
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => {
                  setDurationDays(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Presets and target review card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-900">Presets:</span>
            <div className="flex gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  id={`preset-btn-${preset.val}`}
                  onClick={() => setDurationDays(preset.val.toString())}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 shadow-xs transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right flex items-center gap-2 md:justify-end">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Calculated End-Date
            </span>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-white text-slate-800 rounded-md border border-slate-100 shadow-xs">
              {calculatedEnd || 'N/A'}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          id="btn-add-subscription"
          className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Add Subscription State
        </button>
      </form>
    </div>
  );
}
