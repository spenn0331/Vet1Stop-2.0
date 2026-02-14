import Link from 'next/link';
import { 
  AcademicCapIcon,
  ArrowRightIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function RelatedResources() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-4">
            Related Resources
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Explore other resources that can help you on your professional journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Education Resource */}
          <Link 
            href="/education" 
            className="group flex flex-col h-full bg-gradient-to-b from-blue-50 to-white rounded-xl p-6 shadow-md overflow-hidden border border-blue-100 transition-all hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <div className="bg-[#1A2C5B] w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2C5B] mb-2 group-hover:text-blue-700 transition-colors">Education Resources</h3>
            <p className="text-gray-600 mb-4">Explore education and training programs to advance your career or business.</p>
            <div className="mt-auto pt-4 border-t border-blue-100">
              <span className="text-blue-700 font-medium flex items-center">
                Learn More
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </div>
          </Link>
          
          {/* Health Resource */}
          <Link 
            href="/health" 
            className="group flex flex-col h-full bg-gradient-to-b from-red-50 to-white rounded-xl p-6 shadow-md overflow-hidden border border-red-100 transition-all hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            <div className="bg-[#B22234] w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HeartIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2C5B] mb-2 group-hover:text-red-700 transition-colors">Health Resources</h3>
            <p className="text-gray-600 mb-4">Access healthcare resources to support your well-being during your career journey.</p>
            <div className="mt-auto pt-4 border-t border-red-100">
              <span className="text-red-700 font-medium flex items-center">
                Learn More
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </div>
          </Link>
          
          {/* Life & Leisure Resource */}
          <Link 
            href="/life-leisure" 
            className="group flex flex-col h-full bg-gradient-to-b from-amber-50 to-white rounded-xl p-6 shadow-md overflow-hidden border border-amber-100 transition-all hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-amber-100"
          >
            <div className="bg-[#EAB308] w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2C5B] mb-2 group-hover:text-amber-700 transition-colors">Life & Leisure</h3>
            <p className="text-gray-600 mb-4">Discover resources for housing, financial planning, and family support.</p>
            <div className="mt-auto pt-4 border-t border-amber-100">
              <span className="text-amber-700 font-medium flex items-center">
                Learn More
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
