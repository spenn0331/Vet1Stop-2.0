import { ArrowRightIcon, BriefcaseIcon, CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

export default function CareerPathways() {
  return (
    <section id="career-pathways" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-blue-50 text-[#1A2C5B] text-sm font-semibold mb-4">
            <ArrowRightIcon className="h-4 w-4 mr-2" />
            Choose Your Path
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4">
            Two Paths to Success
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Your military experience has prepared you for success in either traditional employment or entrepreneurship.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Employment Path */}
          <div id="employment" className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-8 shadow-xl relative overflow-hidden border border-blue-100">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1A2C5B]"></div>
            <div className="mb-6">
              <div className="bg-[#1A2C5B] w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <BriefcaseIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A2C5B] mb-2">Traditional Employment</h3>
              <p className="text-gray-700">
                Find a career that values your military experience, with resources to help you translate your skills and connect with veteran-friendly employers.
              </p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Military skills translation tools</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Resume building and interview preparation</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Federal, state, and private job opportunities</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Career advancement and professional development</span>
              </li>
            </ul>
            
            <a 
              href="#employment-resources" 
              className="inline-flex items-center justify-center px-6 py-3 bg-[#1A2C5B] text-white font-medium rounded-md hover:bg-blue-800 transition-colors focus:ring-4 focus:ring-blue-300 focus:outline-none"
            >
              Explore Employment Resources
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
          </div>
          
          {/* Entrepreneurship Path */}
          <div id="entrepreneurship" className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-8 shadow-xl relative overflow-hidden border border-amber-100">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#EAB308]"></div>
            <div className="mb-6">
              <div className="bg-[#EAB308] w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <LightBulbIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A2C5B] mb-2">Entrepreneurship</h3>
              <p className="text-gray-700">
                Start or grow your own business with specialized resources for veteran entrepreneurs, from business planning to funding opportunities.
              </p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Business planning and development tools</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Veteran-specific funding opportunities</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Veteran business certification guidance</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <span>Government contracting opportunities</span>
              </li>
            </ul>
            
            <a 
              href="#entrepreneurship-resources" 
              className="inline-flex items-center justify-center px-6 py-3 bg-[#EAB308] text-[#1A2C5B] font-medium rounded-md hover:bg-amber-400 transition-colors focus:ring-4 focus:ring-amber-300 focus:outline-none"
            >
              Explore Entrepreneurship Resources
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
