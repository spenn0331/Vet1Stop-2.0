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
    </div>
  );
}
