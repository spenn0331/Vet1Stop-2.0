import React from 'react';
import Image from 'next/image';

export default function GuideHeader() {
  return (
    <div className="border-b border-gray-200 pb-8">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Military to VA Healthcare Transition Guide
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Your comprehensive resource for transitioning from DoD/TRICARE to VA healthcare
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Why This Matters</h2>
            <p className="text-gray-700">
              Transitioning from military to veteran status involves changes to your healthcare coverage. 
              This guide simplifies the process, helping you maintain continuous healthcare coverage and 
              access all benefits you've earned through your service.
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500">Last Updated: April 2025</span>
          </div>
        </div>
        <div className="md:w-1/3 flex justify-center mt-6 md:mt-0">
          <div className="relative w-64 h-64">
            <Image 
              src="/assets/images/va-healthcare-transition.jpg" 
              alt="Military to VA Healthcare Transition" 
              width={256} 
              height={256}
              className="rounded-lg shadow-md object-cover"
              onError={(e) => {
                // Fallback image if main one not available
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/assets/images/default-resource.jpg";
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Quick access buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <a 
          href="https://www.va.gov/health-care/how-to-apply/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-blue-700">Apply Online (VA.gov)</span>
        </a>
        <a 
          href="/health/pathways/transitioning-from-military-healthcare" 
          className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-blue-700">Interactive Pathway</span>
        </a>
        <a 
          href="https://www.va.gov/find-locations/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-blue-700">Find VA Locations</span>
        </a>
        <a 
          href="tel:18772228387" 
          className="flex items-center justify-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-blue-700">Call VA: 1-877-222-8387</span>
        </a>
      </div>
    </div>
  );
}
