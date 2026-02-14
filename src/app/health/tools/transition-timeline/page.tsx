'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CalendarDaysIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Define the timeline phases
const timelinePhases = [
  {
    id: 'pre-separation',
    title: '12-24 Months Before Separation',
    steps: [
      {
        title: 'Document All Health Issues With Unit Medical Staff',
        description: 'Start reaching out to your unit\'s medical staff for documentation of all health issues, even if they seem minor. If you haven\'t been seen for ongoing medical issues, now is the time. Many veterans report difficulty filing VA claims later because they didn\'t properly document health issues while in the military.',
        importance: 'critical',
        resources: [
          { name: 'Military OneSource Health Resources', url: 'https://www.militaryonesource.mil/health-wellness/' },
          { name: 'TRICARE Appointment Scheduling', url: 'https://www.tricare.mil/ContactUs/CallUs/appointments' }
        ]
      },
      {
        title: 'Attend Transition Assistance Program (TAP)',
        description: 'Participate in the mandatory VA Benefits and Services course to learn about healthcare options.',
        importance: 'critical',
        resources: [
          { name: 'TAP Online Courses', url: 'https://www.tapevents.mil/courses' },
          { name: 'VA Benefits Briefings', url: 'https://www.benefits.va.gov/tap/' }
        ]
      },
      {
        title: 'Schedule Separation Health Assessment',
        description: 'Request your separation health assessment to document your current health status.',
        importance: 'critical',
        resources: [
          { name: 'DoD/VA Separation Health Assessment Info', url: 'https://www.va.gov/disability/va-claim-exam/' }
        ]
      },
      {
        title: 'Gather Medical Records',
        description: 'Begin collecting copies of your medical records, including deployment health assessments and treatment records.',
        importance: 'high',
        resources: [
          { name: 'Medical Records Request', url: 'https://www.tricare.mil/Resources/MedicalRecords' }
        ]
      },
      {
        title: 'Research VA Facilities',
        description: 'Identify VA facilities near your planned post-military residence.',
        importance: 'medium',
        resources: [
          { name: 'VA Facility Locator', url: 'https://www.va.gov/find-locations/' }
        ]
      }
    ]
  },
  {
    id: '6-12-months',
    title: '6-12 Months Before Separation',
    steps: [
      {
        title: 'Register for a VA.gov Account',
        description: 'Create your VA.gov account to access online health services and prepare for future healthcare needs.',
        importance: 'high',
        resources: [
          { name: 'VA.gov Registration', url: 'https://www.va.gov/sign-in/' }
        ]
      },
      {
        title: 'Review Medical Records',
        description: 'Ensure all conditions are documented in your military medical records.',
        importance: 'high',
        resources: [
          { name: 'Medical Records Review Tips', url: 'https://www.va.gov/disability/how-to-file-claim/evidence-needed/' }
        ]
      },
      {
        title: 'Research TRICARE Options',
        description: 'Understand TRICARE options for transitioning service members, including TAMP (Transitional Assistance Management Program).',
        importance: 'high',
        resources: [
          { name: 'TRICARE After Separation', url: 'https://tricare.mil/Plans/SpecialPrograms/TAMP' }
        ]
      },
      {
        title: 'Attend VA Healthcare Workshop',
        description: 'If available, attend specialized workshops about transitioning to VA healthcare.',
        importance: 'medium',
        resources: [
          { name: 'VA Benefits Events', url: 'https://benefits.va.gov/benefits/events.asp' }
        ]
      }
    ]
  },
  {
    id: '3-6-months',
    title: '3-6 Months Before Separation',
    steps: [
      {
        title: 'Apply for VA Healthcare',
        description: 'Submit VA Form 10-10EZ to apply for VA healthcare benefits.',
        importance: 'critical',
        resources: [
          { name: 'VA Healthcare Application', url: 'https://www.va.gov/health-care/apply/application/introduction' }
        ]
      },
      {
        title: 'Schedule Final Military Health Assessments',
        description: 'Complete your Separation History and Physical Examination (SHPE).',
        importance: 'critical',
        resources: [
          { name: 'SHPE Guidelines', url: 'https://www.health.mil/Military-Health-Topics/Access-Cost-Quality-and-Safety/Access-to-Healthcare/DoD-VA-Sharing-Initiatives/Separation-Health-Assessment' }
        ]
      },
      {
        title: 'Create List of Current Medications',
        description: 'Document all current prescriptions and treatment plans.',
        importance: 'medium',
        resources: [
          { name: 'My HealtheVet Pharmacy', url: 'https://www.myhealth.va.gov/mhv-portal-web/pharmacy' }
        ]
      },
      {
        title: 'Research Additional Health Insurance',
        description: 'Consider whether you need supplemental health insurance beyond VA coverage.',
        importance: 'medium',
        resources: [
          { name: 'Healthcare Marketplace', url: 'https://www.healthcare.gov/veterans/' }
        ]
      }
    ]
  },
  {
    id: '1-3-months',
    title: '1-3 Months Before Separation',
    steps: [
      {
        title: 'Confirm VA Healthcare Enrollment Status',
        description: 'Check on the status of your VA healthcare application if already submitted.',
        importance: 'high',
        resources: [
          { name: 'Check Enrollment Status', url: 'https://www.va.gov/health-care/eligibility/check-status/' }
        ]
      },
      {
        title: 'Schedule VA Primary Care Appointment',
        description: 'If already enrolled, schedule your first VA primary care appointment for soon after separation.',
        importance: 'high',
        resources: [
          { name: 'VA Appointment Scheduling', url: 'https://www.va.gov/health-care/schedule-view-va-appointments/' }
        ]
      },
      {
        title: 'Verify TRICARE Coverage End Date',
        description: 'Confirm when your active duty TRICARE coverage ends and when TAMP begins.',
        importance: 'high',
        resources: [
          { name: 'TRICARE Coverage Changes', url: 'https://tricare.mil/LifeEvents/Separating' }
        ]
      },
      {
        title: 'Prepare Health Benefits Questions',
        description: 'Make a list of specific questions about your healthcare transition to ask during final outprocessing.',
        importance: 'medium',
        resources: [
          { name: 'VA Health Benefits FAQs', url: 'https://www.va.gov/health-care/about-va-health-benefits/questions-call-center/' }
        ]
      }
    ]
  },
  {
    id: 'first-90-days',
    title: 'First 90 Days After Separation',
    steps: [
      {
        title: 'Verify VA Enrollment Letter Receipt',
        description: 'Ensure you have received your VA healthcare enrollment confirmation and priority group assignment.',
        importance: 'critical',
        resources: [
          { name: 'VA Health Benefits Questions', url: 'https://www.va.gov/health-care/about-va-health-benefits/customer-service/' }
        ]
      },
      {
        title: 'Attend First VA Primary Care Appointment',
        description: 'Complete your initial VA healthcare appointment and discuss ongoing healthcare needs.',
        importance: 'critical',
        resources: [
          { name: 'What to Expect at First VA Visit', url: 'https://www.va.gov/health-care/about-va-health-services/your-care-team/' }
        ]
      },
      {
        title: 'Register for My HealtheVet Premium Account',
        description: 'Sign up for the VA\'s patient portal for secure messaging with providers and prescription refills.',
        importance: 'high',
        resources: [
          { name: 'My HealtheVet Registration', url: 'https://www.myhealth.va.gov/mhv-portal-web/web/myhealthevet/upgrading-your-my-healthevet-account-through-in-person-or-online-authentication' }
        ]
      },
      {
        title: 'Transfer Specialty Care',
        description: 'Work with VA healthcare providers to establish specialty care if needed.',
        importance: 'high',
        resources: [
          { name: 'VA Specialty Care Services', url: 'https://www.va.gov/health-care/about-va-health-services/specialty-care/' }
        ]
      }
    ]
  },
  {
    id: 'beyond-90-days',
    title: 'Beyond 90 Days',
    steps: [
      {
        title: 'Review VA Priority Group Assignment',
        description: 'Understand your assigned priority group and what it means for your healthcare benefits.',
        importance: 'medium',
        resources: [
          { name: 'VA Priority Groups', url: 'https://www.va.gov/health-care/eligibility/priority-groups/' },
          { name: 'Priority Group Calculator', url: '/health/tools/priority-calculator' }
        ]
      },
      {
        title: 'Apply for Additional VA Programs',
        description: 'Consider specialized VA healthcare programs you may qualify for.',
        importance: 'medium',
        resources: [
          { name: 'VA Healthcare Programs', url: 'https://www.va.gov/health-programs/' }
        ]
      },
      {
        title: 'Schedule Annual Wellness Exam',
        description: 'Maintain your healthcare by scheduling regular preventive care appointments.',
        importance: 'medium',
        resources: [
          { name: 'VA Preventive Care', url: 'https://www.va.gov/health-care/about-va-health-services/preventive-care/' }
        ]
      },
      {
        title: 'Explore VA Community Care Options',
        description: 'Learn about receiving care from community providers when eligible.',
        importance: 'medium',
        resources: [
          { name: 'VA Community Care', url: 'https://www.va.gov/COMMUNITYCARE/programs/veterans/index.asp' }
        ]
      }
    ]
  }
];

const ImportanceBadge = ({ importance }: { importance: string }) => {
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(importance)}`}>
      {importance === 'critical' ? 'Critical' : importance === 'high' ? 'Important' : 'Recommended'}
    </span>
  );
};

export default function TransitionTimeline() {
  const [activePhase, setActivePhase] = useState('pre-separation');
  const [completedSteps, setCompletedSteps] = useState<{[key: string]: boolean}>({});

  const handleToggleComplete = (phaseId: string, stepIndex: number) => {
    const stepId = `${phaseId}-step-${stepIndex}`;
    setCompletedSteps({
      ...completedSteps,
      [stepId]: !completedSteps[stepId]
    });
  };

  const calculateProgress = () => {
    let total = 0;
    let completed = 0;
    
    timelinePhases.forEach(phase => {
      phase.steps.forEach((_, index) => {
        const stepId = `${phase.id}-step-${index}`;
        total++;
        if (completedSteps[stepId]) {
          completed++;
        }
      });
    });
    
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
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
        
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Left sidebar with phases */}
          <div className="md:w-1/4 w-full">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-[#1A2C5B] mb-4">Timeline Phases</h2>
              
              <div className="space-y-2">
                {timelinePhases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => setActivePhase(phase.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activePhase === phase.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {phase.title}
                  </button>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Your Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.completed} of {progress.total} steps completed ({progress.percentage}%)
                </p>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="md:w-3/4 w-full">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <CalendarDaysIcon className="h-6 w-6 text-[#1A2C5B] mr-2" />
                <h1 className="text-2xl font-bold text-[#1A2C5B]">Healthcare Transition Timeline</h1>
              </div>
              
              <p className="text-gray-700 mb-6">
                This interactive timeline guides you through the healthcare transition process from military to VA healthcare. Track your progress by marking steps as complete.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex">
                  <ClockIcon className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Timing is important!</span> Start this process early, ideally 12-24 months before your planned separation date. Some steps have deadlines that can impact your benefits.
                  </p>
                </div>
              </div>
              
              {/* Current phase content */}
              {timelinePhases.map((phase) => (
                <div key={phase.id} className={activePhase === phase.id ? 'block' : 'hidden'}>
                  <div className="border-l-4 border-[#1A2C5B] pl-4 mb-6">
                    <h2 className="text-xl font-bold text-[#1A2C5B]">{phase.title}</h2>
                    <p className="text-gray-600 mt-1">
                      {phase.id === 'pre-separation' && 'Begin planning your healthcare transition early to ensure a smooth process.'}
                      {phase.id === '6-12-months' && 'Focus on gathering information and ensuring your records are in order.'}
                      {phase.id === '3-6-months' && 'Start the formal application process for VA healthcare.'}
                      {phase.id === '1-3-months' && 'Finalize your transition plans and prepare for your separation date.'}
                      {phase.id === 'first-90-days' && 'Complete critical steps to establish your VA healthcare immediately after separation.'}
                      {phase.id === 'beyond-90-days' && 'Maintain and optimize your VA healthcare benefits long-term.'}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    {phase.steps.map((step, index) => {
                      const stepId = `${phase.id}-step-${index}`;
                      const isCompleted = !!completedSteps[stepId];
                      
                      return (
                        <div 
                          key={index} 
                          className={`border rounded-lg p-4 transition-all ${
                            isCompleted ? 'bg-green-50 border-green-200' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className={`text-lg font-medium ${isCompleted ? 'text-green-800' : 'text-[#1A2C5B]'}`}>
                                  {step.title}
                                </h3>
                                <ImportanceBadge importance={step.importance} />
                              </div>
                              <p className="text-gray-600 mt-1">{step.description}</p>
                              
                              {step.resources && step.resources.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Helpful Resources:</h4>
                                  <ul className="space-y-1">
                                    {step.resources.map((resource, i) => (
                                      <li key={i}>
                                        <a 
                                          href={resource.url}
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                                        >
                                          {resource.name}
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleToggleComplete(phase.id, index)}
                              className={`ml-4 p-2 rounded-full ${
                                isCompleted 
                                  ? 'text-green-600 hover:bg-green-100' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              <CheckCircleIcon 
                                className={`h-6 w-6 ${isCompleted ? 'fill-current' : 'stroke-current'}`} 
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              <div className="mt-8 flex justify-between">
                <Link
                  href="/health/tools/pre-separation-checklist"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Pre-Separation Checklist
                </Link>
                
                <Link
                  href="/health/tools/priority-calculator"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Priority Group Calculator
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
