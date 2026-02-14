import React from 'react';
import { 
  HeartIcon,
  BriefcaseIcon,
  BeakerIcon,
  TruckIcon,
  RectangleGroupIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function BenefitsOverview() {
  const coreServices = [
    {
      title: 'Primary Care',
      description: 'Regular checkups, preventive care, and treatment for common illnesses and injuries.',
      icon: <HeartIcon className="h-8 w-8 text-blue-500" />,
      details: [
        'Annual physical examinations',
        'Immunizations',
        'Health risk assessments',
        'Routine lab work and tests',
        'Management of chronic conditions'
      ]
    },
    {
      title: 'Specialty Care',
      description: 'Specialized medical services for specific conditions and areas of care.',
      icon: <BeakerIcon className="h-8 w-8 text-blue-500" />,
      details: [
        'Cardiology',
        'Orthopedics',
        'Neurology',
        'Oncology',
        'Mental health services'
      ]
    },
    {
      title: 'Pharmacy Services',
      description: 'Prescription medications with reduced or no copays depending on your priority group.',
      icon: <RectangleGroupIcon className="h-8 w-8 text-blue-500" />,
      details: [
        'Prescription fulfillment',
        'Mail-order pharmacy',
        'Online prescription management',
        'Medication counseling',
        'Over-the-counter medications'
      ]
    },
    {
      title: 'Emergency Care',
      description: 'Treatment for serious injuries or illnesses requiring immediate attention.',
      icon: <TruckIcon className="h-8 w-8 text-blue-500" />,
      details: [
        'Emergency room services',
        'Urgent care',
        'Non-VA emergency care (with prior authorization)',
        'Emergency transportation',
        'Crisis intervention'
      ]
    }
  ];

  const additionalServices = [
    {
      title: 'Mental Health',
      description: 'Comprehensive mental health services, including specialized programs for veterans.',
      highlights: [
        'PTSD treatment programs',
        'Substance use disorder treatment',
        'Depression and anxiety care',
        'Suicide prevention services',
        'Military sexual trauma counseling'
      ]
    },
    {
      title: 'Rehabilitation',
      description: 'Services to help you recover from injury, illness, or improve your ability to function.',
      highlights: [
        'Physical therapy',
        'Occupational therapy',
        'Speech therapy',
        'Blind rehabilitation',
        'Prosthetics and adaptive equipment'
      ]
    },
    {
      title: 'Preventive Care',
      description: 'Services focused on keeping you healthy and preventing disease.',
      highlights: [
        'Health screenings',
        'Nutritional counseling',
        'Weight management',
        'Smoking cessation',
        'Wellness programs'
      ]
    },
    {
      title: 'Specialized Programs',
      description: 'Programs designed specifically for veterans with certain experiences or needs.',
      highlights: [
        'Women Veterans Health Program',
        'Geriatric care',
        'Telehealth services',
        'Homeless veterans programs',
        'Caregiver support'
      ]
    }
  ];

  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">VA Healthcare Benefits Overview</h2>
      
      <p className="mb-6">
        VA healthcare offers a comprehensive range of medical services that go well beyond what many 
        veterans expect. Understanding these benefits can help you make the most of your VA healthcare enrollment.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          <strong>Coverage Level:</strong> VA healthcare is not health insurance, but a healthcare 
          benefits package. Depending on your priority group assignment, you may have minimal or no 
          copayments for covered services.
        </p>
      </div>
      
      <h3 className="text-xl font-semibold mb-4">Core Healthcare Services</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {coreServices.map((service, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center">
              <div className="mr-3">{service.icon}</div>
              <h4 className="text-lg font-semibold text-gray-900">{service.title}</h4>
            </div>
            <div className="p-5">
              <p className="text-gray-700 mb-4">{service.description}</p>
              <h5 className="font-medium text-gray-900 mb-2">Includes:</h5>
              <ul className="space-y-1">
                {service.details.map((detail, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      <h3 className="text-xl font-semibold mb-4">Additional Healthcare Services</h3>
      
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="px-4 py-5 sm:px-6">
              <h4 className="text-lg font-medium text-gray-900">Specialized & Supportive Services</h4>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                These services address specific healthcare needs and situations veterans may face.
              </p>
            </div>
          </div>
          <div className="border-b border-gray-200">
            <dl>
              {additionalServices.map((service, index) => (
                <div key={index} className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <dt className="text-sm font-medium text-gray-900">{service.title}</dt>
                  <dd className="mt-1 text-sm text-gray-700 sm:col-span-2">
                    <p className="mb-2">{service.description}</p>
                    <ul className="space-y-1">
                      {service.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-4">Cost Information & Coverage</h3>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Expense Type</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Priority Groups 1-6</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Priority Groups 7-8</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Preventive Care</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$0</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$0</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Primary Care Visit</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$0</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$15-$50 copay</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Specialty Care Visit</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$0</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$15-$50 copay</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Urgent Care</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$0</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$30 copay</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Medications (30-day supply)</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$0-$11 copay</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$11-$33 copay</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Hospital Inpatient</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$0</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">$224+ per day (varies)</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Important Note:</strong> Actual costs will vary based on your specific priority group 
          assignment, service-connected disabilities, and other factors. Veterans with service-connected 
          disabilities rated 50% or higher receive all care without copayments.
        </p>
      </div>
      
      <h3 className="text-xl font-semibold mb-4">VA Healthcare vs. TRICARE</h3>
      
      <p className="mb-4">
        Many transitioning service members have questions about how VA healthcare differs from TRICARE. 
        Here's a quick comparison:
      </p>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-8">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Feature</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">VA Healthcare</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">TRICARE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Eligibility</td>
              <td className="px-3 py-4 text-sm text-gray-500">Veterans with qualifying service</td>
              <td className="px-3 py-4 text-sm text-gray-500">Active duty, retirees, families</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Cost Structure</td>
              <td className="px-3 py-4 text-sm text-gray-500">Based on priority group</td>
              <td className="px-3 py-4 text-sm text-gray-500">Based on TRICARE plan</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Provider Network</td>
              <td className="px-3 py-4 text-sm text-gray-500">VA facilities & community care</td>
              <td className="px-3 py-4 text-sm text-gray-500">Military & civilian providers</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Family Coverage</td>
              <td className="px-3 py-4 text-sm text-gray-500">Limited (CHAMPVA for some)</td>
              <td className="px-3 py-4 text-sm text-gray-500">Yes, comprehensive</td>
            </tr>
            <tr>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Veteran-Specific Care</td>
              <td className="px-3 py-4 text-sm text-gray-500">Extensive</td>
              <td className="px-3 py-4 text-sm text-gray-500">Limited</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <h4 className="text-lg font-semibold text-green-800 mb-2">Can I Use Both VA Healthcare and TRICARE?</h4>
        <p className="text-green-700">
          Yes! Many veterans are eligible for both VA healthcare and TRICARE (particularly TRICARE For Life). 
          You can use both systems to maximize your benefits. Generally, you'll use VA for service-connected 
          conditions and may use TRICARE for family coverage or to see non-VA providers.
        </p>
      </div>
      
      <h3 className="text-xl font-semibold mb-4">How Vet1Stop Can Help</h3>
      
      <p className="mb-4">
        Our platform offers several resources to help you understand and maximize your VA healthcare benefits:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="flex items-start">
          <WrenchScrewdriverIcon className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium">Benefit Calculators</h4>
            <p className="text-sm text-gray-600">
              Use our tools to estimate your VA healthcare costs based on your priority group and needs
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <HomeIcon className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium">VA Facility Locator</h4>
            <p className="text-sm text-gray-600">
              Find nearby VA medical centers, clinics, and Vet Centers with ratings and directions
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <BriefcaseIcon className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium">Benefit Comparison Tool</h4>
            <p className="text-sm text-gray-600">
              Compare VA healthcare with other options like TRICARE, Medicare, and private insurance
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <UserGroupIcon className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium">Community Support</h4>
            <p className="text-sm text-gray-600">
              Connect with fellow veterans who can share their experiences with VA healthcare
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
