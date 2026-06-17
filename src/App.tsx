/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Subscription } from './types';
import { calculateEndDate, formatFriendlyDate, getDaysRemaining } from './utils';
import { 
  PlusCircle, 
  Trash2, 
  Check, 
  X,
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  Clock, 
  RotateCcw, 
  Info,
  Layers,
  Search,
  Filter,
  ExternalLink
} from 'lucide-react';

// Real-world account cancellation/billing directory for loose-matching service names
const CANCELLATION_DIRECTORY: Record<string, string> = {
  netflix: 'https://www.netflix.com/cancelplan',
  adobe: 'https://account.adobe.com/plans',
  figma: 'https://www.figma.com/settings',
  github: 'https://github.com/settings/billing',
  apple: 'https://support.apple.com/HT202039',
  spotify: 'https://www.spotify.com/account/subscription/',
  amazon: 'https://www.amazon.com/mc/pipelines/cancellation',
  canva: 'https://www.canva.com/settings/billing-and-teams',
};

// Case-insensitive substring matching against the user-inputted name
const getCancellationUrl = (name: string): string | null => {
  const norm = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(CANCELLATION_DIRECTORY)) {
    if (norm.includes(key)) {
      return url;
    }
  }
  return null;
};

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);

  // 1. Reactive State - Initialized as empty (no mock data)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('trialguard_data');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist state to client-side localStorage to protect user entries
  useEffect(() => {
    localStorage.setItem('trialguard_data', JSON.stringify(subscriptions));
  }, [subscriptions]);

  // Form State
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [isTrial, setIsTrial] = useState(false);
  const [startDate, setStartDate] = useState('2026-06-17'); // Synced with mock current year
  const [durationDays, setDurationDays] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'canceled' | 'trials' | 'paid'>('all');

  // Success Feedback Messages state
  const [formError, setFormError] = useState('');

  // 2. Memoized Live Calculated Totals
  // 'Guaranteed Monthly Spend': Sum of all active non-trial costs
  const guaranteedMonthlySpend = useMemo(() => {
    return subscriptions
      .filter((sub) => sub.status === 'active' && !sub.isTrial)
      .reduce((sum, sub) => sum + sub.cost, 0);
  }, [subscriptions]);

  // 'At-Risk Capital': Sum of all active trial costs
  const atRiskCapital = useMemo(() => {
    return subscriptions
      .filter((sub) => sub.status === 'active' && sub.isTrial)
      .reduce((sum, sub) => sum + sub.cost, 0);
  }, [subscriptions]);

  // Forecast end-date dynamically while entering start date & duration
  const liveEndDateForecast = useMemo(() => {
    const duration = parseInt(durationDays, 10);
    if (!startDate || isNaN(duration)) return 'Please input starting date and cycle';
    return calculateEndDate(startDate, duration);
  }, [startDate, durationDays]);

  // 3. Core Fully Functional Methods
  const addSubscription = (newSub: Omit<Subscription, 'id' | 'endDate'>) => {
    const calculatedEnd = calculateEndDate(newSub.startDate, newSub.durationDays);
    const completedSub: Subscription = {
      ...newSub,
      id: `tg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      endDate: calculatedEnd,
    };
    setSubscriptions((prev) => [completedSub, ...prev]);
  };

  const cancelSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'canceled' as const } : sub))
    );
  };

  const reactivateSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'active' as const } : sub))
    );
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
  };

  // Reset demo storage helper
  const clearAllSubscriptions = () => {
    if (window.confirm('Are you sure you want to clear all tracked items and restart with a clean state?')) {
      setSubscriptions([]);
    }
  };

  // Generate and download a frontend-only .ics reminders package for push notifications
  const downloadCalendarReminder = (sub: Subscription) => {
    const cleanDate = sub.endDate.replace(/-/g, ''); // 'YYYYMMDD'
    const dtStart = `${cleanDate}T090000`; // 9:00 AM local
    const dtEnd = `${cleanDate}T093000`; // Ends at 9:30 AM local

    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const summary = `Cancel ${sub.name} Trial`;
    const description = `This is an automated reminder from TrialGuard to cancel your ${sub.name} trial before the billing converts. Current cost: $${sub.cost.toFixed(2)}/month.`;

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TrialGuard//Subscription Sentinel//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:tg-reminder-${sub.id}-${Date.now()}@trialguard.app`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT48H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: 48 hours remaining to cancel ${sub.name} trial!`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: 24 hours remaining to cancel ${sub.name} trial!`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT0H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Urgent: Cancel your ${sub.name} subscription now!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sub.name}-reminder.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Form Submission Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a subscription or free trial name.');
      return;
    }

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      setFormError('Please enter a valid numeric cost (e.g. 14.99).');
      return;
    }

    const parsedDuration = parseInt(durationDays, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setFormError('Please enter a valid activation duration in days (minimum 1).');
      return;
    }

    addSubscription({
      name: name.trim(),
      cost: parsedCost,
      isTrial,
      startDate,
      durationDays: parsedDuration,
      status: 'active',
    });

    // Reset Form (Except StartDate & Duration to simplify quick inserts)
    setName('');
    setCost('');
    setIsTrial(false);
  };

  // Filter & Search Logic
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Search matching
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status tab matching
      let matchesFilter = true;
      if (statusFilter === 'active') {
        matchesFilter = sub.status === 'active';
      } else if (statusFilter === 'canceled') {
        matchesFilter = sub.status === 'canceled';
      } else if (statusFilter === 'trials') {
        matchesFilter = sub.isTrial;
      } else if (statusFilter === 'paid') {
        matchesFilter = !sub.isTrial;
      }

      return matchesSearch && matchesFilter;
    });
  }, [subscriptions, searchQuery, statusFilter]);

  // Helper to compute hours remaining until target date (at 00:00:00)
  const getHoursRemaining = (endDateStr: string): number => {
    if (!endDateStr) return 0;
    const parts = endDateStr.split('-');
    if (parts.length !== 3) return 0;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const end = new Date(year, month, day);
    end.setHours(0, 0, 0, 0);
    
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60));
  };

  // Danger Zone items: active trials with <= 48 hours remaining
  const dangerZoneItems = useMemo(() => {
    return subscriptions.filter((sub) => {
      if (sub.status !== 'active' || !sub.isTrial) return false;
      const hours = getHoursRemaining(sub.endDate);
      return hours <= 48;
    });
  }, [subscriptions]);

  if (!hasEntered) {
    return (
      <div className="min-h-screen bg-[#e9d5ff] font-sans antialiased text-black flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-[10%] left-[15%] w-64 h-64 rounded-full bg-white/25 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[15%] w-80 h-80 rounded-full bg-pink-300/25 blur-3xl pointer-events-none"></div>

        <div id="landing-card" className="max-w-xl w-full bg-white border-[3px] border-black p-8 sm:p-12 shadow-[10px_10px_0px_#ec4899] text-center space-y-8 relative">
          
          {/* Floating Geometric Brutalist Accents */}
          {/* Shape 1: Bright yellow star/shape */}
          <div className="absolute -left-10 bottom-8 h-14 w-14 rounded-full bg-[#fde047] border-[3px] border-black shadow-[4px_4px_0px_#000000] hidden sm:flex items-center justify-center font-mono font-black text-xl select-none rotate-12">
            ✦
          </div>

          {/* Shape 2: Mint green square with text */}
          <div className="absolute -right-10 top-10 h-14 w-14 bg-[#6ee7b7] border-[3px] border-black shadow-[4px_4px_0px_#000000] rotate-12 hidden sm:flex items-center justify-center font-mono font-black text-xs select-none">
            SAFE
          </div>

          {/* Shape 3: Electric blue diamond/square */}
          <div className="absolute -right-12 bottom-4 h-10 w-10 bg-[#3b82f6] border-[3px] border-black shadow-[3px_3px_0px_#000000] -rotate-12 hidden sm:block"></div>

          {/* Aggressive orange accent badge */}
          <div className="absolute -top-3.5 -left-3.5 px-3 py-1 bg-[#fb923c] text-white text-[10px] uppercase font-mono font-black border-[2px] border-black shadow-[2px_2px_0px_#000000]">
            NO SIGN-UP REQUIRED
          </div>
          
          <div className="inline-flex p-4 bg-black text-[#fef08a] border-[3px] border-black shadow-[4px_4px_0px_#000000]">
            <ShieldCheckIcon className="w-12 h-12" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-black uppercase italic leading-none">
              TRIAL GUARD
            </h1>
            <p className="text-sm sm:text-base font-bold text-gray-600 tracking-wider leading-relaxed px-2">
              Track. Remind. Cancel.
            </p>
          </div>
          
          <button
            id="btn-enter-dashboard"
            type="button"
            onClick={() => setHasEntered(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#bef264] hover:bg-[#a3e635] text-black border-[3px] border-black font-black text-sm uppercase tracking-widest shadow-[6px_6px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0px_#000000] transition-all duration-75 cursor-pointer focus:outline-hidden"
          >
            ENTER DASHBOARD ➔
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e9d5ff] font-sans antialiased text-black pb-20">
      
      {/* Top Header Room with Brutalist Bottom Border */}
      <header id="app-header" className="sticky top-0 bg-[#fef08a] border-b-[3px] border-black z-40 shadow-[0_4px_0px_#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo Lockup (Top Left) */}
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-black text-[#fef08a] border-[3px] border-black shadow-[2px_2px_0px_#000000]">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-black block uppercase font-display leading-none">
              Trial Guard
            </span>
          </div>
          
          {/* Action Button (Top Right) */}
          <div>
            {subscriptions.length > 0 && (
              <button 
                id="btn-clear-all"
                onClick={clearAllSubscriptions}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ffedd5] border-[3px] border-black text-xs font-black text-black uppercase shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all duration-75 cursor-pointer font-sans"
              >
                <RotateCcw className="w-3 h-3 shrink-0" />
                Reset Tracker
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Container Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Core Calculated Metrics Display */}
        <section id="metrics-dashboard" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Spend Total Box - pastel light blue (#bae6fd) */}
          <div 
            id="metric-guaranteed-spend" 
            className="bg-[#bae6fd] border-[3px] border-black py-3.5 px-4 shadow-[5px_5px_0px_#000000] relative overflow-hidden transition-all"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-black uppercase tracking-widest">Guaranteed Monthly Spend</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tracking-tight font-mono text-black">
                    ${guaranteedMonthlySpend.toFixed(2)}
                  </h3>
                  <span className="text-[10px] text-black/80 font-black uppercase">(Active standard paid)</span>
                </div>
              </div>
              <div className="p-1.5 bg-black text-white border-[3px] border-black shadow-[2px_2px_0px_#000000]">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* At-Risk Capital Box - stark, loud red (#ef4444) with white text */}
          <div 
            id="metric-at-risk-capital" 
            className="bg-[#ef4444] text-white border-[3px] border-black py-3.5 px-4 shadow-[5px_5px_0px_#000000] relative overflow-hidden transition-all"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">At-Risk Capital</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tracking-tight font-mono text-white">
                    ${atRiskCapital.toFixed(2)}
                  </h3>
                  <span className="text-[10px] text-white/95 font-black uppercase">(Active trial conversions)</span>
                </div>
              </div>
              <div className="p-1.5 bg-black text-white border-[3px] border-black shadow-[2px_2px_0px_#000000]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

        </section>

        {/* Workspace Dual Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Intake Panel */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Input Action Form */}
            <div className="bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_#3b82f6] rounded-none">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b-[3px] border-black">
                <PlusCircle className="w-6 h-6 text-black" />
                <h2 className="text-xl font-black text-black uppercase tracking-tight">Add Subscription</h2>
              </div>

              {formError && (
                <div id="form-error-alert" className="p-3 mb-5 bg-[#ffcbd1] border-[3px] border-black rounded-none text-xs font-bold text-black flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="subscription-form" onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name */}
                <div>
                  <label htmlFor="input-sub-name" className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                    Service Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="input-sub-name"
                    type="text"
                    required
                    placeholder="e.g. Netflix, Copilot, Adobe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f4f4f0] border-[3px] border-black rounded-none text-sm font-bold placeholder:text-slate-500 focus:outline-hidden focus:bg-[#fef08a] transition-all shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                {/* Grid row for Cost & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Cost */}
                  <div>
                    <label htmlFor="input-sub-cost" className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                      Cost ($ / mo) <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black font-black text-sm">
                        $
                      </div>
                      <input
                        id="input-sub-cost"
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        placeholder="14.99"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-[#f4f4f0] border-[3px] border-black rounded-none text-sm font-black focus:outline-hidden focus:bg-[#fef08a] transition-all font-mono shadow-[2px_2px_0px_#000000]"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label htmlFor="input-sub-duration" className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                      Cycle Days <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="input-sub-duration"
                      type="number"
                      required
                      min="1"
                      placeholder="30"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f4f4f0] border-[3px] border-black rounded-none text-sm font-black focus:outline-hidden focus:bg-[#fef08a] transition-all font-mono shadow-[2px_2px_0px_#000000]"
                    />
                  </div>

                </div>

                {/* Start Date */}
                <div>
                  <label htmlFor="input-sub-startdate" className="block text-xs font-black text-black uppercase tracking-widest mb-1.5">
                    Start Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="input-sub-startdate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f4f4f0] border-[3px] border-black rounded-none text-sm font-black focus:outline-hidden focus:bg-[#fef08a] transition-all font-mono shadow-[2px_2px_0px_#000000]"
                  />
                </div>

                {/* Free Trial Toggle - Stark Brutalist Styled */}
                <div className="p-4 bg-white border-[3px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-black text-black uppercase tracking-tight">Free Trial Enrollment</span>
                    <span className="block text-xs font-semibold text-slate-500">Unbilled trial phase</span>
                  </div>
                  <label htmlFor="input-sub-istrial" className="inline-flex relative items-center cursor-pointer select-none">
                    <input
                      id="input-sub-istrial"
                      type="checkbox"
                      checked={isTrial}
                      onChange={(e) => setIsTrial(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-[#f4f4f0] border-[3px] border-black peer-focus:outline-hidden rounded-none peer peer-checked:bg-[#fef08a] transition-all relative after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-black after:border-[2px] after:border-black after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                {/* Live Forecasting Sub-Card */}
                <div className="p-4 bg-black text-[#fef08a] border-[3px] border-black shadow-[4px_4px_0px_#000000] text-xs space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-white font-bold uppercase">
                    <span>Forecasted Expiry:</span>
                    <span id="live-end-date-preview" className="font-mono text-black font-black bg-[#fef08a] px-2 py-0.5 border-[2px] border-black">
                      {liveEndDateForecast ? formatFriendlyDate(liveEndDateForecast) : '--'}
                    </span>
                  </div>
                  <p className="text-slate-300">Live computation based automatically on start + cycle days.</p>
                </div>

                {/* Submit Action with press effect */}
                <button
                  id="btn-add-subscription"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#bef264] hover:bg-[#a3e635] text-black border-[3px] border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0px_#000000] transition-all duration-75 cursor-pointer focus:outline-hidden"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Subscription State
                </button>

              </form>
            </div>



          </div>

          {/* Right Column: Active Sentinel List */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Danger Zone Component */}
            {dangerZoneItems.length > 0 && (
              <div id="danger-zone" className="bg-[#ef4444] text-white border-[3px] border-black p-5 shadow-[6px_6px_0px_#000000] rounded-none space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b-[2px] border-black/30">
                  <AlertTriangle className="w-5 h-5 text-yellow-300 animate-pulse shrink-0" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white m-0">🚨 URGENT: DANGER ZONE</h2>
                </div>
                <div className="space-y-3">
                  {dangerZoneItems.map((sub) => {
                    const hours = getHoursRemaining(sub.endDate);
                    const countdownText = hours > 0 
                      ? `Expires in ${hours} hour${hours === 1 ? '' : 's'}!` 
                      : `Converting Today (Expired/Overdue)!`;
                    const cancellationUrl = getCancellationUrl(sub.name);
                    
                    return (
                      <div 
                        key={`dz-${sub.id}`} 
                        id={`dz-item-${sub.id}`}
                        className="bg-black text-white p-4 border-[2px] border-black shadow-[3px_3px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-none"
                      >
                        <div>
                          <span className="font-mono font-black text-sm uppercase block tracking-wide">{sub.name}</span>
                          <span className="text-[11px] font-black text-yellow-300 uppercase tracking-widest block mt-1">
                            {countdownText}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            id={`dz-btn-cancel-${sub.id}`}
                            onClick={() => cancelSubscription(sub.id)}
                            className="px-3 py-1.5 bg-[#ffcbd1] hover:bg-[#ffa3ad] text-black border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5 shrink-0" />
                            Mark Canceled
                          </button>
                          
                          {cancellationUrl && (
                            <a
                              href={cancellationUrl}
                              id={`dz-lnk-cancel-${sub.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#bae6fd] hover:bg-[#7dd3fc] text-black border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              Cancel Online!
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* List Header, Search, Navigation Filters */}
            <div id="subscriptions-section" className="bg-white border-[3px] border-black p-6 shadow-[6px_6px_0px_#ec4899] rounded-none">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b-[3px] border-black">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-6 h-6 text-black" />
                  <h2 className="text-lg font-black text-black uppercase tracking-tight">
                    Monitored watchlist ({filteredSubscriptions.length} of {subscriptions.length})
                  </h2>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search watch list..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 pl-9 pr-3 py-2 bg-[#f4f4f0] border-[2px] border-black rounded-none text-xs font-black focus:outline-hidden focus:bg-[#fef08a] transition-all"
                  />
                </div>
              </div>

              {/* Advanced Filter Pills */}
              <div id="filter-tabs" className="flex flex-wrap gap-2.5 mb-6">
                {[
                  { id: 'all', label: 'All Entries' },
                  { id: 'active', label: 'Active Coverage' },
                  { id: 'canceled', label: 'Canceled Logs' },
                  { id: 'trials', label: 'Trials Only' },
                  { id: 'paid', label: 'Standard Paid' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={`tab-filter-${tab.id}`}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-2 border-[2px] border-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_#000000] ${
                      statusFilter === tab.id
                        ? 'bg-black text-[#fef08a]'
                        : 'bg-white text-black hover:bg-[#f4f4f0]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Subscriptions Reactive List Output */}
              <div className="space-y-6">
                {filteredSubscriptions.length === 0 ? (
                  /* Empty State View */
                  <div id="watchlist-empty-state" className="border-[3px] border-dashed border-black rounded-none p-12 text-center bg-[#f4f4f0]">
                    <div className="inline-flex p-4 bg-white border-[3px] border-black text-black rounded-none mb-4 shadow-[4px_4px_0px_#000000]">
                      <Layers className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-black uppercase">No monitored channels</h4>
                    <p className="text-xs text-slate-700 font-semibold mt-2 max-w-sm mx-auto leading-relaxed">
                      {subscriptions.length === 0
                        ? 'Your sentinel watch list is currently empty. Input subscription attributes using the Left Control Panel to monitor values dynamically.'
                        : 'No entries match your search pattern or active filter parameters.'}
                    </p>
                  </div>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const daysRemaining = getDaysRemaining(sub.endDate);
                    const isOverdue = daysRemaining < 0;
                    const cancellationUrl = getCancellationUrl(sub.name);

                    return (
                      <div
                        key={sub.id}
                        id={`sub-item-${sub.id}`}
                        className={`border-[3px] border-black p-5 transition-all shadow-[6px_6px_0px_#000000] relative rounded-none ${
                          sub.status === 'canceled'
                            ? 'bg-[#f1f5f9] opacity-80'
                            : sub.isTrial
                            ? 'bg-[#fef9c3]' // Pale yellow for active trials
                            : 'bg-[#ecfdf5]' // Pale green for standard active paid
                        }`}
                      >
                        
                        {/* Title Row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-lg text-black uppercase block leading-tight">{sub.name}</span>
                              
                              {/* Status Pills */}
                              {sub.status === 'canceled' ? (
                                <span className="inline-flex items-center px-2 py-1 text-[10px] uppercase font-black bg-white text-black border-[2px] border-black shadow-[1px_1px_0px_#000000]">
                                  Canceled
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-[10px] uppercase font-black bg-[#bbf7d0] text-black border-[2px] border-black shadow-[2px_2px_0px_#000000]">
                                  Active Watch
                                </span>
                              )}

                              {/* Trial Indicator */}
                              {sub.isTrial && (
                                <span className="inline-flex items-center px-2 py-1 text-[10px] uppercase font-black bg-black text-white border-[2px] border-black shadow-[2px_2px_0px_#ef4444]">
                                  Free Trial
                                </span>
                              )}
                            </div>

                            {/* Core Parameters Row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs font-black text-black">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-black shrink-0" />
                                START: {formatFriendlyDate(sub.startDate)}
                              </span>
                              <span className="text-black font-black">•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-black shrink-0" />
                                TERM: {sub.durationDays} DAYS
                              </span>
                              <span className="text-black font-black">•</span>
                              <span className="flex items-center gap-1 bg-white border-[1px] border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000000]">
                                RENEW/END: {formatFriendlyDate(sub.endDate)}
                              </span>
                            </div>
                          </div>

                          {/* Monetary Section */}
                          <div className="text-left sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-1 border-t-2 sm:border-t-0 border-black pt-3 sm:pt-0 shrink-0">
                            <div>
                              <span className="text-3xl font-black font-mono tracking-tight text-black block">
                                ${sub.cost.toFixed(2)}
                              </span>
                              <span className="text-[9px] text-black font-black uppercase tracking-wider block">
                                Monthly commitment
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Calendar Threshold Counter Banner (Not shown if canceled) */}
                        {sub.status === 'active' && (
                          <div className={`mt-4 py-2 px-3 text-xs font-black uppercase border-[2px] border-black shadow-[2px_2px_0px_#000000] flex items-center justify-between ${
                            sub.isTrial 
                              ? isOverdue
                                ? 'bg-[#ffccd0] text-black'
                                : daysRemaining <= 3
                                ? 'bg-[#ef4444] text-white animate-pulse'
                                : 'bg-[#ffed99] text-black'
                              : 'bg-[#e0f1fe] text-black'
                          }`}>
                            <span className="flex items-center gap-1.5">
                              {sub.isTrial ? (
                                <AlertTriangle className="w-4 h-4 shrink-0 text-black" />
                              ) : (
                                <Check className="w-4 h-4 shrink-0 text-black" />
                              )}
                              <span>
                                {sub.isTrial 
                                  ? isOverdue 
                                    ? `Trial Expiry Overdue (${Math.abs(daysRemaining)}d ago)` 
                                    : `Trial conversion in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
                                  : `Next standard renewal in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
                                }
                              </span>
                            </span>
                            <span className="font-mono text-[9px] bg-black text-[#fef08a] px-1.5 py-0.5 border-[1px] border-black hidden sm:inline">
                              {sub.isTrial ? 'at-risk' : 'renewing'}
                            </span>
                          </div>
                        )}

                        {/* Control Actions Row with press down action */}
                        <div className="mt-5 pt-3.5 border-t-2 border-black flex items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {sub.status === 'active' ? (
                              <button
                                type="button"
                                id={`btn-cancel-${sub.id}`}
                                onClick={() => cancelSubscription(sub.id)}
                                className="px-3.5 py-2 bg-[#ffcbd1] hover:bg-[#ffa3ad] text-black border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5 shrink-0 text-black" />
                                Cancel Subscription
                              </button>
                            ) : (
                              <button
                                type="button"
                                id={`btn-reactivate-${sub.id}`}
                                onClick={() => reactivateSubscription(sub.id)}
                                className="px-3.5 py-2 bg-[#bbf7d0] hover:bg-[#86efac] text-black border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5 shrink-0 text-black" />
                                Reactivate
                              </button>
                            )}

                            {/* Smart Cancellation External Link Action */}
                            {cancellationUrl && (
                              <a
                                href={cancellationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-[#bae6fd] hover:bg-[#7dd3fc] text-black border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-black" />
                                Cancel Online
                              </a>
                            )}

                            {/* Neo-Brutalist Calendar Sync Action */}
                            {sub.status === 'active' && (
                              <button
                                type="button"
                                id={`btn-sync-reminders-${sub.id}`}
                                onClick={() => downloadCalendarReminder(sub)}
                                className="px-3.5 py-2 bg-white text-black border-[3px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                📅 Sync Reminders
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            id={`btn-delete-${sub.id}`}
                            onClick={() => deleteSubscription(sub.id)}
                            className="p-2 bg-white border-[2px] border-black text-black hover:bg-[#ffcbd1] shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_#000000] transition-all cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Footer Branding */}
      <footer className="mt-16 py-6 text-center text-black/60 font-mono text-xs">
        <div>© 2026 TrialGuard. All rights reserved.</div>
      </footer>
    </div>
  );
}

// Icons
function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
