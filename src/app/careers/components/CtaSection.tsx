import Link from 'next/link';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function CtaSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#1A2C5B] to-[#0A1A40] text-white relative overflow-hidden">
      {/* Patriotic decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
        <div className="absolute top-8 left-0 w-full h-1 bg-[#B22234]"></div>
        <div className="absolute top-16 left-0 w-full h-1 bg-white"></div>
        <div className="absolute top-24 left-0 w-full h-1 bg-[#B22234]"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-red-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold mb-6">
          <ShieldCheckIcon className="h-4 w-4 mr-2 text-[#EAB308]" />
          Take The Next Step
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Advance Your <span className="text-[#EAB308]">Career Journey</span>?
        </h2>
        
        <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-10 leading-relaxed">
          Whether you're pursuing employment or entrepreneurship, create an account to save resources, track your progress, and receive personalized recommendations.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/signup" 
            className="px-8 py-4 bg-[#EAB308] text-[#1A2C5B] font-semibold rounded-md hover:bg-[#FACC15] transition-all shadow-lg shadow-[#EAB308]/20 inline-flex items-center justify-center focus:ring-4 focus:ring-[#EAB308]/30 focus:outline-none"
          >
            Create Free Account
          </Link>
          <Link 
            href="/contact" 
            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-md hover:bg-white/20 transition-all inline-flex items-center justify-center border border-white/20 focus:ring-4 focus:ring-white/20 focus:outline-none"
          >
            Contact a Career Advisor
          </Link>
        </div>
      </div>
    </section>
  );
}
