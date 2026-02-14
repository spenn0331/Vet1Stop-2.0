"use client";

import { CheckCircleIcon, DocumentTextIcon, UserGroupIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import PlaceholderImage from '@/components/common/PlaceholderImage';
import Accordion from './Accordion';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

const benefitCards = [
  {
    title: "Medical Care",
    description: "Comprehensive medical services including preventive care, inpatient and outpatient services, and specialized care.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  },
  {
    title: "Prescription Medications",
    description: "Access to prescribed medications with potential cost savings through VA copays and mail-order service.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  },
  {
    title: "Mental Health Services",
    description: "Specialized services for conditions like PTSD, depression, substance use disorders, and military sexual trauma.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  },
  {
    title: "Specialized Care",
    description: "Programs for specific needs including rehabilitation, prosthetics, spinal cord injuries, and traumatic brain injury.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  },
  {
    title: "Women Veterans Health",
    description: "Gender-specific primary and specialty care designed for the unique needs of women veterans.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  },
  {
    title: "Dental Care",
    description: "Available for qualifying veterans based on service connection, disability status, or other eligibility factors.",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 0 5.196 3 3 3 0 0 0-5.196-3Zm1.536-.887a2.165 2.165 0 0 0-1.083-1.838c-.005-.352-.053-.695-.14-1.025m3.173 2.863L9.384 12.75m3.173 2.863a2.164 2.164 0 0 1-1.083 1.839c.005.351.054.695.14 1.024m-1.614-2.864 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.33 4.33 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664" />
    </svg>
  },
];

const priorityGroups = [
  { 
    id: 1, 
    title: "Priority Group 1", 
    description: "Veterans with VA-rated service-connected disabilities 50% or more disabling" 
  },
  { 
    id: 2, 
    title: "Priority Group 2", 
    description: "Veterans with VA-rated service-connected disabilities 30% or 40% disabling" 
  },
  { 
    id: 3, 
    title: "Priority Group 3", 
    description: "Veterans with VA-rated service-connected disabilities 10% or 20% disabling, Purple Heart recipients, former POWs" 
  },
  { 
    id: 4, 
    title: "Priority Group 4", 
    description: "Veterans who receive increased compensation based on need of regular aid and attendance, catastrophically disabled" 
  },
  { 
    id: 5, 
    title: "Priority Group 5", 
    description: "Non-service-connected Veterans and service-connected Veterans rated 0% disabled with annual income below VA's threshold" 
  },
  { 
    id: 6, 
    title: "Priority Group 6", 
    description: "Veterans of the Vietnam War, Persian Gulf War, radiation exposure, Agent Orange exposure, or Camp Lejeune contamination" 
  },
  { 
    id: 7, 
    title: "Priority Group 7", 
    description: "Veterans with income above VA's threshold but below geographic income threshold who agree to copays" 
  },
  { 
    id: 8, 
    title: "Priority Group 8", 
    description: "Veterans with income above both VA's national threshold and geographic income threshold who agree to copays" 
  }
];

const enrollmentSteps = [
  {
    title: "Check Eligibility",
    description: "Determine if you qualify for VA healthcare based on service history and discharge status",
    icon: <IdentificationIcon className="h-8 w-8 text-[#1A2C5B]" />
  },
  {
    title: "Gather Documents",
    description: "Prepare your DD214, personal identification, and income information",
    icon: <DocumentTextIcon className="h-8 w-8 text-[#1A2C5B]" />
  },
  {
    title: "Complete Application",
    description: "Apply online through VA.gov, by mail with VA Form 10-10EZ, or in-person at a VA facility",
    icon: <CheckCircleIcon className="h-8 w-8 text-[#1A2C5B]" />
  },
  {
    title: "Confirm Enrollment",
    description: "Receive a determination letter detailing your enrollment status and priority group",
    icon: <UserGroupIcon className="h-8 w-8 text-[#1A2C5B]" />
  }
];

const accordionItems = [
  {
    id: 'eligibility',
    title: 'Eligibility & Priority Groups',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          VA healthcare eligibility is based on various factors including service-connected disabilities, income level, and specific periods of service.
        </p>
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-2">Priority Groups</h4>
          <ul className="list-decimal pl-5 space-y-1 text-blue-700">
            <li>Veterans with service-connected disabilities rated 50% or more</li>
            <li>Veterans with service-connected disabilities rated 30-40%</li>
            <li>Veterans who are former POWs or received Purple Heart</li>
            <li>Veterans with service-connected disabilities rated 10-20%</li>
            <li>Veterans of specific campaigns or with special circumstances</li>
            <li>Veterans with low income or specific service periods</li>
            <li>Veterans seeking care for specific conditions</li>
            <li>All other eligible veterans</li>
          </ul>
        </div>
        <p className="text-gray-600">
          Your priority group determines copayments and enrollment waiting periods. Contact your local VA facility for a personalized assessment.
        </p>
      </div>
    )
  },
  {
    id: 'enrollment',
    title: 'Enrollment Process',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Enrolling in VA healthcare is a straightforward process that can be completed online, by mail, or in person at a VA facility.
        </p>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="bg-[#1A2C5B] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 font-bold text-sm">1</div>
            <p className="text-gray-600 flex-1"><strong>Apply Online</strong>: Use the VA.gov Health Care Application to submit your information securely.</p>
          </div>
          <div className="flex items-start">
            <div className="bg-[#1A2C5B] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 font-bold text-sm">2</div>
            <p className="text-gray-600 flex-1"><strong>Verification</strong>: VA will verify your military service and assess your priority group.</p>
          </div>
          <div className="flex items-start">
            <div className="bg-[#1A2C5B] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 font-bold text-sm">3</div>
            <p className="text-gray-600 flex-1"><strong>Notification</strong>: You'll receive information about your benefits and next steps for accessing care.</p>
          </div>
        </div>
        <p className="text-gray-600">
          Already enrolled? Update your information at any time through VA.gov to ensure uninterrupted care.
        </p>
      </div>
    )
  },
  {
    id: 'covered-services',
    title: 'Covered Services',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          VA healthcare provides comprehensive medical services based on your specific needs and eligibility.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-l-4 border-[#B22234] pl-3 py-2">
            <h4 className="font-medium text-[#1A2C5B] mb-1">Primary Care</h4>
            <p className="text-gray-600 text-sm">Regular check-ups, preventive services, and health management</p>
          </div>
          <div className="border-l-4 border-[#B22234] pl-3 py-2">
            <h4 className="font-medium text-[#1A2C5B] mb-1">Mental Health</h4>
            <p className="text-gray-600 text-sm">Counseling, therapy, and treatment for PTSD and other conditions</p>
          </div>
          <div className="border-l-4 border-[#B22234] pl-3 py-2">
            <h4 className="font-medium text-[#1A2C5B] mb-1">Specialty Care</h4>
            <p className="text-gray-600 text-sm">Cardiology, oncology, orthopedics, and other specialized services</p>
          </div>
          <div className="border-l-4 border-[#B22234] pl-3 py-2">
            <h4 className="font-medium text-[#1A2C5B] mb-1">Prescription Drugs</h4>
            <p className="text-gray-600 text-sm">Medications through VA pharmacies with minimal copays</p>
          </div>
          <div className="border-l-4 border-[#B22234] pl-3 py-2">
            <h4 className="font-medium text-[#1A2C5B] mb-1">Dental Care</h4>
            <p className="text-gray-600 text-sm">Available for eligible veterans based on priority group</p>
          </div>
          <div className="border-l-4 border-[#B22234] pl-3 py-2">
            <h4 className="font-medium text-[#1A2C5B] mb-1">Long-Term Care</h4>
            <p className="text-gray-600 text-sm">Nursing home care and home health services when needed</p>
          </div>
        </div>
        <p className="text-gray-600">
          Additional services may be available based on your specific health needs and VA determinations.
        </p>
      </div>
    )
  }
];

const VAHealthcareBenefitsSection = () => {
  const [openItem, setOpenItem] = useState<string | null>('eligibility');

  const handleToggle = (itemId: string) => {
    setOpenItem(current => (current === itemId ? null : itemId));
  };

  return (
    <section className="py-12 bg-white" id="va-healthcare-benefits">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A2C5B] mb-4">VA Healthcare Benefits</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive medical coverage for veterans through the Department of Veterans Affairs.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
          <div className="flex items-start mb-4">
            <div className="bg-[#1A2C5B] p-3 rounded-full mr-4 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#1A2C5B] mb-1">Are You Enrolled?</h3>
              <p className="text-gray-600">If you're not yet enrolled in VA healthcare, getting started is easy and can transform your access to medical services.</p>
            </div>
          </div>
          <Link href="https://www.va.gov/health-care/apply/application" target="_blank" rel="noopener noreferrer" className="inline-block bg-[#B22234] hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200">
            Apply for VA Healthcare
          </Link>
        </div>

        <div className="space-y-4">
          {accordionItems.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggle(item.id)}
                className="w-full flex justify-between items-center p-4 text-left font-medium text-[#1A2C5B] bg-gray-50 hover:bg-gray-100 focus:outline-none"
              >
                <span className="text-lg">{item.title}</span>
                {openItem === item.id ? (
                  <ChevronUpIcon className="h-5 w-5 text-[#B22234]" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-[#B22234]" />
                )}
              </button>
              {openItem === item.id && (
                <div className="p-4 bg-white">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VAHealthcareBenefitsSection;
