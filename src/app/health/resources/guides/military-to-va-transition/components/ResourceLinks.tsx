import React from 'react';
import { 
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function ResourceLinks() {
  const resourceCategories = [
    {
      title: "Vet1Stop Tools",
      resources: [
        {
          title: "VA Priority Group Calculator",
          description: "Determine which VA priority group you might qualify for based on your service",
          url: "/health/tools/priority-calculator",
          icon: "calculator"
        },
        {
          title: "Healthcare Transition Timeline",
          description: "Interactive timeline for transitioning from military to VA healthcare",
          url: "/health/tools/transition-timeline",
          icon: "timeline"
        },
        {
          title: "Pre-Separation Healthcare Checklist",
          description: "Complete checklist of tasks to prepare for healthcare transition",
          url: "/health/tools/pre-separation-checklist",
          icon: "checklist"
        }
      ]
    },
    {
      title: "Official VA Resources",
      resources: [
        {
          title: "VA Healthcare Application",
          description: "Apply for VA healthcare benefits online",
          url: "https://www.va.gov/health-care/apply/application/introduction",
          icon: "application"
        },
        {
          title: "VA Health Benefits Handbook",
          description: "Comprehensive guide to VA healthcare benefits",
          url: "https://www.va.gov/healthbenefits/resources/publications/hbco/hbco_handbook.asp",
          icon: "handbook"
        },
        {
          title: "VA Form 10-10EZ",
          description: "Application for Health Benefits",
          url: "https://www.va.gov/find-forms/about-form-10-10ez/",
          icon: "form"
        },
        {
          title: "VA Facility Locator",
          description: "Find VA healthcare facilities near you",
          url: "https://www.va.gov/find-locations/",
          icon: "location"
        },
        {
          title: "My HealtheVet",
          description: "VA's online patient portal for veterans",
          url: "https://www.myhealth.va.gov/",
          icon: "portal"
        }
      ]
    },
    {
      title: "DoD Transition Resources",
      resources: [
        {
          title: "TRICARE Transitional Assistance Management Program (TAMP)",
          description: "Temporary healthcare coverage after separation",
          url: "https://tricare.mil/tamp",
          icon: "tricare"
        },
        {
          title: "milConnect Portal",
          description: "Access to military personnel records and benefits",
          url: "https://milconnect.dmdc.osd.mil/",
          icon: "portal"
        },
        {
          title: "Transition Assistance Program (TAP)",
          description: "Resources for transitioning service members",
          url: "https://www.dodtap.mil/",
          icon: "program"
        },
        {
          title: "DoD/VA Joint Health Information Exchange",
          description: "Information about health record sharing",
          url: "https://www.va.gov/health-care/about-va-health-benefits/medical-records/",
          icon: "exchange"
        }
      ]
    },
    {
      title: "Helpful Guides & Checklists",
      resources: [
        {
          title: "Military Separation: Health Coverage Options",
          description: "Official VA guide on health coverage after separation",
          url: "https://www.va.gov/health-care/health-needs-conditions/health-issues-related-to-service-era/",
          icon: "checklist"
        },
        {
          title: "VA Benefits Handbook",
          description: "Comprehensive guide to all VA benefits",
          url: "https://www.va.gov/opa/publications/benefits_book.asp",
          icon: "handbook"
        },
        {
          title: "Health Benefits After Discharge",
          description: "VA guide to healthcare benefits after discharge",
          url: "https://www.va.gov/health-care/eligibility/",
          icon: "timeline"
        },
        {
          title: "VA Priority Groups Explanation",
          description: "Official information on VA priority groups",
          url: "https://www.va.gov/health-care/eligibility/priority-groups/",
          icon: "calculator"
        }
      ]
    },
    {
      title: "Veteran Service Organizations",
      resources: [
        {
          title: "Disabled American Veterans (DAV)",
          description: "Free assistance with VA healthcare enrollment",
          url: "https://www.dav.org/veterans/find-your-local-office/",
          icon: "organization"
        },
        {
          title: "Veterans of Foreign Wars (VFW)",
          description: "Service officers to help with VA benefits",
          url: "https://www.vfw.org/assistance/va-claims-separation-benefits",
          icon: "organization"
        },
        {
          title: "American Legion",
          description: "Assistance with VA healthcare claims and benefits",
          url: "https://www.legion.org/serviceofficers",
          icon: "organization"
        },
        {
          title: "Wounded Warrior Project",
          description: "Support for post-9/11 wounded veterans",
          url: "https://www.woundedwarriorproject.org/programs/benefits-service",
          icon: "organization"
        }
      ]
    }
  ];

  // Helper function to determine icon
  const getIcon = (iconType: string) => {
    switch(iconType) {
      case 'application':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'handbook':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'form':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'location':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'portal':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        );
      case 'tricare':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'program':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'exchange':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'checklist':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'timeline':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'calculator':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'organization':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Resource Directory</h2>
      
      <p className="mb-6">
        This comprehensive directory provides links to all the resources you'll need during your transition 
        from military to VA healthcare. Bookmark this page for easy reference throughout your journey.
      </p>
      
      <div className="space-y-8">
        {resourceCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.resources.map((resource, resourceIndex) => (
                <a 
                  key={resourceIndex}
                  href={resource.url}
                  target={resource.url.startsWith('/') ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mr-3">
                    {getIcon(resource.icon)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="font-medium text-blue-700 mb-1">{resource.title}</h4>
                      {!resource.url.startsWith('/') && (
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1 text-gray-400" />
                      )}
                      {resource.url.includes('.pdf') && (
                        <DocumentArrowDownIcon className="h-4 w-4 ml-1 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8 mb-6">
        <h4 className="text-lg font-semibold text-yellow-800 mb-2">Resources Not Working?</h4>
        <p className="text-yellow-700">
          VA and DoD websites occasionally change their links or undergo maintenance. If you encounter any broken 
          links, please <a href="/contact" className="text-blue-600 hover:underline">report them to us</a>, and we'll update them as quickly as possible.
        </p>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-2">How Vet1Stop Can Help</h4>
        <p className="text-blue-700">
          Our platform saves you time by collecting all these resources in one place. We also offer:
        </p>
        <ul className="mt-2 space-y-1 text-blue-700">
          <li className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Personalized resource recommendations based on your specific situation</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Regular updates to ensure all resources remain current</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Integration with our pathway system to track your progress</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
