'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { ScoreBreakdown } from '@/utils/ngo-data';

interface Candidate {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  rating?: number;
  metrics?: {
    impactScore?: number;
    fundingEfficiency?: number;
    veteransSupportedCount?: number;
  };
  isManualOverride?: boolean;
  isNGOOfTheMonth?: boolean;
  scoreBreakdown: ScoreBreakdown;
}

interface MonthData {
  ngoOfTheMonth: Candidate | null;
  candidates: Candidate[];
  selectionMonth: string;
  isManualOverride: boolean;
  scoreBreakdown: ScoreBreakdown | null;
}

function ScoreBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500">{value}/{max}</span>
    </div>
  );
}

export default function AdminNGOsPage() {
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ngos/month?includeCandidates=true');
      const json = await res.json();
      if (json.success) {
        setMonthData({
          ngoOfTheMonth: json.ngoOfTheMonth ?? null,
          candidates: json.candidates ?? [],
          selectionMonth: json.selectionMonth ?? '',
          isManualOverride: json.isManualOverride ?? false,
          scoreBreakdown: json.scoreBreakdown ?? null,
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load NGO of the Month data.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const crownNGO = async (ngoId: string) => {
    setActionLoading(ngoId);
    try {
      const res = await fetch('/api/ngos/month', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoId }),
      });
      const json = await res.json();
      setMessage(json.success
        ? { type: 'success', text: 'NGO of the Month updated successfully.' }
        : { type: 'error', text: json.error ?? 'Failed to update.' }
      );
      if (json.success) await fetchData();
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const resetToAuto = async () => {
    setActionLoading('reset');
    try {
      const res = await fetch('/api/ngos/month', { method: 'DELETE' });
      const json = await res.json();
      setMessage(json.success
        ? { type: 'success', text: 'Reset to auto-selection.' }
        : { type: 'error', text: json.error ?? 'Failed to reset.' }
      );
      if (json.success) await fetchData();
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const getCandidateId = (c: Candidate) => c._id ?? c.id ?? '';
  const getCandidateName = (c: Candidate) => c.name ?? c.title ?? 'Unknown';

  return (
    <div className="space-y-6">

      {/* Status message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* ── NGO of the Month Manager ── */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold text-gray-900">NGO of the Month</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Auto-scored monthly
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Winners are auto-selected by composite score. Use the table below to review and manually crown a winner if needed.
            Scores: Impact (35%) + Rating (25%) + Funding Efficiency (20%) + Reach (20%).
          </p>

          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-20 bg-gray-100 rounded-xl" />
              <div className="h-48 bg-gray-100 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Current winner */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Current Winner — {monthData?.selectionMonth}
                </h3>
                {monthData?.ngoOfTheMonth ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-extrabold text-[#1A2C5B]">
                          {getCandidateName(monthData.ngoOfTheMonth)}
                        </span>
                        {monthData.isManualOverride ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            Admin Override
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            Auto-Selected
                          </span>
                        )}
                      </div>
                      {monthData.scoreBreakdown && (
                        <p className="text-sm text-gray-600">
                          Community Score:{' '}
                          <span className="font-extrabold text-emerald-700">{monthData.scoreBreakdown.total}/100</span>
                          <span className="text-xs text-gray-400 ml-2">
                            (Impact {monthData.scoreBreakdown.impactComponent}/35 · Rating {monthData.scoreBreakdown.ratingComponent}/25 · Funding {monthData.scoreBreakdown.fundingComponent}/20 · Reach {monthData.scoreBreakdown.veteransComponent}/20)
                          </span>
                        </p>
                      )}
                    </div>
                    {monthData.isManualOverride && (
                      <button
                        onClick={resetToAuto}
                        disabled={actionLoading === 'reset'}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'reset' ? 'Resetting...' : '↺ Reset to Auto-Select'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl px-5 py-6 text-center">
                    <p className="text-sm text-gray-500">No NGOs found in the database.</p>
                    <p className="text-xs text-gray-400 mt-1">Add NGO documents to the <code className="bg-gray-100 px-1 rounded">ngos</code> collection with <code className="bg-gray-100 px-1 rounded">status: &quot;active&quot;</code> to enable auto-selection.</p>
                  </div>
                )}
              </div>

              {/* Top candidates table */}
              {monthData?.candidates && monthData.candidates.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Top Candidates (Ranked by Score)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="pb-2 pr-4">Rank</th>
                          <th className="pb-2 pr-4">Organization</th>
                          <th className="pb-2 pr-4">Total</th>
                          <th className="pb-2 pr-4">Impact</th>
                          <th className="pb-2 pr-4">Rating</th>
                          <th className="pb-2 pr-4">Funding</th>
                          <th className="pb-2 pr-4">Reach</th>
                          <th className="pb-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {monthData.candidates.map((c, i) => {
                          const cId = getCandidateId(c);
                          const isWinner = monthData.ngoOfTheMonth && getCandidateId(monthData.ngoOfTheMonth) === cId;
                          return (
                            <tr key={cId || i} className={`text-sm ${isWinner ? 'bg-emerald-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                              <td className="py-3 pr-4">
                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                                  i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {i + 1}
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-semibold text-[#1A2C5B] whitespace-nowrap">
                                {getCandidateName(c)}
                                {isWinner && (
                                  <span className="ml-2 text-[10px] text-emerald-600 font-bold">★ CURRENT</span>
                                )}
                              </td>
                              <td className="py-3 pr-4">
                                <span className="font-extrabold text-emerald-700">{c.scoreBreakdown.total}</span>
                                <span className="text-gray-400 text-xs">/100</span>
                              </td>
                              <td className="py-3 pr-4">
                                <ScoreBar value={c.scoreBreakdown.impactComponent} max={35} colorClass="bg-emerald-500" />
                              </td>
                              <td className="py-3 pr-4">
                                <ScoreBar value={c.scoreBreakdown.ratingComponent} max={25} colorClass="bg-amber-400" />
                              </td>
                              <td className="py-3 pr-4">
                                <ScoreBar value={c.scoreBreakdown.fundingComponent} max={20} colorClass="bg-blue-500" />
                              </td>
                              <td className="py-3 pr-4">
                                <ScoreBar value={c.scoreBreakdown.veteransComponent} max={20} colorClass="bg-purple-500" />
                              </td>
                              <td className="py-3">
                                {isWinner ? (
                                  <span className="text-xs text-emerald-600 font-semibold">Active</span>
                                ) : (
                                  <button
                                    onClick={() => crownNGO(cId)}
                                    disabled={!!actionLoading}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A2C5B] text-white text-xs font-bold hover:bg-[#243d7a] transition-colors disabled:opacity-40"
                                  >
                                    {actionLoading === cId ? 'Crowning…' : '👑 Crown'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Crowning an NGO sets a manual override. Use &quot;Reset to Auto-Select&quot; to return to algorithm selection.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── NGO Resource Directory (Phase 1.5) ── */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">NGO Resource Directory</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Phase 1.5
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Manage NGO listings in the{' '}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">healthResources</code> collection.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-sm">
            <div className="bg-gray-50 rounded p-3 text-center">
              <p className="text-2xl font-bold text-[#1A2C5B]">133</p>
              <p className="text-xs text-gray-500 mt-1">NGO Resources</p>
            </div>
            <div className="bg-gray-50 rounded p-3 text-center">
              <p className="text-2xl font-bold text-[#1A2C5B]">100%</p>
              <p className="text-xs text-gray-500 mt-1">Tag Coverage</p>
            </div>
            <div className="bg-gray-50 rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-600">✓</p>
              <p className="text-xs text-gray-500 mt-1">Subcategory Set</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Planned: Inline edit, verification badge toggle, tag editor, duplicate detector. Phase 1.5 post-launch.
          </p>
        </div>
      </div>

      <div>
        <Link href="/admin" className="inline-flex items-center text-sm text-[#1A2C5B] hover:underline">
          ← Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
