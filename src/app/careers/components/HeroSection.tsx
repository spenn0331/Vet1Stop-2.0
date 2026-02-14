import Link from 'next/link';
import { BriefcaseIcon, LightBulbIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#1A2C5B] to-[#0A1A40] text-white">
      {/* Decorative stars and stripes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-30"></div>
        <div className="absolute top-8 left-0 w-full h-1 bg-[#B22234] opacity-30"></div>
        <div className="absolute top-16 left-0 w-full h-1 bg-white opacity-30"></div>
        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-700/20 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-700/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
              <BriefcaseIcon className="h-4 w-4 mr-2 text-[#EAB308]" />
              Employment & Entrepreneurship
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Your Next Mission: <span className="text-[#EAB308]">Professional Success</span>
            </h1>
            
            <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-2xl">
              Whether you're seeking employment or starting your own business, your military experience provides valuable skills. Find resources, opportunities, and support tailored specifically for veterans.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#employment"
                className="px-8 py-4 bg-[#EAB308] text-[#1A2C5B] font-semibold rounded-md hover:bg-[#FACC15] transition-all shadow-lg shadow-[#EAB308]/20 inline-flex items-center justify-center focus:ring-4 focus:ring-[#EAB308]/30 focus:outline-none"
              >
                Find Career Opportunities
              </a>
              <a 
                href="#entrepreneurship"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-md hover:bg-white/20 transition-all inline-flex items-center justify-center border border-white/20 focus:ring-4 focus:ring-white/20 focus:outline-none"
              >
                Start Your Business Journey
              </a>
            </div>
          </div>
          
          <div className="lg:col-span-2 hidden lg:block">
            <div className="relative">
              {/* Main image */}
              <div className="relative bg-white p-3 rounded-2xl shadow-2xl z-10 overflow-hidden transform rotate-2">
                <div className="aspect-[4/3] rounded-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="mx-auto w-20 h-20 bg-[#1A2C5B] rounded-full flex items-center justify-center mb-4">
                        <BriefcaseIcon className="h-10 w-10 text-white" />
                      </div>
                      <p className="text-[#1A2C5B] text-lg font-semibold">Career Success</p>
                      <p className="text-blue-700 text-sm">Placeholder Image</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-1/2 -right-6 transform translate-x-1/4 -translate-y-1/2 bg-[#B22234] w-20 h-20 rounded-full flex items-center justify-center z-20 shadow-lg">
                <LightBulbIcon className="h-10 w-10 text-white" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-[#EAB308] w-28 h-28 rounded-lg shadow-lg flex items-center justify-center z-20 transform -rotate-6">
                <CurrencyDollarIcon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
