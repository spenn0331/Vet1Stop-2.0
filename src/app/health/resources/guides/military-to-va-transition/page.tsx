"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tab } from '@headlessui/react';
import { 
  ClipboardDocumentListIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  IdentificationIcon,
  ClipboardDocumentCheckIcon,
  QuestionMarkCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import GuideHeader from './components/GuideHeader';
import EligibilitySection from './components/EligibilitySection';
import EnrollmentSteps from './components/EnrollmentSteps';
import RecordsTransfer from './components/RecordsTransfer';
import BenefitsOverview from './components/BenefitsOverview';
import FaqSection from './components/FaqSection';
import ResourceLinks from './components/ResourceLinks';

export default function MilitaryToVATransitionGuide() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Tabs configuration
  const tabs = [
    { name: 'Overview', icon: <DocumentTextIcon className="w-5 h-5" /> },
    { name: 'Eligibility', icon: <IdentificationIcon className="w-5 h-5" /> },
    { name: 'Enrollment Steps', icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
    { name: 'Records Transfer', icon: <ClipboardDocumentCheckIcon className="w-5 h-5" /> },
    { name: 'Benefits', icon: <CalendarIcon className="w-5 h-5" /> },
    { name: 'FAQs', icon: <QuestionMarkCircleIcon className="w-5 h-5" /> },
    { name: 'Resources', icon: <PhoneIcon className="w-5 h-5" /> },
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back to resources link */}
      <div className="mb-8">
        <Link 
          href="/health/resources" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Health Resources
        </Link>
      </div>
      
      {/* Guide Header */}
      <GuideHeader />
      
      {/* Tabs Navigation */}
      <div className="mt-8 mb-12 border-b border-gray-200">
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex overflow-x-auto space-x-1 p-1">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex-1 whitespace-nowrap py-2.5 text-sm font-medium leading-5 min-w-0 
                  ${selected 
                    ? 'text-blue-700 border-b-2 border-blue-600 focus:outline-none' 
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                  }`
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  {tab.icon}
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels className="mt-4">
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Military to VA Healthcare Transition Guide</h2>
                <p className="text-lg mb-4">
                  Transitioning from military healthcare to VA healthcare can be complex, but this comprehensive 
                  guide will walk you through the entire process step by step. Whether you're separating, retiring, 
                  or have already left service, this guide provides all the information you need.
                </p>
                <p className="mb-4">
                  The transition involves several key components:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>Determining your eligibility</strong> for VA healthcare benefits</li>
                  <li><strong>Enrolling</strong> in the VA healthcare system</li>
                  <li><strong>Transferring your medical records</strong> from DoD to VA</li>
                  <li><strong>Understanding your benefits</strong> and available services</li>
                  <li><strong>Accessing care</strong> at VA facilities or community providers</li>
                </ul>
                <p className="mb-4">
                  This guide helps simplify this process by providing clear instructions, links to official 
                  resources, downloadable forms, and tips from veterans who have successfully navigated 
                  this transition.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <p className="text-blue-700">
                    <strong>How Vet1Stop Can Help:</strong> Throughout this guide, we'll highlight how 
                    Vet1Stop's tools and resources can assist you with each step of the transition process, 
                    including our personalized healthcare pathway feature that creates a custom checklist 
                    based on your specific situation.
                  </p>
                </div>
                <p>
                  Navigate through the tabs above to explore specific aspects of the transition process, 
                  or continue reading for a complete overview.
                </p>
                
                {/* Quick navigation buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <button 
                    onClick={() => setActiveTab(1)} 
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <IdentificationIcon className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-medium">Check Eligibility</h3>
                    <p className="text-sm text-gray-500">See if you qualify for VA healthcare</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab(2)} 
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ClipboardDocumentListIcon className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-medium">Enrollment Steps</h3>
                    <p className="text-sm text-gray-500">Step-by-step enrollment process</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab(3)} 
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-medium">Records Transfer</h3>
                    <p className="text-sm text-gray-500">Transfer your medical records</p>
                  </button>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <EligibilitySection />
            </Tab.Panel>
            
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <EnrollmentSteps />
            </Tab.Panel>
            
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <RecordsTransfer />
            </Tab.Panel>
            
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <BenefitsOverview />
            </Tab.Panel>
            
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <FaqSection />
            </Tab.Panel>
            
            <Tab.Panel className="rounded-xl p-3 focus:outline-none">
              <ResourceLinks />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      
      {/* Print guide button */}
      <div className="flex justify-center mt-8">
        <button 
          onClick={() => window.print()} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Full Guide
        </button>
      </div>
    </div>
  );
}
