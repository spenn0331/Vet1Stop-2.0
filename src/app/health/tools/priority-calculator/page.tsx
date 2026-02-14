'use client';

import React, { useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import Head from 'next/head';
import Link from 'next/link';

// Define the questions for the calculator
const questions = [
  {
    id: 'purpleHeart',
    text: 'Have you been awarded a Purple Heart medal?',
    priorityGroup: 1,
    explanation: 'Veterans awarded the Purple Heart medal are automatically placed in Priority Group 1.'
  },
  {
    id: 'disability50',
    text: 'Do you have a VA disability rating of 50% or higher?',
    priorityGroup: 1,
    explanation: 'Veterans with a disability rating of 50% or more are placed in Priority Group 1.'
  },
  {
    id: 'disability30to40',
    text: 'Do you have a VA disability rating between 30% and 40%?',
    priorityGroup: 2,
    explanation: 'Veterans with disability ratings between 30% and 40% are placed in Priority Group 2.'
  },
  {
    id: 'formerPOW',
    text: 'Are you a former Prisoner of War (POW)?',
    priorityGroup: 3,
    explanation: 'Former Prisoners of War are placed in Priority Group 3.'
  },
  {
    id: 'disability10to20',
    text: 'Do you have a VA disability rating between 10% and 20%?',
    priorityGroup: 3,
    explanation: 'Veterans with disability ratings between 10% and 20% are placed in Priority Group 3.'
  },
  {
    id: 'disability0',
    text: 'Do you have a VA disability rating of 0% (compensable)?',
    priorityGroup: 5,
    explanation: 'Veterans with a 0% service-connected disability rating (compensable) are placed in Priority Group 5.'
  },
  {
    id: 'nonCompensable',
    text: 'Do you have a 0% VA disability rating (non-compensable)?',
    priorityGroup: 6,
    explanation: 'Veterans with a 0% service-connected disability rating (non-compensable) are placed in Priority Group 6.'
  },
  {
    id: 'catastrophic',
    text: 'Have you been determined to be catastrophically disabled by the VA?',
    priorityGroup: 4,
    explanation: 'Veterans determined by VA to be catastrophically disabled are placed in Priority Group 4.'
  },
  {
    id: 'medicallyNeedy',
    text: 'Do you meet VA criteria as a low-income or medically needy veteran?',
    priorityGroup: 5,
    explanation: 'Veterans who meet VA income thresholds for being low-income are placed in Priority Group 5.'
  },
  {
    id: 'recentCombat',
    text: 'Are you a recently discharged combat veteran (within the past 5 years)?',
    priorityGroup: 6,
    explanation: 'Combat Veterans who were discharged less than 5 years ago are placed in Priority Group 6 for 5 years post-discharge.'
  },
  {
    id: 'campLejeune',
    text: 'Were you stationed at Camp Lejeune for at least 30 days between August 1953 and December 1987?',
    priorityGroup: 6,
    explanation: 'Veterans who served at Camp Lejeune during the specified period are placed in Priority Group 6.'
  },
  {
    id: 'agentOrange',
    text: 'Were you exposed to Agent Orange during service in Vietnam?',
    priorityGroup: 6, 
    explanation: 'Veterans who were exposed to Agent Orange during service in Vietnam are placed in Priority Group 6.'
  },
  {
    id: 'atomicVeteran',
    text: 'Are you an Atomic Veteran who participated in nuclear tests?',
    priorityGroup: 6,
    explanation: 'Atomic Veterans who participated in nuclear tests are placed in Priority Group 6.'
  },
  {
    id: 'higherIncome',
    text: 'Is your income above VA thresholds, but you agree to pay required copays?',
    priorityGroup: 8,
    explanation: 'Veterans with income above VA thresholds who agree to pay copays are placed in Priority Group 8.'
  }
];

// Define priority group benefits and explanations
const priorityGroupInfo = {
  1: {
    copays: 'No copays for inpatient or outpatient care. May have prescription copays unless disability is 50% or more.',
    eligibility: 'Awarded to veterans with severe service-connected disabilities (50%+ rating) or Medal of Honor and Purple Heart recipients.',
    benefits: 'Highest priority for care, appointments, and access to all VA health services.'
  },
  2: {
    copays: 'No copays for inpatient or outpatient care. May have prescription copays.',
    eligibility: 'Veterans with service-connected disabilities rated 30% or 40%.',
    benefits: 'High priority for care, appointments, and access to all VA health services.'
  },
  3: {
    copays: 'No copays for care related to service-connected conditions. May have copays for other care and prescriptions.',
    eligibility: 'Former POWs, Purple Heart recipients, veterans with service-connected disabilities rated 10-20%, and veterans discharged for disability incurred in the line of duty.',
    benefits: 'Priority access to care and appointments below Groups 1-2.'
  },
  4: {
    copays: 'Based on income; may be exempt from inpatient and outpatient copays.',
    eligibility: 'Veterans receiving aid and attendance or housebound benefits, and those determined catastrophically disabled.',
    benefits: 'Priority access to care for severely disabled veterans.'
  },
  5: {
    copays: 'May pay reduced copays based on income level.',
    eligibility: 'Low-income veterans and those receiving VA pension benefits, or eligible for Medicaid.',
    benefits: 'Access to comprehensive VA healthcare with some financial assistance.'
  },
  6: {
    copays: 'No copays for care related to specific exposures or service. Copays for other care based on income.',
    eligibility: 'Veterans of World War I, veterans with 0% service-connected disabilities, veterans exposed to ionizing radiation, Agent Orange, or other hazardous duty, and combat veterans discharged within the last 5 years.',
    benefits: 'Special access for exposure-related care and time-limited benefits.'
  },
  7: {
    copays: 'Required to pay copays based on income.',
    eligibility: 'Veterans with gross household income below the VA geographically-adjusted income threshold who agree to pay copays.',
    benefits: 'Basic healthcare access with copayments.'
  },
  8: {
    copays: 'Required to pay full copays for care.',
    eligibility: 'Veterans with income above VA thresholds who agree to pay specified copays.',
    benefits: 'Access to care as resources allow, after higher priority groups are served.'
  }
};

export default function PriorityGroupCalculator() {
  const [answers, setAnswers] = useState<{[key: string]: boolean}>({});
  const [result, setResult] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const handleAnswerChange = (questionId: string, value: boolean) => {
    setAnswers({...answers, [questionId]: value});
  };

  const calculatePriorityGroup = () => {
    // Find the lowest priority group (highest priority) where the user answered "yes"
    let lowestPriorityGroup = 8;
    let explanationText = '';
    
    for (const question of questions) {
      if (answers[question.id]) {
        if (question.priorityGroup < lowestPriorityGroup) {
          lowestPriorityGroup = question.priorityGroup;
          explanationText = question.explanation;
        }
      }
    }
    
    // If no "yes" answers, default to Priority Group 8
    if (lowestPriorityGroup === 8 && !Object.values(answers).includes(true)) {
      explanationText = 'Based on your answers, you may be in Priority Group 8. This is the default group for veterans who don\'t qualify for Groups 1-7 but agree to pay copays.';
    }
    
    setResult(lowestPriorityGroup);
    setExplanation(explanationText);
  };

  const resetCalculator = () => {
    setAnswers({});
    setResult(null);
    setExplanation('');
    setHasStarted(false);
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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

        <h1 className="text-3xl font-bold text-[#1A2C5B] mb-6">VA Priority Group Calculator</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="text-gray-700 mb-4">
            This tool helps you estimate which VA Priority Group you might qualify for based on your service and health status. Priority groups determine how the VA prioritizes care and what copays you may need to pay.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Disclaimer:</span> This calculator provides only an estimate and is not an official determination. Your actual Priority Group is determined by the VA during enrollment.
            </p>
          </div>
          
          {!hasStarted && !result && (
            <button
              onClick={handleStart}
              className="w-full py-3 px-4 bg-[#1A2C5B] text-white rounded-md hover:bg-blue-700 transition duration-200 font-medium"
            >
              Start Calculator
            </button>
          )}
          
          {hasStarted && !result && (
            <>
              <div className="space-y-4 mb-6">
                {questions.map((question) => (
                  <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          id={question.id}
                          type="checkbox"
                          checked={answers[question.id] || false}
                          onChange={(e) => handleAnswerChange(question.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <label htmlFor={question.id} className="ml-3 text-sm font-medium text-gray-700">
                        {question.text}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={calculatePriorityGroup}
                  className="flex-1 py-3 px-4 bg-[#1A2C5B] text-white rounded-md hover:bg-blue-700 transition duration-200 font-medium"
                >
                  Calculate My Priority Group
                </button>
                
                <button
                  onClick={resetCalculator}
                  className="py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition duration-200"
                >
                  Reset
                </button>
              </div>
            </>
          )}
          
          {result && (
            <div className="mt-6">
              <div className="bg-blue-50 p-6 rounded-lg mb-6 border-l-4 border-blue-500">
                <h2 className="text-xl font-bold text-[#1A2C5B] mb-2">Your Estimated Priority Group: {result}</h2>
                <p className="text-gray-700 mb-4">{explanation}</p>
                
                <div className="mt-4">
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="flex w-full justify-between rounded-lg bg-blue-100 px-4 py-2 text-left text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none">
                          <span>What does Priority Group {result} mean?</span>
                          <ChevronUpIcon
                            className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-blue-500`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600">
                          <div className="space-y-2">
                            <p><span className="font-semibold">Eligibility:</span> {priorityGroupInfo[result as keyof typeof priorityGroupInfo]?.eligibility}</p>
                            <p><span className="font-semibold">Benefits:</span> {priorityGroupInfo[result as keyof typeof priorityGroupInfo]?.benefits}</p>
                            <p><span className="font-semibold">Copays:</span> {priorityGroupInfo[result as keyof typeof priorityGroupInfo]?.copays}</p>
                          </div>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <a
                  href="https://www.va.gov/health-care/eligibility/priority-groups/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-[#1A2C5B] text-white rounded-md hover:bg-blue-700 transition duration-200 font-medium text-center"
                >
                  Learn More About VA Priority Groups
                </a>
                
                <button
                  onClick={resetCalculator}
                  className="py-3 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition duration-200"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-[#1A2C5B] mb-4">About VA Priority Groups</h2>
          
          <p className="text-gray-700 mb-4">
            The VA healthcare system uses Priority Groups to balance demand for VA healthcare with resources. Veterans are assigned to one of eight priority groups based on factors such as service-connected disabilities, income, and other benefits.
          </p>
          
          <div className="space-y-4 mt-6">
            {Object.entries(priorityGroupInfo).map(([group, info]) => (
              <Disclosure key={group}>
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none">
                      <span>Priority Group {group}</span>
                      <ChevronUpIcon
                        className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600">
                      <div className="space-y-2">
                        <p><span className="font-semibold">Eligibility:</span> {info.eligibility}</p>
                        <p><span className="font-semibold">Benefits:</span> {info.benefits}</p>
                        <p><span className="font-semibold">Copays:</span> {info.copays}</p>
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <a
              href="https://www.va.gov/health-care/eligibility/priority-groups/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm"
            >
              Visit VA.gov for official information on Priority Groups
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
