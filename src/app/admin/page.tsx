// @ts-nocheck
// Phase 1 + 1.5 feedback framework — Strike 6: live stats from /api/admin/stats
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminStats {
  resources: { total: number; federal: number; ngo: number; state: number };
  pathways: number;
  ratings: {
    total: number;
    average: number;
    recent: Array<{ resourceId?: string; track?: string; thumbs?: string; rating?: number; timestamp?: string }>;
  };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-md">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
          <p className="mt-2 text-sm text-gray-500">
            Welcome to the Vet1Stop admin dashboard. Use this interface to manage resource pathways,
            community Q&A, and NGO resources.
          </p>
          
          <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Resource Pathways Card */}
            <div className="p-5 bg-white border rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Resource Pathways</h3>
              <p className="mt-2 text-sm text-gray-600">
                Create and manage pathways that guide veterans through resource journeys.
              </p>
              <div className="mt-4">
                <Link 
                  href="/admin/pathways" 
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1A2C5B] border border-transparent rounded-md hover:bg-blue-800"
                >
                  Manage Pathways
                </Link>
              </div>
            </div>
            
            {/* Community Q&A Card */}
            <div className="p-5 bg-white border rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Community Q&A</h3>
              <p className="mt-2 text-sm text-gray-600">
                Review and respond to questions from veterans about NGO resources.
              </p>
              <div className="mt-4">
                <Link 
                  href="/admin/community-qa" 
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1A2C5B] border border-transparent rounded-md hover:bg-blue-800"
                >
                  Manage Questions
                </Link>
              </div>
            </div>
            
            {/* NGO Management Card */}
            <div className="p-5 bg-white border rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">NGO Management</h3>
              <p className="mt-2 text-sm text-gray-600">
                Update NGO information, verification status, and service availability.
              </p>
              <div className="mt-4">
                <Link 
                  href="/admin/ngos" 
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1A2C5B] border border-transparent rounded-md hover:bg-blue-800"
                >
                  Manage NGOs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Live Stats — Strike 6 */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Live Stats</h3>
            {loading && <span className="text-xs text-gray-400 animate-pulse">Loading…</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Health Resources"
              value={loading ? '—' : (stats?.resources.total ?? 0)}
              sub="healthResources collection"
            />
            <StatCard
              label="VA (Federal)"
              value={loading ? '—' : (stats?.resources.federal ?? 0)}
              sub="subcategory: federal"
            />
            <StatCard
              label="NGOs"
              value={loading ? '—' : (stats?.resources.ngo ?? 0)}
              sub="subcategory: ngo"
            />
            <StatCard
              label="State Resources"
              value={loading ? '—' : (stats?.resources.state ?? 0)}
              sub="subcategory: state"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
            <StatCard
              label="Active Pathways"
              value={loading ? '—' : (stats?.pathways ?? 0)}
              sub="pathways collection"
            />
            <StatCard
              label="Ratings Collected"
              value={loading ? '—' : (stats?.ratings.total ?? 0)}
              sub="ratings collection"
            />
            <StatCard
              label="Avg Resource Rating"
              value={loading ? '—' : (stats?.ratings.average ? `${stats.ratings.average}★` : '—')}
              sub="from veteran feedback"
            />
          </div>
        </div>
      </div>

      {/* Ratings Inbox — Strike 2 + Strike 6 live recent */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ratings Inbox</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Phase 1.5
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Anonymized veteran feedback (thumbs + star ratings) from Health resource cards.
            Collection: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">ratings</code> in MongoDB.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thumbs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!loading && stats?.ratings.recent && stats.ratings.recent.length > 0 ? (
                  stats.ratings.recent.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-xs">{r.resourceId ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.track ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">{r.thumbs === 'up' ? '👍' : r.thumbs === 'down' ? '👎' : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.rating ? `${r.rating}★` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400 italic">
                      {loading ? 'Loading…' : 'No ratings yet — data will flow here Day 1'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Zero PII stored. All userId fields are SHA-256 hashed. Extend with aggregation pipelines, export, and RAG feedback loops post-launch.
          </p>
        </div>
      </div>
    </div>
  );
}
