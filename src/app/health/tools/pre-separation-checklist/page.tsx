'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// Define the checklist categories and items
const checklistData = [
  {
    id: 'documentation',
    title: 'Documentation & Records',
    description: 'Gather and organize all necessary medical documentation before separation.',
    items: [
      {
        id: 'document-health-issues',
        text: 'Document all health issues with unit medical staff',
        details: 'Start reaching out to your unit\'s medical staff for documentation of all health issues, even if they seem minor. If you haven\'t been seen for ongoing medical issues, now is the time.',
        tips: 'Many veterans report difficulty filing VA claims later because they didn\'t properly document health issues while in the military. Every visit creates a record that can support future claims.',
        deadline: '12-24 months before separation',
        links: [
          { text: 'Military OneSource Health Resources', url: 'https://www.militaryonesource.mil/health-wellness/' },
          { text: 'TRICARE Appointment Scheduling', url: 'https://www.tricare.mil/ContactUs/CallUs/appointments' }
        ]
      },
      {
        id: 'medical-records',
        text: 'Request complete copy of military medical records',
        details: 'Obtain both electronic and paper records from all duty stations and deployments. Include dental records.',
        tips: 'Use Medical Records Request portal on TriCare Online or visit your Military Treatment Facility Records Department.',
        deadline: '6-12 months before separation',
        links: [
          { text: 'TRICARE Medical Records Info', url: 'https://www.tricare.mil/Resources/MedicalRecords' }
        ]
      },
      {
        id: 'deployment-records',
        text: 'Gather deployment-related health records and assessments',
        details: 'Include Pre/Post Deployment Health Assessments (DD Form 2795, 2796) and any deployment-related medical visits.',
        tips: 'These records are critical for establishing service connection for conditions related to deployments.',
        deadline: '6-12 months before separation',
        links: [
          { text: 'Deployment Health Records', url: 'https://www.pdhealth.mil/resources/deployment-health-resources' }
        ]
      },
      {
        id: 'immunization-records',
        text: 'Obtain immunization records',
        details: 'Request a copy of your complete immunization history.',
        tips: 'Available through the Military Health System GENESIS patient portal or Military Treatment Facility.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'MHS GENESIS Patient Portal', url: 'https://myaccess.dmdc.osd.mil/identitymanagement/' }
        ]
      },
      {
        id: 'medication-list',
        text: 'Create list of current medications and treatments',
        details: 'Document all prescribed medications, dosages, and treatments.',
        tips: 'Include start dates and the conditions they treat. Ask your military provider for a complete medication history.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'Medication List Template', url: 'https://www.va.gov/health-care/refill-track-prescriptions/' }
        ]
      },
      {
        id: 'dd214',
        text: 'Ensure DD-214 properly documents service',
        details: 'Verify your DD-214 accurately reflects your service periods, deployments, and awards.',
        tips: 'This document is critical for determining VA healthcare eligibility and priority group assignment.',
        deadline: '1-3 months before separation',
        links: [
          { text: 'DD-214 Information', url: 'https://www.va.gov/records/get-military-service-records/' }
        ]
      }
    ]
  },
  {
    id: 'medical-exams',
    title: 'Medical Examinations & Assessments',
    description: 'Schedule and complete necessary exams to document your health status.',
    items: [
      {
        id: 'separation-exam',
        text: 'Schedule Separation History and Physical Examination (SHPE)',
        details: 'This comprehensive exam documents your health status at separation.',
        tips: 'Schedule as early as possible (90-180 days before separation) and ensure all health concerns are documented.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'SHPE Information', url: 'https://www.health.mil/Military-Health-Topics/Access-Cost-Quality-and-Safety/Access-to-Healthcare/DoD-VA-Sharing-Initiatives/Separation-Health-Assessment' }
        ]
      },
      {
        id: 'specialty-appointments',
        text: 'Schedule appointments with specialists for ongoing conditions',
        details: 'Get current assessments of any chronic or ongoing health conditions.',
        tips: 'Request treatment plans and recommendations for continued care after separation.',
        deadline: '3-6 months before separation',
        links: []
      },
      {
        id: 'dental-exam',
        text: 'Complete dental examination',
        details: 'Document current dental status before separation.',
        tips: 'VA dental care eligibility is limited, so address any dental needs while still on active duty.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'VA Dental Care Eligibility', url: 'https://www.va.gov/health-care/about-va-health-benefits/dental-care/' }
        ]
      },
      {
        id: 'mental-health',
        text: 'Schedule mental health assessment if applicable',
        details: 'Document any mental health conditions, including anxiety, depression, PTSD, etc.',
        tips: 'Mental health documentation is critical for future VA care and benefits.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'VA Mental Health Services', url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/' }
        ]
      },
      {
        id: 'tbi-assessment',
        text: 'Complete TBI assessment if exposed to blasts or head injuries',
        details: 'Document any history of traumatic brain injury or concussions.',
        tips: 'Even "minor" head injuries should be documented before separation.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'VA TBI Information', url: 'https://www.va.gov/health-care/health-needs-conditions/physical-disability/traumatic-brain-injury/' }
        ]
      }
    ]
  },
  {
    id: 'va-enrollment',
    title: 'VA Healthcare Enrollment',
    description: 'Begin the VA enrollment process before separation to minimize gaps in coverage.',
    items: [
      {
        id: 'va-form',
        text: 'Complete VA Form 10-10EZ (Application for Health Benefits)',
        details: 'Submit your application for VA healthcare benefits.',
        tips: 'Apply online through VA.gov for fastest processing. You can apply up to 12 months before separation.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'VA Healthcare Application', url: 'https://www.va.gov/health-care/apply/application/introduction' }
        ]
      },
      {
        id: 'va-priority',
        text: 'Research your likely VA Priority Group assignment',
        details: 'Understand which VA Priority Group you may qualify for and what it means for your care.',
        tips: 'Priority groups determine cost-sharing requirements and access to certain services.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'VA Priority Groups', url: 'https://www.va.gov/health-care/eligibility/priority-groups/' },
          { text: 'Priority Group Calculator', url: '/health/tools/priority-calculator' }
        ]
      },
      {
        id: 'va-facilities',
        text: 'Identify VA facilities in your post-separation location',
        details: 'Research VA Medical Centers, outpatient clinics, and specialty care options in your area.',
        tips: 'Consider proximity to VA facilities when planning where you will live after separation.',
        deadline: '6-12 months before separation',
        links: [
          { text: 'VA Facility Locator', url: 'https://www.va.gov/find-locations/' }
        ]
      },
      {
        id: 'enrollment-status',
        text: 'Verify VA enrollment status before separation',
        details: 'Check that your VA healthcare application has been processed and approved.',
        tips: 'You should receive an enrollment confirmation letter with your assigned Priority Group.',
        deadline: '1 month before separation',
        links: [
          { text: 'Check VA Enrollment Status', url: 'https://www.va.gov/health-care/eligibility/check-status/' }
        ]
      },
      {
        id: 'va-appointments',
        text: 'Schedule initial VA healthcare appointments',
        details: 'Set up your first VA primary care appointment for soon after separation.',
        tips: 'Try to schedule this before separation to minimize gaps in healthcare coverage.',
        deadline: '1 month before separation',
        links: [
          { text: 'VA Appointment Scheduling', url: 'https://www.va.gov/health-care/schedule-view-va-appointments/' }
        ]
      }
    ]
  },
  {
    id: 'transitional-coverage',
    title: 'Transitional Healthcare Coverage',
    description: 'Understand options for continued healthcare coverage during transition.',
    items: [
      {
        id: 'tamp',
        text: 'Verify eligibility for Transitional Assistance Management Program (TAMP)',
        details: 'TAMP provides 180 days of transitional health care benefits after separation for eligible members.',
        tips: 'Not all separating service members qualify; verify your eligibility based on separation type.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'TRICARE TAMP Information', url: 'https://tricare.mil/Plans/SpecialPrograms/TAMP' }
        ]
      },
      {
        id: 'chcbp',
        text: 'Research Continued Health Care Benefit Program (CHCBP)',
        details: 'CHCBP provides temporary healthcare coverage for 18-36 months after TRICARE eligibility ends.',
        tips: 'This is a premium-based program that must be purchased within 60 days of loss of TRICARE.',
        deadline: '1-3 months before separation',
        links: [
          { text: 'CHCBP Information', url: 'https://www.humanamilitary.com/beneficiary/benefit-guidance/special-programs/chcbp/' }
        ]
      },
      {
        id: 'private-insurance',
        text: 'Research private healthcare insurance options',
        details: 'Explore health insurance through the marketplace or employers.',
        tips: 'Consider supplemental coverage even if enrolling in VA healthcare.',
        deadline: '1-3 months before separation',
        links: [
          { text: 'Healthcare Marketplace for Veterans', url: 'https://www.healthcare.gov/veterans/' }
        ]
      },
      {
        id: 'coverage-gaps',
        text: 'Identify potential gaps in healthcare coverage',
        details: 'Plan for any periods where you might not have healthcare coverage.',
        tips: 'Document your separation date, TAMP end date, and VA enrollment effective date.',
        deadline: '1-3 months before separation',
        links: []
      },
      {
        id: 'family-coverage',
        text: 'Plan for dependent healthcare coverage',
        details: 'Research options for family members who will lose TRICARE eligibility.',
        tips: 'Family members are generally not eligible for VA healthcare; separate planning is required.',
        deadline: '3-6 months before separation',
        links: [
          { text: 'Family Healthcare Options', url: 'https://www.militaryonesource.mil/health-care/tricare/life-changes-and-tricare/separating-from-service/' }
        ]
      }
    ]
  },
  {
    id: 'prescriptions',
    title: 'Medications & Prescriptions',
    description: 'Ensure continuous access to needed medications during transition.',
    items: [
      {
        id: 'refill-prescriptions',
        text: 'Refill all prescriptions before separation',
        details: 'Get maximum allowed refills for all current medications before leaving the military.',
        tips: 'Request a 90-day supply when possible to cover the transition period.',
        deadline: '1 month before separation',
        links: []
      },
      {
        id: 'prescription-documentation',
        text: 'Get documentation for all current prescriptions',
        details: 'Obtain written prescriptions or detailed medication lists from your military providers.',
        tips: 'Include dosage, frequency, and purpose for each medication.',
        deadline: '1-3 months before separation',
        links: []
      },
      {
        id: 'va-formulary',
        text: 'Check VA formulary for your medications',
        details: 'Verify if your current medications are covered by the VA pharmacy benefit.',
        tips: 'Identify alternatives if any of your medications are not on the VA formulary.',
        deadline: '1-3 months before separation',
        links: [
          { text: 'VA Formulary Search', url: 'https://www.pbm.va.gov/nationalformulary.asp' }
        ]
      },
      {
        id: 'specialty-medications',
        text: 'Make plans for specialty medications',
        details: 'Coordinate transition plan for any specialty medications (e.g., biologics, injectables).',
        tips: 'Some medications may require special authorization or specialty pharmacy services.',
        deadline: '1-3 months before separation',
        links: []
      },
      {
        id: 'healthevet-account',
        text: 'Create My HealtheVet account for VA prescriptions',
        details: 'Register for the VA online patient portal to manage prescriptions after transition.',
        tips: 'Upgrade to Premium account for full prescription management features.',
        deadline: '1 month before separation',
        links: [
          { text: 'My HealtheVet Registration', url: 'https://www.myhealth.va.gov/mhv-portal-web/home' }
        ]
      }
    ]
  }
];

export default function PreSeparationChecklist() {
  const [completedItems, setCompletedItems] = useState<{[key: string]: boolean}>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load saved progress from localStorage on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('vaultProgressChecklist');
    if (savedProgress) {
      try {
        setCompletedItems(JSON.parse(savedProgress));
      } catch (e) {
        console.error('Error loading saved checklist progress:', e);
      }
    }
    
    // Set first category as active by default
    if (checklistData.length > 0 && !activeCategory) {
      setActiveCategory(checklistData[0].id);
    }
  }, []);
  
  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vaultProgressChecklist', JSON.stringify(completedItems));
  }, [completedItems]);
  
  const toggleItemCompletion = (itemId: string) => {
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  const calculateProgress = () => {
    let totalItems = 0;
    let completedCount = 0;
    
    checklistData.forEach(category => {
      category.items.forEach(item => {
        totalItems++;
        if (completedItems[item.id]) {
          completedCount++;
        }
      });
    });
    
    return {
      total: totalItems,
      completed: completedCount,
      percentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0
    };
  };
  
  const progress = calculateProgress();
  
  const filteredChecklistData = searchTerm 
    ? checklistData.map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.details.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.items.length > 0)
    : checklistData;
    
  const resetProgress = () => {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      setCompletedItems({});
    }
  };
  
  const downloadChecklist = () => {
    // Create text content for the checklist
    let content = "# VA HEALTHCARE TRANSITION CHECKLIST\n\n";
    content += `Generated on ${new Date().toLocaleDateString()}\n\n`;
    
    checklistData.forEach(category => {
      content += `## ${category.title}\n\n`;
      
      category.items.forEach(item => {
        const status = completedItems[item.id] ? "[COMPLETED]" : "[PENDING]";
        content += `${status} ${item.text}\n`;
        content += `   Details: ${item.details}\n`;
        content += `   Deadline: ${item.deadline}\n`;
        if (item.tips) content += `   Tips: ${item.tips}\n`;
        if (item.links && item.links.length > 0) {
          content += "   Resources:\n";
          item.links.forEach(link => {
            content += `    - ${link.text}: ${link.url}\n`;
          });
        }
        content += "\n";
      });
      
      content += "\n";
    });
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'va-healthcare-transition-checklist.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/health/resources/guides/military-to-va-transition" 
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Military to VA Healthcare Transition Guide
          </Link>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#1A2C5B] flex items-center">
                <ClipboardDocumentCheckIcon className="h-8 w-8 mr-2 text-[#1A2C5B]" />
                Pre-Separation Healthcare Checklist
              </h1>
              <p className="text-gray-600 mt-2">
                Complete these steps before military separation to ensure a smooth healthcare transition.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={downloadChecklist}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2 text-gray-500" />
                Download Checklist
              </button>
              
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PrinterIcon className="h-5 w-5 mr-2 text-gray-500" />
                Print Checklist
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <div className="bg-white rounded-full h-2.5 w-64 mb-1">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{progress.completed} of {progress.total} tasks completed</span> ({progress.percentage}%)
              </p>
            </div>
            
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search checklist items..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <button
                onClick={resetProgress}
                className="ml-3 px-3 py-2 text-sm text-red-600 hover:text-red-800"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content with categories and checklist items */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Category tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              {filteredChecklistData.map((category) => {
                const categoryItemsCompleted = category.items.filter(item => completedItems[item.id]).length;
                const categoryItemsTotal = category.items.length;
                const categoryProgress = Math.round((categoryItemsCompleted / categoryItemsTotal) * 100) || 0;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-4 py-4 text-sm font-medium whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:border-b-2'
                    }`}
                  >
                    <div className="flex items-center">
                      <span>{category.title}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        categoryProgress === 100
                          ? 'bg-green-100 text-green-800'
                          : categoryProgress > 0
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {categoryItemsCompleted}/{categoryItemsTotal}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Checklist items for selected category */}
          <div className="p-6">
            {searchTerm && filteredChecklistData.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No matching items</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try a different search term or clear the search.
                </p>
              </div>
            ) : (
              filteredChecklistData.map((category) => (
                <div 
                  key={category.id} 
                  className={activeCategory === category.id || searchTerm ? 'block' : 'hidden'}
                >
                  {searchTerm && (
                    <h2 className="text-xl font-bold text-[#1A2C5B] mb-2">{category.title}</h2>
                  )}
                  
                  <p className="text-gray-600 mb-6">{category.description}</p>
                  
                  <ul className="space-y-4">
                    {category.items.map((item) => (
                      <li 
                        key={item.id} 
                        className={`border rounded-lg overflow-hidden transition-all ${
                          completedItems[item.id] 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-1">
                              <input
                                id={item.id}
                                type="checkbox"
                                checked={completedItems[item.id] || false}
                                onChange={() => toggleItemCompletion(item.id)}
                                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <label htmlFor={item.id} className="block text-lg font-medium text-gray-900 cursor-pointer">
                                {item.text}
                              </label>
                              <div className="mt-1 text-sm text-gray-700">
                                <p>{item.details}</p>
                                
                                {item.tips && (
                                  <div className="mt-2 bg-blue-50 p-3 rounded-md">
                                    <p className="text-sm text-gray-800">
                                      <span className="font-semibold">Tip:</span> {item.tips}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="mt-3 flex items-center">
                                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                    Deadline: {item.deadline}
                                  </span>
                                </div>
                                
                                {item.links && item.links.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Helpful Resources:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {item.links.map((link, index) => (
                                        <a
                                          key={index}
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                          {link.text}
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Related tools section */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-[#1A2C5B] mb-4">Related Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/health/tools/transition-timeline"
              className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50"
            >
              <h3 className="text-lg font-semibold text-[#1A2C5B] mb-2">Healthcare Transition Timeline</h3>
              <p className="text-gray-600">Interactive timeline to guide you through the healthcare transition process.</p>
            </Link>
            
            <Link
              href="/health/tools/priority-calculator"
              className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50"
            >
              <h3 className="text-lg font-semibold text-[#1A2C5B] mb-2">VA Priority Group Calculator</h3>
              <p className="text-gray-600">Estimate which VA priority group you may qualify for based on your service.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
