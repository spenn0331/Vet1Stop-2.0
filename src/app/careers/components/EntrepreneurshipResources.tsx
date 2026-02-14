import { 
  BuildingStorefrontIcon, 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  LightBulbIcon, 
  UserGroupIcon, 
  WrenchScrewdriverIcon 
} from '@heroicons/react/24/outline';
import ResourceCard from './ResourceCard';

export default function EntrepreneurshipResources() {
  const resources = [
    {
      icon: DocumentTextIcon,
      title: "Business Plan Builder",
      description: "Create a professional business plan that leverages your military experience and skills.",
      ctaText: "Build Your Business Plan",
      ctaLink: "#"
    },
    {
      icon: CurrencyDollarIcon,
      title: "Funding Resources",
      description: "Discover grants, loans, and investment opportunities specifically for veteran entrepreneurs.",
      ctaText: "Find Funding Options",
      ctaLink: "#"
    },
    {
      icon: BuildingStorefrontIcon,
      title: "Business Certification",
      description: "Get certified as a Veteran-Owned Small Business (VOSB) or Service-Disabled Veteran-Owned Small Business.",
      ctaText: "Certification Guide",
      ctaLink: "#"
    },
    {
      icon: ClipboardDocumentListIcon,
      title: "Government Contracting",
      description: "Learn how to access government contracts set aside for veteran-owned businesses.",
      ctaText: "Contract Opportunities",
      ctaLink: "#"
    },
    {
      icon: UserGroupIcon,
      title: "Mentorship Network",
      description: "Connect with experienced veteran entrepreneurs who can guide your business journey.",
      ctaText: "Find a Business Mentor",
      ctaLink: "#"
    },
    {
      icon: WrenchScrewdriverIcon,
      title: "Business Skills Training",
      description: "Access training in marketing, finance, operations, and other essential business skills.",
      ctaText: "Explore Training",
      ctaLink: "#"
    }
  ];

  return (
    <section id="entrepreneurship-resources" className="py-20 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-50 rounded-full opacity-70 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-50 rounded-full opacity-70 blur-3xl"></div>
      </div>
    
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-amber-50 text-[#1A2C5B] text-sm font-semibold mb-4">
            <LightBulbIcon className="h-4 w-4 mr-2" />
            Entrepreneurship Path
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4">
            Entrepreneurship Resources
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Resources to help you start, grow, and scale your own business as a veteran entrepreneur.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <ResourceCard
              key={index}
              icon={resource.icon}
              title={resource.title}
              description={resource.description}
              ctaText={resource.ctaText}
              ctaLink={resource.ctaLink}
              colorScheme="amber"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
