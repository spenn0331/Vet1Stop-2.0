"use client";

import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Simplified Health Page
 * 
 * A basic version of the health page to test loading without complex components.
 */
export default function SimplifiedHealthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[#1A2C5B] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Veteran Health Resources</h1>
          <p className="text-xl">Find the health support you need today</p>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Find Health Resources</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for health resources..."
              className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <button className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Search
            </button>
          </div>
        </div>
        
        {/* Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Health Resource {i + 1}</h3>
                <p className="text-gray-600 mb-4">This is a description for health resource {i + 1}. It provides information about the services offered.</p>
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    VA Resource
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
