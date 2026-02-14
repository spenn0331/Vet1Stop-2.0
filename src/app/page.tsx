import Link from 'next/link';
import Image from 'next/image';
import { 
  AcademicCapIcon, 
  ArrowRightIcon, 
  BriefcaseIcon, 
  HeartIcon, 
  MapIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vet1Stop - Veteran Resources, Community, and Opportunities',
  description: 'Your centralized hub for veteran resources, connections, and opportunities. Access education, health, career resources, and connect with veteran-owned businesses.',
  keywords: 'veterans, military resources, veteran benefits, GI Bill, VA healthcare, veteran careers, veteran community',
};

export default function Home() {
  // Resource categories for the homepage
  const resourceCategories = [
    {
      id: 'education',
      name: 'Education',
      description: 'Access education benefits, scholarships, and training opportunities.',
      icon: AcademicCapIcon,
      href: '/education',
      bgClass: 'bg-gradient-to-br from-blue-700 to-blue-800',
      iconClass: 'text-white opacity-80 group-hover:opacity-100',
      ariaLabel: 'Learn about education resources for veterans',
    },
    {
      id: 'health',
      name: 'Health',
      description: 'Discover healthcare services, mental health support, and wellness programs.',
      icon: HeartIcon,
      href: '/health',
      bgClass: 'bg-gradient-to-br from-red-700 to-red-800',
      iconClass: 'text-white opacity-80 group-hover:opacity-100',
      ariaLabel: 'Learn about health resources for veterans',
    },
    {
      id: 'life-leisure',
      name: 'Life & Leisure',
      description: 'Explore housing assistance, recreational activities, and community support.',
      icon: SparklesIcon,
      href: '/life-leisure',
      bgClass: 'bg-gradient-to-br from-amber-600 to-amber-700',
      iconClass: 'text-white opacity-80 group-hover:opacity-100',
      ariaLabel: 'Learn about life and leisure resources for veterans',
    },
    {
      id: 'careers',
      name: 'Careers',
      description: 'Find employment opportunities, entrepreneurship resources, and career development tools.',
      icon: BriefcaseIcon,
      href: '/careers',
      bgClass: 'bg-gradient-to-br from-green-700 to-green-800',
      iconClass: 'text-white opacity-80 group-hover:opacity-100',
      ariaLabel: 'Learn about career and entrepreneurship resources for veterans',
    },
  ];

  // Hub features for the homepage
  const hubFeatures = [
    {
      id: 'local',
      name: 'Local',
      description: 'Discover veteran-owned businesses in your community – from restaurants and retail to services and more.',
      icon: MapIcon,
      href: '/local',
      bgClass: 'bg-blue-700',
      iconClass: 'text-white',
      ariaLabel: 'Navigate to local veteran business finder',
    },
    {
      id: 'shop',
      name: 'Shop',
      description: 'Support veteran entrepreneurs by shopping their products in our exclusive online marketplace.',
      icon: ShoppingBagIcon,
      href: '/shop',
      bgClass: 'bg-blue-700',
      iconClass: 'text-white',
      ariaLabel: 'Navigate to veteran marketplace',
    },
    {
      id: 'social',
      name: 'Social',
      description: 'Connect with fellow veterans, join interest groups, find local events, and build your support network.',
      icon: ChatBubbleLeftRightIcon,
      href: '/social',
      bgClass: 'bg-blue-700',
      iconClass: 'text-white',
      ariaLabel: 'Navigate to veteran social community',
    },
  ];

  return (
    <main className="bg-white min-h-screen" role="main">
      {/* Hero Section */}
      <section 
        aria-labelledby="hero-heading" 
        className="relative bg-[#1A2C5B] overflow-hidden"
      >
        {/* Hero Background with Flag Theme */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2C5B]/90 via-[#1A2C5B]/85 to-[#1A2C5B]/95 z-10"></div>
          <div className="absolute inset-0 bg-[url('/hero-flag-bg.jpg')] bg-cover bg-center opacity-50"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
          
          {/* Animated Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-700 via-white to-blue-700"></div>
          <div className="absolute hidden md:block top-20 left-[10%] w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute hidden md:block bottom-10 right-[5%] w-96 h-96 rounded-full bg-blue-700/10 blur-3xl"></div>
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white max-w-2xl">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-800/50 backdrop-blur-sm border border-white/10 text-white text-sm font-medium mb-6">
                <ShieldCheckIcon className="h-4 w-4 mr-2 text-[#EAB308]" />
                For U.S. Veterans & Military Families
              </div>
              
              <h1 
                id="hero-heading"
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight"
              >
                One Hub for <br className="hidden md:block" />
                <span className="text-[#EAB308] drop-shadow-sm">All Veteran Needs</span>
              </h1>
              
              <p className="text-xl leading-relaxed mb-8 text-gray-100 max-w-xl">
                Your centralized platform for accessing benefits, connecting with fellow veterans, and discovering services tailored for those who served.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/education"
                  className="px-8 py-4 bg-[#B22234] text-white font-semibold rounded-md hover:bg-[#961D2B] transition-all shadow-lg shadow-red-900/30 inline-flex items-center justify-center focus:ring-4 focus:ring-red-700/30 focus:outline-none"
                  aria-label="Explore veteran resources"
                >
                  Explore Resources
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-transparent border-2 border-white/80 text-white font-semibold rounded-md hover:bg-white/10 transition-all inline-flex items-center justify-center focus:ring-4 focus:ring-white/20 focus:outline-none"
                  aria-label="Join our veteran community"
                >
                  Join Our Community
                </Link>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-blue-800 flex items-center justify-center text-white font-bold text-xs">VA</div>
                    <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-blue-800 flex items-center justify-center text-white font-bold text-xs">DoD</div>
                    <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-blue-800 flex items-center justify-center text-white font-bold text-xs">SBA</div>
                    <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-blue-800 flex items-center justify-center text-white font-bold text-xs">+20</div>
                  </div>
                  <p className="text-sm text-gray-300">
                    Resources from trusted federal, state, and non-profit organizations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative w-full max-w-md aspect-square">
                {/* Main Emblem */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-72 h-72 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 border-8 border-[#EAB308]/80 shadow-2xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="flex justify-center mb-2">
                        <svg className="w-16 h-16 text-[#EAB308]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold">Vet1Stop</h2>
                      <p className="text-sm opacity-80 mt-1">Est. 2025</p>
                    </div>
                  </div>
                </div>
                
                {/* Orbiting Elements */}
                <div className="absolute top-4 right-16 transform -translate-y-1/2 -translate-x-1/2">
                  <div className="w-20 h-20 rounded-lg bg-red-700 shadow-lg rotate-12 flex items-center justify-center text-white">
                    <AcademicCapIcon className="h-10 w-10" />
                  </div>
                </div>
                <div className="absolute bottom-12 right-0 transform translate-x-1/4">
                  <div className="w-24 h-24 rounded-lg bg-blue-800 shadow-lg -rotate-12 flex items-center justify-center text-white">
                    <BriefcaseIcon className="h-12 w-12" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-12 transform translate-y-1/4">
                  <div className="w-16 h-16 rounded-lg bg-[#EAB308] shadow-lg rotate-45 flex items-center justify-center text-white">
                    <HeartIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto fill-white">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Resource Categories Section */}
      <section 
        aria-labelledby="resources-heading" 
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-blue-50 text-[#1A2C5B] text-sm font-semibold mb-4">
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              Veteran Resources
            </div>
            <h2 
              id="resources-heading"
              className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4"
            >
              Resources Built for Veterans
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Access comprehensive resources tailored specifically for veterans across all aspects of civilian life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resourceCategories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="group flex flex-col h-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                aria-label={category.ariaLabel}
              >
                <div className={`px-6 py-8 ${category.bgClass} relative h-40`}>
                  <category.icon className={`h-12 w-12 ${category.iconClass}`} aria-hidden="true" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mb-16"></div>
                </div>
                <div className="flex-1 p-8 bg-gradient-to-b from-gray-50 to-white">
                  <h3 className="text-2xl font-bold mb-3 text-[#1A2C5B] group-hover:text-blue-700 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-700 mb-6">
                    {category.description}
                  </p>
                  <div className="mt-auto">
                    <span className="text-blue-700 font-medium flex items-center">
                      Explore {category.name}
                      <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community Features Section */}
      <section 
        aria-labelledby="community-heading" 
        className="py-20 bg-gray-50 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <div className="absolute top-24 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-12 left-16 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-blue-50 text-[#1A2C5B] text-sm font-semibold mb-4">
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
              Veteran Community
            </div>
            <h2 
              id="community-heading"
              className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4"
            >
              Connect With Fellow Veterans
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Discover veteran-owned businesses, shop exclusive products, and build your support network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hubFeatures.map((feature) => (
              <Link
                key={feature.id}
                href={feature.href}
                className="group relative flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                aria-label={feature.ariaLabel}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-700"></div>
                <div className="px-8 py-8">
                  <div className="bg-[#1A2C5B] w-16 h-16 flex items-center justify-center rounded-xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <feature.icon className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-[#1A2C5B] group-hover:text-blue-700 transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-gray-700 mb-6">
                    {feature.description}
                  </p>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-blue-700 font-medium flex items-center">
                      Explore {feature.name}
                      <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" aria-hidden="true" />
                    </span>
                    
                    <span className="bg-blue-50 text-[#1A2C5B] text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        aria-labelledby="testimonials-heading" 
        className="py-20 bg-white relative overflow-hidden"
      >
        {/* Decorative flag-inspired elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#B22234] via-white to-[#1A2C5B]"></div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-10 w-64 h-64 rounded-full bg-blue-100/80 mix-blend-multiply blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-red-100/80 mix-blend-multiply blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1 rounded-full bg-blue-50 text-[#1A2C5B] text-sm font-semibold mb-4">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Success Stories
            </div>
            <h2 
              id="testimonials-heading"
              className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4"
            >
              Hear From Veterans Like You
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Real stories from veterans who've found resources, connections, and opportunities through Vet1Stop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-8 shadow-xl relative border border-blue-100">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#1A2C5B]"></div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-[#1A2C5B]">
                  <div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center text-white font-bold text-lg">
                    JM
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1A2C5B]">James Mitchell</h3>
                  <p className="text-sm text-gray-600">U.S. Army Veteran • 2008-2016</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic">
                  "Vet1Stop's education resources helped me navigate the GI Bill and find the right university program. The step-by-step guidance made a complex process simple."
                </p>
              </div>
              <div className="pt-4 border-t border-blue-100">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-[#1A2C5B] mr-2" />
                  <span className="text-sm font-medium text-[#1A2C5B]">Used Education Resources</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-8 shadow-xl relative border border-blue-100">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#B22234]"></div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-[#B22234]">
                  <div className="w-full h-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-bold text-lg">
                    SL
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1A2C5B]">Sarah Lopez</h3>
                  <p className="text-sm text-gray-600">U.S. Navy Veteran • 2010-2019</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic">
                  "Through the Local business directory, I connected with fellow veteran entrepreneurs who've become mentors for my own business venture. This community is invaluable."
                </p>
              </div>
              <div className="pt-4 border-t border-red-100">
                <div className="flex items-center">
                  <MapIcon className="h-5 w-5 text-[#B22234] mr-2" />
                  <span className="text-sm font-medium text-[#B22234]">Used Local Business Feature</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-8 shadow-xl relative border border-blue-100">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#EAB308]"></div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-[#EAB308]">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center text-white font-bold text-lg">
                    RP
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1A2C5B]">Robert Peterson</h3>
                  <p className="text-sm text-gray-600">U.S. Marines Veteran • 2005-2014</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 italic">
                  "The health resources section connected me with mental health services specifically for combat veterans. It made all the difference in my transition to civilian life."
                </p>
              </div>
              <div className="pt-4 border-t border-yellow-100">
                <div className="flex items-center">
                  <HeartIcon className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-600">Used Health Resources</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        aria-labelledby="cta-heading" 
        className="py-24 relative overflow-hidden"
      >
        {/* Epic patriotic background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A2C5B] to-[#0A1A40]"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-2 bg-white"></div>
            <div className="absolute top-8 left-0 w-full h-1 bg-[#B22234]"></div>
            <div className="absolute top-14 left-0 w-full h-2 bg-white"></div>
            <div className="absolute top-20 left-0 w-full h-1 bg-[#B22234]"></div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute left-0 bg-white" 
                style={{
                  top: `${128 + i * 40}px`,
                  height: '8px',
                  width: '100%',
                  opacity: 0.15
                }}
              />
            ))}
            <div className="absolute top-0 right-0 w-[30%] aspect-square bg-[url('/stars-texture.png')] bg-cover opacity-30"></div>
          </div>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
          
          {/* Dynamic gradient motion */}
          <div className="absolute -top-[40%] -bottom-[40%] left-[40%] right-0 bg-gradient-radial from-blue-700/20 via-transparent to-transparent blur-3xl"></div>
          <div className="absolute -bottom-[40%] -left-[40%] w-[80%] aspect-square bg-gradient-radial from-red-700/20 via-transparent to-transparent blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
                <ShieldCheckIcon className="h-4 w-4 mr-2 text-[#EAB308]" />
                Join Thousands of Veterans
              </div>
              
              <h2 
                id="cta-heading"
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white"
              >
                Ready to Access Your <span className="text-[#EAB308]">Veteran Benefits</span>?
              </h2>
              
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Create your free account today to save resources, connect with other veterans, and get personalized recommendations based on your service history.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-[#EAB308] text-[#1A2C5B] font-semibold rounded-md hover:bg-[#FACC15] transition-all shadow-lg shadow-[#EAB308]/20 inline-flex items-center justify-center focus:ring-4 focus:ring-[#EAB308]/30 focus:outline-none"
                  aria-label="Create a veteran account"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/resources"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-md hover:bg-white/20 transition-all inline-flex items-center justify-center border border-white/20 focus:ring-4 focus:ring-white/20 focus:outline-none"
                  aria-label="Browse all veteran resources"
                >
                  Explore All Resources
                </Link>
              </div>
              
              <div className="mt-10 pt-10 border-t border-white/10">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <li className="flex items-center text-gray-200">
                    <svg className="w-5 h-5 mr-2 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free to use, always
                  </li>
                  <li className="flex items-center text-gray-200">
                    <svg className="w-5 h-5 mr-2 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Secure military verification
                  </li>
                  <li className="flex items-center text-gray-200">
                    <svg className="w-5 h-5 mr-2 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Personalized recommendations
                  </li>
                  <li className="flex items-center text-gray-200">
                    <svg className="w-5 h-5 mr-2 text-[#EAB308]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Connect with other veterans
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Featured benefits card */}
                <div className="absolute top-0 right-0 w-80 p-6 bg-white rounded-xl shadow-2xl transform -translate-y-1/4 translate-x-1/4 z-20">
                  <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <AcademicCapIcon className="h-6 w-6 text-[#1A2C5B]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">GI Bill Benefits</h3>
                  <p className="text-gray-600 mb-4">Access education funding, housing allowance, and book stipends through VA programs.</p>
                  <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Top Searched
                    </span>
                  </div>
                </div>
                
                {/* Main device mockup */}
                <div className="relative bg-white p-3 rounded-3xl shadow-2xl z-10">
                  <div className="aspect-[9/16] w-64 bg-white rounded-2xl overflow-hidden border-8 border-gray-800">
                    <div className="h-full w-full bg-gradient-to-b from-blue-50 to-white flex flex-col">
                      {/* App header */}
                      <div className="bg-[#1A2C5B] text-white py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-[#EAB308] flex items-center justify-center text-[#1A2C5B] font-bold text-xs mr-2">
                            V1
                          </div>
                          <div className="text-sm font-semibold">Vet1Stop</div>
                        </div>
                      </div>
                      
                      {/* App content */}
                      <div className="p-3 flex-1">
                        <div className="rounded-lg bg-white shadow-sm p-3 mb-2">
                          <div className="w-full h-20 bg-gradient-to-r from-blue-100 to-blue-50 rounded mb-2"></div>
                          <div className="w-3/4 h-3 bg-gray-200 rounded mb-1"></div>
                          <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                        </div>
                        <div className="rounded-lg bg-white shadow-sm p-3 mb-2">
                          <div className="w-full h-20 bg-gradient-to-r from-red-100 to-red-50 rounded mb-2"></div>
                          <div className="w-3/4 h-3 bg-gray-200 rounded mb-1"></div>
                          <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                        </div>
                        <div className="rounded-lg bg-white shadow-sm p-3">
                          <div className="w-full h-20 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded mb-2"></div>
                          <div className="w-3/4 h-3 bg-gray-200 rounded mb-1"></div>
                          <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Secondary feature card */}
                <div className="absolute bottom-4 -left-10 w-64 p-5 bg-white rounded-xl shadow-xl z-20">
                  <div className="flex items-center mb-3">
                    <HeartIcon className="h-5 w-5 text-[#B22234] mr-2" />
                    <h3 className="text-base font-bold text-[#1A2C5B]">VA Healthcare Eligibility</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">2K+ Views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="bg-white py-8 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#B22234] via-white to-[#1A2C5B]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#1A2C5B] flex items-center justify-center text-white font-bold text-sm mr-3">
                V1
              </div>
              <span className="text-[#1A2C5B] font-bold text-lg">Vet1Stop</span>
            </div>
            
            <div className="flex gap-6">
              <Link href="/about" className="text-gray-700 hover:text-[#1A2C5B] transition-colors">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-[#1A2C5B] transition-colors">Contact</Link>
              <Link href="/privacy" className="text-gray-700 hover:text-[#1A2C5B] transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-700 hover:text-[#1A2C5B] transition-colors">Terms</Link>
            </div>
            
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Vet1Stop. All rights reserved.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
