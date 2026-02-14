import { Metadata } from 'next';
import ResourceGrid from '@/components/feature/ResourceGrid';
import ResourceFilters from '@/components/feature/ResourceFilters';
import FilterBanner from '@/components/feature/FilterBanner';
import { 
  AcademicCapIcon, 
  ArrowRightIcon, 
  DocumentTextIcon, 
  AcademicCapIcon as GraduationIcon,
  BriefcaseIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Education Resources | Vet1Stop',
  description: 'Discover educational resources, benefits, scholarships, and training opportunities for veterans and their families.',
  keywords: 'veteran education benefits, GI Bill, scholarships for veterans, military education, veteran training programs, education resources',
};

export default function EducationPage() {
  return (
    <main className="bg-white min-h-screen" role="main">
      {/* Hero Banner */}
      <section 
        aria-labelledby="education-hero-heading" 
        className="bg-[#1A2C5B] text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 
                id="education-hero-heading"
                className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              >
                Education Resources
              </h1>
              <p className="text-lg md:text-xl max-w-3xl leading-relaxed">
                Access education benefits, scholarships, and training opportunities designed specifically for veterans, service members, and their families.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <a 
                  href="#resource-library" 
                  className="inline-flex items-center px-6 py-3 rounded-md bg-[#EAB308] text-[#1A2C5B] font-semibold hover:bg-[#FACC15] focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-colors"
                  aria-label="Jump to resource library section"
                >
                  Browse Resources
                  <ArrowRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                </a>
                <Link 
                  href="/careers" 
                  className="inline-flex items-center px-6 py-3 rounded-md bg-transparent border-2 border-white text-white font-semibold hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30 transition-colors"
                  aria-label="View related career resources"
                >
                  Explore Career Opportunities
                </Link>
              </div>
            </div>
            <div className="mt-8 md:mt-0 flex justify-center">
              <div className="bg-white/10 p-5 rounded-full">
                <AcademicCapIcon className="h-24 w-24 text-[#EAB308]" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Overview */}
      <section 
        aria-labelledby="benefits-heading" 
        className="py-16 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            id="benefits-heading"
            className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-8"
          >
            Education Benefits Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#1A2C5B]">GI Bill Benefits</h3>
                <DocumentTextIcon className="h-6 w-6 text-[#1A2C5B]" aria-hidden="true" />
              </div>
              <p className="text-gray-700 mb-4">
                The Post-9/11 GI Bill provides financial support for education and housing to individuals with at least
                90 days of aggregate service after September 10, 2001.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Tuition and fee coverage</li>
                <li>Monthly housing allowance</li>
                <li>Books and supplies stipend</li>
                <li>Transferability to dependents</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <a 
                  href="https://www.va.gov/education/about-gi-bill-benefits/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="Learn more about GI Bill benefits on VA website (opens in new tab)"
                >
                  Learn more on VA.gov
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#1A2C5B]">Scholarships & Grants</h3>
                <DocumentTextIcon className="h-6 w-6 text-[#1A2C5B]" aria-hidden="true" />
              </div>
              <p className="text-gray-700 mb-4">
                Beyond GI Bill benefits, numerous scholarships and grants are available specifically for veterans
                and military families.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Military-specific scholarships</li>
                <li>ROTC scholarships</li>
                <li>Foundation grants</li>
                <li>State-based education benefits</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <a 
                  href="https://www.va.gov/education/other-va-education-benefits/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="Learn more about scholarships and grants on VA website (opens in new tab)"
                >
                  Explore scholarships
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4 flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#1A2C5B]">Educational Counseling</h3>
                <DocumentTextIcon className="h-6 w-6 text-[#1A2C5B]" aria-hidden="true" />
              </div>
              <p className="text-gray-700 mb-4">
                VA offers personalized educational and career counseling services to help you maximize your benefits.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Benefits explanation assistance</li>
                <li>Educational planning</li>
                <li>Career guidance</li>
                <li>Academic counseling</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <a 
                  href="https://www.va.gov/careers-employment/education-and-career-counseling/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="Learn more about educational counseling on VA website (opens in new tab)"
                >
                  Get counseling
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Guides */}
      <section 
        aria-labelledby="guides-heading" 
        className="py-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            id="guides-heading"
            className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-8"
          >
            Education Quick Guides
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-[#1A2C5B] flex items-center justify-center text-white mr-4">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold text-[#1A2C5B]">How to Apply for GI Bill Benefits</h3>
              </div>
              <ol className="list-none space-y-6">
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">1</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Determine your eligibility</span>
                    <p className="mt-1 text-gray-600">
                      Check if you qualify for the Post-9/11 GI Bill, Montgomery GI Bill, or other programs based on your service.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">2</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Gather your documentation</span>
                    <p className="mt-1 text-gray-600">
                      You'll need your Certificate of Eligibility, DD-214, and other service records.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">3</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Submit VA Form 22-1990</span>
                    <p className="mt-1 text-gray-600">
                      Apply online through VA.gov or with the help of a school certifying official.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">4</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Contact your school's Veterans Office</span>
                    <p className="mt-1 text-gray-600">
                      Work with your school to certify your enrollment and process your benefits.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <a 
                  href="https://www.va.gov/education/how-to-apply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="View complete application guide on VA website (opens in new tab)"
                >
                  View complete application guide
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-[#1A2C5B] flex items-center justify-center text-white mr-4">
                  <GraduationIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-[#1A2C5B]">Choosing a Veteran-Friendly School</h3>
              </div>
              <ol className="list-none space-y-6">
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">1</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Look for Yellow Ribbon Program participants</span>
                    <p className="mt-1 text-gray-600">
                      These schools provide additional funding to cover costs beyond GI Bill limits.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">2</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Check for a dedicated veteran's office</span>
                    <p className="mt-1 text-gray-600">
                      Schools with dedicated staff for veteran services offer better support.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">3</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Verify VA benefit acceptance</span>
                    <p className="mt-1 text-gray-600">
                      Ensure the school is approved for VA education benefits before applying.
                    </p>
                  </div>
                </li>
                <li className="relative pl-9">
                  <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[#1A2C5B] font-bold text-sm">4</div>
                  <div>
                    <span className="font-medium text-[#1A2C5B]">Research veteran student organizations</span>
                    <p className="mt-1 text-gray-600">
                      Schools with active veteran communities often provide better peer support.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <a 
                  href="https://www.va.gov/education/choosing-a-school/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A2C5B] font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:underline"
                  aria-label="View school selection guide on VA website (opens in new tab)"
                >
                  View school selection guide
                  <ArrowRightIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resource Library */}
      <section 
        id="resource-library"
        aria-labelledby="resources-heading" 
        className="py-16 bg-white scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 
                id="resources-heading"
                className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-2"
              >
                Education Resource Library
              </h2>
              <p className="text-gray-700">
                Browse our comprehensive collection of education resources for veterans.
              </p>
            </div>
          </div>

          {/* Filters */}
          <FilterBanner 
            category="education" 
          />
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold text-lg text-[#1A2C5B] mb-4">Filter Resources</h3>
              <ResourceFilters category="education" />
            </div>
            
            <div className="lg:col-span-3">
              <ResourceGrid category="education" />
            </div>
          </div>
        </div>
      </section>

      {/* Related Section */}
      <section 
        aria-labelledby="related-heading" 
        className="py-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            id="related-heading"
            className="text-2xl md:text-3xl font-bold text-[#1A2C5B] mb-8 text-center"
          >
            Explore Related Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/careers" className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-100">
              <BriefcaseIcon className="h-12 w-12 text-[#1A2C5B] mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">Careers</h3>
              <p className="text-center text-gray-600">Find job opportunities and career resources for veterans</p>
            </Link>
            
            <Link href="/health" className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-100">
              <HeartIcon className="h-12 w-12 text-[#B22234] mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">Health</h3>
              <p className="text-center text-gray-600">Access healthcare and wellness resources for veterans</p>
            </Link>
            
            <Link href="/entrepreneur" className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-100">
              <SparklesIcon className="h-12 w-12 text-[#EAB308] mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">Entrepreneur</h3>
              <p className="text-center text-gray-600">Discover resources for veteran business owners and startups</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
