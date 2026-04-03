'use client';

import {
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';

const VA_BENEFITS = [
  {
    icon: CurrencyDollarIcon,
    title: 'Zero Down Payment',
    description:
      'Buy a home with $0 down. No savings required for a down payment.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'No PMI',
    description:
      'Skip private mortgage insurance. Save $100-300/month compared to conventional loans.',
  },
  {
    icon: ChartBarIcon,
    title: 'Competitive Rates',
    description:
      'VA loans consistently offer lower interest rates than conventional mortgages.',
  },
  {
    icon: BanknotesIcon,
    title: 'No Prepayment Penalty',
    description:
      'Pay off your loan early without fees. Refinance anytime.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Reusable Benefit',
    description:
      "Your VA loan benefit doesn't expire. Use it again and again.",
  },
  {
    icon: DocumentCheckIcon,
    title: 'IRRRL Streamline Refinance',
    description:
      'Refinance with minimal paperwork and no appraisal required.',
  },
];

export default function VABenefitsGrid() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {VA_BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-6 border border-gray-100"
            >
              <div className="h-12 w-12 rounded-xl bg-[#1A2C5B] flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[#1A2C5B] mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Funding fee callout */}
      <div className="mt-8 border-l-4 border-[#EAB308] bg-amber-50 rounded-r-xl p-5">
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-bold text-gray-900">⚠️ Note:</span> A VA
          funding fee (1.25%-3.3%) applies unless you have a service-connected
          disability rating. Ask your agent about exemptions.
        </p>
      </div>
    </div>
  );
}
