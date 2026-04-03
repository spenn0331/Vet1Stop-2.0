'use client';

import { useState } from 'react';
import {
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface CalcState {
  monthlyBAH: string;
  rate: string;
  term: '15' | '30';
}

export default function BAHCalculator() {
  const [vals, setVals] = useState<CalcState>({
    monthlyBAH: '',
    rate: '6.5',
    term: '30',
  });
  const [result, setResult] = useState<{
    maxPrice: number;
    monthlyPayment: number;
  } | null>(null);
  const [error, setError] = useState('');

  function calculate() {
    setError('');
    const bah = parseFloat(vals.monthlyBAH);
    const annualRate = parseFloat(vals.rate);
    const termYears = parseInt(vals.term, 10);

    if (!bah || bah <= 0) {
      setError('Please enter a valid BAH amount.');
      return;
    }
    if (!annualRate || annualRate <= 0 || annualRate > 15) {
      setError('Interest rate must be between 0 and 15%.');
      return;
    }

    const monthlyRate = annualRate / 100 / 12;
    const n = termYears * 12;
    const payment = bah * 0.85; // 85% rule of thumb
    const maxLoan = payment * (1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate;

    setResult({
      maxPrice: Math.round(maxLoan),
      monthlyPayment: Math.round(payment),
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Form */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="bah-amount"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Monthly BAH Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                id="bah-amount"
                type="number"
                placeholder="e.g. 2400"
                min="0"
                value={vals.monthlyBAH}
                onChange={(e) =>
                  setVals((v) => ({ ...v, monthlyBAH: e.target.value }))
                }
                className="w-full rounded-xl border border-white/20 bg-white/5 text-white pl-7 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308] placeholder:text-white/30"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="bah-rate"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Estimated Interest Rate (%)
            </label>
            <div className="relative">
              <input
                id="bah-rate"
                type="number"
                step="0.01"
                min="0"
                max="15"
                value={vals.rate}
                onChange={(e) =>
                  setVals((v) => ({ ...v, rate: e.target.value }))
                }
                className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308] placeholder:text-white/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                %
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="bah-term"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Loan Term
            </label>
            <select
              id="bah-term"
              value={vals.term}
              onChange={(e) =>
                setVals((v) => ({
                  ...v,
                  term: e.target.value as '15' | '30',
                }))
              }
              className="w-full rounded-xl border border-white/20 bg-white/5 text-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
            >
              <option value="30" className="bg-[#1A2C5B]">
                30 Years
              </option>
              <option value="15" className="bg-[#1A2C5B]">
                15 Years
              </option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={calculate}
            className="w-full py-3 rounded-xl bg-[#EAB308] text-[#0F1D3D] text-sm font-extrabold hover:bg-[#FACC15] transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            Calculate
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {result ? (
          <>
            <div className="bg-[#1A2C5B] rounded-2xl border border-white/15 p-6 text-center">
              <p className="text-sm text-blue-200 font-semibold mb-1">
                Estimated Max Home Price
              </p>
              <p className="text-4xl font-extrabold text-[#EAB308]">
                ${result.maxPrice.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#1A2C5B] rounded-2xl border border-white/15 p-6 text-center">
              <p className="text-sm text-blue-200 font-semibold mb-1">
                Estimated Monthly Payment
              </p>
              <p className="text-4xl font-extrabold text-emerald-400">
                ${result.monthlyPayment.toLocaleString()}
                <span className="text-lg text-emerald-300">/mo</span>
              </p>
            </div>
          </>
        ) : (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-10 text-center">
            <CurrencyDollarIcon
              className="h-12 w-12 text-white/20 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm text-white/40">
              Enter your BAH and rate to see your estimated buying power.
            </p>
          </div>
        )}

        <p className="text-xs text-white/40 leading-relaxed">
          These are estimates only. Actual amounts depend on your credit,
          debt-to-income ratio, and lender. This is not financial advice.
        </p>

        <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-4">
          <ShieldCheckIcon
            className="h-4 w-4 text-white/50 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-white/50 leading-relaxed">
            <strong className="text-white/70">RESPA Disclosure:</strong>{' '}
            Vet1Stop is a licensed referral network, not a lender. This
            calculator is for informational purposes only and does not constitute
            a loan offer or commitment to lend.
          </p>
        </div>
      </div>
    </div>
  );
}
