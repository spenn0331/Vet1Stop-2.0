// Phase 1 + 1.5 feedback framework skeleton — data-ready Day 1 per Living Master MD Section 2 ★ — Strike 2 March 2026
import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
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
      
      {/* Quick Stats */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
          <div className="grid grid-cols-1 gap-5 mt-4 sm:grid-cols-3">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Active Pathways</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Pending Questions</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-500">Info Requests</p>
              <p className="text-2xl font-semibold text-gray-900">15</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Inbox — Strike 2 Feedback Skeleton */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ratings Inbox</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Phase 1.5 Skeleton
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
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400 italic">
                    Data will flow here Day 1 — ready for post-launch team
                  </td>
                </tr>
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
