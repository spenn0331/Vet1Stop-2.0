'use client';

import { PhoneIcon, StarIcon } from '@heroicons/react/24/solid';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { RERNAgent } from '@/data/agents';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((p) => !p.startsWith('"'))
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AgentCard({ agent }: { agent: RERNAgent }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col min-h-[380px] overflow-hidden border border-gray-100">
      {/* Top accent bar */}
      <div
        className={`h-1.5 w-full ${
          agent.featured
            ? 'bg-gradient-to-r from-[#EAB308] to-[#FACC15]'
            : 'bg-gradient-to-r from-[#1A2C5B] to-[#2d4d99]'
        }`}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Photo / Initials */}
          <div className="flex-shrink-0 h-14 w-14 rounded-full bg-[#1A2C5B] flex items-center justify-center overflow-hidden">
            {agent.photo ? (
              <img
                src={agent.photo}
                alt={agent.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {getInitials(agent.name)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#1A2C5B] truncate">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">{agent.title}</p>
            <p className="text-xs text-gray-400 truncate">{agent.company}</p>
          </div>

          {agent.featured && (
            <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-[#EAB308]/10 text-[#EAB308] text-[10px] font-bold border border-[#EAB308]/30 uppercase tracking-wide">
              Featured
            </span>
          )}
        </div>

        {/* Veteran badge */}
        {agent.isVeteran && (
          <div className="flex items-center gap-1.5 mb-3">
            <ShieldCheckIcon
              className="h-4 w-4 text-emerald-500"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Veteran — {agent.branch}
            </span>
          </div>
        )}

        {/* Credentials */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.credentials.map((cred) => (
            <span
              key={cred}
              className="bg-[#1A2C5B]/5 text-[#1A2C5B] rounded-full px-3 py-1 text-xs font-medium"
            >
              {cred}
            </span>
          ))}
        </div>

        {/* Specialties */}
        <p className="text-xs text-gray-500 mb-3">
          <span className="font-semibold text-gray-700">Specialties: </span>
          {agent.specialties.join(', ')}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="font-semibold text-[#1A2C5B]">
            {agent.closings} VA Closings
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-0.5">
            <StarIcon
              className="h-3.5 w-3.5 text-[#EAB308]"
              aria-hidden="true"
            />
            {agent.rating} ({agent.reviewCount})
          </span>
          <span className="text-gray-300">|</span>
          <span>Since {agent.yearStarted}</span>
        </div>

        {/* Coverage */}
        <p className="text-xs text-gray-400 mb-3">
          Serving: {agent.coverageAreas.join(', ')}
        </p>

        {/* Bio */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-auto">
          {agent.bio}
        </p>

        {/* Actions */}
        <a
          href={`tel:${agent.phone.replace(/\D/g, '')}`}
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1A2C5B] text-white text-sm font-bold hover:bg-[#2d4d99] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={`Call ${agent.name} at ${agent.phone}`}
        >
          <PhoneIcon className="h-4 w-4" aria-hidden="true" />
          Contact Agent
        </a>
      </div>
    </div>
  );
}
