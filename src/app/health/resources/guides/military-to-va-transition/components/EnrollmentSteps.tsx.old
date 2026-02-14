import React from 'react';
import { 
  ArrowDownCircleIcon,
  DocumentTextIcon, 
  CheckCircleIcon, 
  IdentificationIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

export default function EnrollmentSteps() {
  // Define enrollment steps
  const steps = [
    {
      id: 1,
      title: 'Gather Required Documents',
      description: 'Collect your DD214 (discharge papers), personal identification, and information about your health insurance coverage.',
      icon: <DocumentTextIcon className="h-10 w-10 text-blue-500" />,
      tip: 'Keep digital copies of all your military records in a secure, accessible location.',
      link: {
        text: 'Documentation Checklist',
        url: 'https://www.va.gov/health-care/how-to-apply/#what-documents-and-information-do-i-need-to-apply'
      },
      vetOneStopHelp: "Vet1Stop provides information on how to properly store and organize your military records for easy access."
    },
    {
      id: 2,
      title: 'Complete Application (VA Form 10-10EZ)',
      description: "Fill out the Application for Health Benefits (VA Form 10-10EZ). You'll provide information about your military service, financial situation, and current health insurance.",
      icon: <CheckCircleIcon className="h-10 w-10 text-blue-500" />,
      tip: 'Be thorough and accurate when listing service-connected conditions as this affects priority group assignment.',
      link: {
        text: 'Download Form 10-10EZ',
        url: 'https://www.va.gov/find-forms/about-form-10-10ez/'
      },
      vetOneStopHelp: "Vet1Stop offers guidance on common questions when completing your 10-10EZ application."
    },
    {
      id: 3,
      title: 'Submit Your Application',
      description: 'You can apply online, by phone, by mail, or in person at a VA medical center.',
      icon: <ComputerDesktopIcon className="h-10 w-10 text-blue-500" />,
      tip: 'Online application is generally the fastest method. You can save your progress and return later if needed.',
      link: {
        text: 'Apply Online Now',
        url: 'https://www.va.gov/health-care/apply/application/introduction'
      },
      vetOneStopHelp: "Vet1Stop recommends checking your application status if you haven't heard back within a week."
    },
    {
      id: 4,
      title: 'Verify Your Status',
      description: "After applying, you'll receive notification of your enrollment status by mail. You can also check your status online or by calling the VA.",
      icon: <IdentificationIcon className="h-10 w-10 text-blue-500" />,
      tip: 'If more than a week has passed, proactively check your application status rather than waiting.',
      link: {
        text: 'Check Application Status',
        url: 'https://www.va.gov/health-care/apply/application/status'
      },
      vetOneStopHelp: "Vet1Stop offers guidance on interpreting your enrollment status and next steps."
    },
    {
      id: 5,
      title: 'Attend Welcome Orientation',
      description: 'Once enrolled, attend a local VA medical center orientation to learn about available services and how to navigate the VA healthcare system.',
      icon: <BuildingOffice2Icon className="h-10 w-10 text-blue-500" />,
      tip: 'Bring a family member or caregiver to this orientation if possible - they can help remember important information.',
      link: {
        text: 'Find Your VA Location',
        url: 'https://www.va.gov/find-locations/'
      },
      vetOneStopHelp: 'Vet1Stop provides links to help you locate your nearest VA medical center.'
    }
  ];

  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">VA Healthcare Enrollment Steps</h2>
      
      <p className="mb-6">
        Enrolling in VA healthcare is a straightforward process, but it helps to know exactly what to 
        expect. Follow these steps to ensure your transition to VA healthcare goes smoothly.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          <strong>Enrollment Timeline:</strong> The process typically takes 1 week for online applications, 
          though it may take longer during busy periods. Once enrolled, you can begin scheduling appointments 
          immediately.
        </p>
      </div>
      
      <div className="space-y-12 my-8">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Only show connector line between steps (not after the last one) */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-14 h-20 w-0.5 bg-gray-200"></div>
            )}
            
            <div className="relative flex items-start">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 flex-shrink-0">
                {step.icon}
              </div>
              <div className="ml-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Step {step.id}: {step.title}
                </h3>
                <p className="mt-2 text-gray-600">{step.description}</p>
                
                <div className="mt-3 bg-yellow-50 p-3 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Pro Tip:</strong> {step.tip}
                  </p>
                </div>
                
                <div className="mt-3 bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>How Vet1Stop Can Help:</strong> {step.vetOneStopHelp}
                  </p>
                </div>
                
                <div className="mt-4">
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {step.link.text}
                    <ArrowDownCircleIcon className="ml-2 -mr-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="rounded-lg bg-gray-50 p-6 mt-8">
        <h3 className="text-xl font-semibold mb-3">Need Assistance?</h3>
        <p className="mb-4">
          If you need help with your VA healthcare application, several options are available:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <PhoneIcon className="h-6 w-6 text-blue-500 mr-2" />
            <div>
              <h4 className="font-medium">VA Health Benefits Hotline</h4>
              <p className="text-sm text-gray-600">Call 1-877-222-8387 (Mon-Fri, 8 AM - 8 PM ET)</p>
            </div>
          </div>
          <div className="flex items-start">
            <BuildingOffice2Icon className="h-6 w-6 text-blue-500 mr-2" />
            <div>
              <h4 className="font-medium">VA Medical Center</h4>
              <p className="text-sm text-gray-600">Visit in person to get help from an enrollment specialist</p>
            </div>
          </div>
          <div className="flex items-start">
            <IdentificationIcon className="h-6 w-6 text-blue-500 mr-2" />
            <div>
              <h4 className="font-medium">Veteran Service Officer (VSO)</h4>
              <p className="text-sm text-gray-600">
                <a href="/health/connect/vso" className="text-blue-600 hover:text-blue-800">
                  Find a VSO
                </a> to help with your application at no cost
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <DocumentTextIcon className="h-6 w-6 text-blue-500 mr-2" />
            <div>
              <h4 className="font-medium">Vet1Stop Care Navigator</h4>
              <p className="text-sm text-gray-600">
                <a href="/health/chat" className="text-blue-600 hover:text-blue-800">
                  Chat with our AI assistant
                </a> for general guidance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
