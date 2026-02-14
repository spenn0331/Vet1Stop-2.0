import { 
  AcademicCapIcon, 
  BriefcaseIcon, 
  BuildingStorefrontIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  HandRaisedIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import ResourceCard from './ResourceCard';

export default function EmploymentResources() {
  const resources = [
    {
      icon: DocumentTextIcon,
      title: "Military Skills Translator",
      description: "Translate your military occupational specialty (MOS) into equivalent civilian skills and job titles.",
      ctaText: "Translate Your Skills",
      ctaLink: "#"
    },
    {
      icon: ClipboardDocumentListIcon,
      title: "Resume Builder",
      description: "Create a civilian-friendly resume that highlights your military experience and transferable skills.",
      ctaText: "Build Your Resume",
      ctaLink: "#"
    },
    {
      icon: BuildingStorefrontIcon,
      title: "Veteran Job Board",
      description: "Browse job listings from employers committed to hiring veterans and military spouses.",
      ctaText: "Find Job Opportunities",
      ctaLink: "#"
    },
    {
      icon: AcademicCapIcon,
      title: "Training & Certification",
      description: "Discover training programs and certifications to advance your civilian career.",
      ctaText: "Explore Training Options",
      ctaLink: "#"
    },
    {
      icon: HandRaisedIcon,
      title: "Federal Employment",
      description: "Learn about veterans' preference and special hiring authorities for federal jobs.",
      ctaText: "Explore Federal Jobs",
      ctaLink: "#"
    },
    {
      icon: UserGroupIcon,
      title: "Mentorship Program",
      description: "Connect with experienced professionals who can guide your civilian career journey.",
      ctaText: "Find a Mentor",
      ctaLink: "#"
    }
  ];

  return (
    <section id="employment-resources" className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full opacity-70 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full opacity-70 blur-3xl"></div>
      </div>
    
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-blue-50 text-[#1A2C5B] text-sm font-semibold mb-4">
            <BriefcaseIcon className="h-4 w-4 mr-2" />
            Employment Path
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4">
            Employment Resources
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Tools and resources to help you find and advance in a civilian career that values your military experience.
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
              colorScheme="blue"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
