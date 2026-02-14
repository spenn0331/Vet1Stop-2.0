"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ChatBubbleLeftRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#1A2C5B] to-[#0f1729] text-white overflow-hidden">
      {/* Background decorative elements with patriotic theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-10"></div>
        <div className="absolute top-8 left-0 w-full h-1 bg-[#B22234] opacity-10"></div>
        <div className="absolute top-16 left-0 w-full h-1 bg-white opacity-10"></div>
        <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#B22234]/10 blur-3xl"></div>
        <div className="absolute left-0 bottom-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-700/10 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#B22234]/20 text-[#EAB308] text-sm font-medium mb-6 border border-[#B22234]/20">
              <span className="mr-1">★</span> Veterans Health Resources
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              What Health Support Do You Need Today?
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
              Access comprehensive resources for your physical and mental health needs, 
              tailored specifically for veterans and their unique healthcare journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="#crisis-resources" 
                className="px-6 py-3 bg-[#B22234] hover:bg-[#C13046] text-white font-semibold rounded-md transition-all duration-200 text-center flex-shrink-0 shadow-lg shadow-[#B22234]/20 focus:ring-4 focus:ring-[#B22234]/50 focus:outline-none"
                aria-label="Get immediate crisis support for veterans"
              >
                Crisis Support
              </Link>
              <Link 
                href="#mental-health" 
                className="px-6 py-3 bg-[#EAB308] hover:bg-[#F7CE46] text-gray-900 font-semibold rounded-md transition-all duration-200 text-center flex-shrink-0 shadow-lg shadow-[#EAB308]/20 focus:ring-4 focus:ring-[#EAB308]/50 focus:outline-none"
                aria-label="Explore mental health resources for veterans"
              >
                Mental Health
              </Link>
              <Link 
                href="#va-benefits" 
                className="px-6 py-3 bg-white hover:bg-gray-100 text-[#1A2C5B] font-semibold rounded-md transition-all duration-200 text-center flex-shrink-0 shadow-lg shadow-white/20 focus:ring-4 focus:ring-white/50 focus:outline-none"
                aria-label="Learn about VA health benefits for veterans"
              >
                VA Benefits
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2 relative">
            <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-2xl">
              <div 
                className="absolute inset-0 bg-[#1A2C5B] rounded-lg"
                style={{ 
                  backgroundImage: 'linear-gradient(to bottom right, #1A2C5B, #0f1729)',
                  backgroundSize: 'cover'
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A2C5B]/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-[#EAB308]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-white text-sm">4.9/5 from 2,400+ veterans</span>
                </div>
                <p className="text-white italic text-sm md:text-base">
                  "The VA healthcare resources helped me navigate my benefits and find the specialized care I needed after service."
                </p>
                <div className="flex items-center mt-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-blue-700 flex items-center justify-center">
                    <span className="text-white font-bold">MR</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Michael Rodriguez</p>
                    <p className="text-gray-300 text-xs">US Army, 2008-2016</p>
                  </div>
                </div>
              </div>
              <a
                href="sms:838255"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-900 hover:bg-gray-100"
              >
                <ChatBubbleLeftRightIcon className="mr-2 h-5 w-5 text-blue-600" />
                Text 838255 for Support
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div 
        className="relative z-10 px-6 py-4 sm:px-12"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for health resources, benefits, or support services..."
              className="w-full pl-10 pr-4 py-3 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            
            <button
              className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
