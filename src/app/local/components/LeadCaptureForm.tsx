'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
];

const TIMELINES = [
  'Just exploring',
  'Within 3 months',
  'Within 6 months',
  'Ready now',
];

const BRANCHES = [
  'Army',
  'Navy',
  'Marines',
  'Air Force',
  'Coast Guard',
  'Space Force',
  'National Guard',
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  state: string;
  timeline: string;
  branch: string;
  message: string;
}

const INITIAL: FormData = {
  name: '',
  email: '',
  phone: '',
  state: '',
  timeline: '',
  branch: '',
  message: '',
};

export default function LeadCaptureForm() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.state) errs.state = 'Please select a state.';
    if (!form.timeline) errs.timeline = 'Please select a timeline.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Store in local state only — no API call
    setSubmitted(true);
  }

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircleIcon
          className="h-16 w-16 text-emerald-400 mx-auto mb-4"
          aria-hidden="true"
        />
        <h3 className="text-2xl font-bold text-white mb-2">
          Thank you, {form.name.split(' ')[0]}!
        </h3>
        <p className="text-blue-100 text-lg max-w-md mx-auto">
          We&apos;ve received your request. A VA loan specialist in{' '}
          <strong className="text-white">{form.state}</strong> will reach out
          within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="lead-name"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="lead-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              aria-describedby={errors.name ? 'err-name' : undefined}
              className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308] placeholder:text-white/30"
              placeholder="John Doe"
            />
            {errors.name && (
              <p id="err-name" className="text-xs text-red-400 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lead-email"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="lead-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              aria-describedby={errors.email ? 'err-email' : undefined}
              className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308] placeholder:text-white/30"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p id="err-email" className="text-xs text-red-400 mt-1">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="lead-phone"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Phone <span className="text-white/40">(optional)</span>
            </label>
            <input
              id="lead-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308] placeholder:text-white/30"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label
              htmlFor="lead-state"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Desired Location / State <span className="text-red-400">*</span>
            </label>
            <select
              id="lead-state"
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              aria-describedby={errors.state ? 'err-state' : undefined}
              className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
            >
              <option value="" className="bg-[#1A2C5B]">
                Select a state
              </option>
              {US_STATES.map((s) => (
                <option key={s} value={s} className="bg-[#1A2C5B]">
                  {s}
                </option>
              ))}
            </select>
            {errors.state && (
              <p id="err-state" className="text-xs text-red-400 mt-1">
                {errors.state}
              </p>
            )}
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="lead-timeline"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Timeline <span className="text-red-400">*</span>
            </label>
            <select
              id="lead-timeline"
              value={form.timeline}
              onChange={(e) => set('timeline', e.target.value)}
              aria-describedby={errors.timeline ? 'err-timeline' : undefined}
              className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
            >
              <option value="" className="bg-[#1A2C5B]">
                Select timeline
              </option>
              {TIMELINES.map((t) => (
                <option key={t} value={t} className="bg-[#1A2C5B]">
                  {t}
                </option>
              ))}
            </select>
            {errors.timeline && (
              <p id="err-timeline" className="text-xs text-red-400 mt-1">
                {errors.timeline}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lead-branch"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Military Branch{' '}
              <span className="text-white/40">(optional)</span>
            </label>
            <select
              id="lead-branch"
              value={form.branch}
              onChange={(e) => set('branch', e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
            >
              <option value="" className="bg-[#1A2C5B]">
                Select branch
              </option>
              {BRANCHES.map((b) => (
                <option key={b} value={b} className="bg-[#1A2C5B]">
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="lead-message"
            className="block text-sm font-semibold text-white mb-1.5"
          >
            Message / Notes{' '}
            <span className="text-white/40">(optional)</span>
          </label>
          <textarea
            id="lead-message"
            rows={3}
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308] placeholder:text-white/30 resize-none"
            placeholder="Tell us about your home-buying goals..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-[#EAB308] text-[#0F1D3D] text-base font-extrabold hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          Connect Me With an Agent
        </button>
      </form>

      {/* Trust badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
          Your info is secure
        </span>
        <span className="flex items-center gap-1.5">
          <PhoneIcon className="h-4 w-4" aria-hidden="true" />
          No cold calls
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
          RESPA compliant
        </span>
      </div>
    </div>
  );
}
