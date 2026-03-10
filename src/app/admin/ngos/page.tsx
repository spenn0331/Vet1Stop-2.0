// Strike 6 — Admin NGO Management page (fixes 404 from admin/page.tsx link)
import React from 'react';
import Link from 'next/link';

export default function AdminNGOsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">NGO Management</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Phase 1.5
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Manage NGO resource listings, verification status, and service availability in the{' '}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">healthResources</code> collection.
          </p>

          <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">🏛️</div>
            <h3 className="text-base font-medium text-gray-700">NGO Management UI — Phase 1.5</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              This interface will allow admins to review, verify, and update NGO resource listings.
              Currently, 133 NGO resources are managed directly in MongoDB.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-sm mx-auto text-left">
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
            <p className="mt-5 text-xs text-gray-400">
              Planned: Inline edit, verification badge toggle, tag editor, duplicate detector.
              Extend in Phase 1.5 post-launch.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-[#1A2C5B] hover:underline"
            >
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
