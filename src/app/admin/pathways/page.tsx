import React from 'react';
import Link from 'next/link';

export default function ResourcePathwaysAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Resource Pathways Management</h2>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1A2C5B] border border-transparent rounded-md hover:bg-blue-800"
        >
          Create New Pathway
        </button>
      </div>
      
      {/* Pathways List */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {/* Sample pathways - in real implementation, these would come from the API */}
          {[
            {
              id: '1',
              title: 'PTSD Treatment Journey',
              category: 'Health',
              steps: 5,
              active: true
            },
            {
              id: '2',
              title: 'Emergency Health Services Access',
              category: 'Health',
              steps: 3,
              active: true
            },
            {
              id: '3',
              title: 'Mental Health Support Pathway',
              category: 'Health',
              steps: 4,
              active: false
            }
          ].map((pathway) => (
            <li key={pathway.id}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#1A2C5B] truncate">
                      {pathway.title}
                    </p>
                    <div className="flex ml-2">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pathway.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pathway.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <p>
                        Category: <span className="font-medium">{pathway.category}</span>
                      </p>
                      <p className="ml-6">
                        Steps: <span className="font-medium">{pathway.steps}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex mt-2 space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-[#1A2C5B] bg-blue-100 border border-transparent rounded-md hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center px-3 py-1 text-sm font-medium ${
                        pathway.active
                          ? 'text-red-700 bg-red-100 hover:bg-red-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      } border border-transparent rounded-md`}
                    >
                      {pathway.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Pathway Creation Modal - would be implemented with state management in real app */}
      <div className="hidden">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-3xl px-4 py-6 bg-white rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Create Resource Pathway</h3>
              {/* Form fields would go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
