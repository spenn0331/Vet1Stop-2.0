import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function EligibilitySection() {
  const [servicePeriod, setServicePeriod] = useState('');
  const [dischargeStatus, setDischargeStatus] = useState('');
  const [serviceConnectedDisability, setServiceConnectedDisability] = useState(false);
  const [incomeLevel, setIncomeLevel] = useState('');
  const [showResult, setShowResult] = useState(false);
  
  const handleCheckEligibility = () => {
    setShowResult(true);
  };
  
  const resetForm = () => {
    setServicePeriod('');
    setDischargeStatus('');
    setServiceConnectedDisability(false);
    setIncomeLevel('');
    setShowResult(false);
  };
  
  // Determine eligibility based on inputs
  const isEligible = () => {
    // Most veterans with honorable or general discharge are eligible
    if (dischargeStatus === 'honorable' || dischargeStatus === 'general') {
      return true;
    }
    
    // Veterans with service-connected disabilities are eligible regardless of discharge
    if (serviceConnectedDisability) {
      return true;
    }
    
    // Other circumstances are more complex and would require consultation
    return false;
  };
  
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Eligibility for VA Healthcare</h2>
      
      <p className="mb-4">
        Most Veterans who served in active duty, including those who served in the National 
        Guard or Reserves and were called to active duty, may qualify for VA healthcare benefits.
      </p>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Important:</strong> While this eligibility checker provides general guidance, 
          your specific situation may have additional factors. We recommend applying even if 
          you're uncertain about your eligibility - the VA will make the final determination.
        </p>
      </div>
      
      <h3 className="text-xl font-semibold mb-3">Basic Eligibility Requirements</h3>
      
      <ul className="list-disc pl-6 mb-6">
        <li><strong>Service Requirements:</strong> Active duty service in the military, naval, or air service</li>
        <li><strong>Minimum Duty Requirements:</strong> 24 continuous months or the full period for which you were called to active duty (with some exceptions)</li>
        <li><strong>Discharge Status:</strong> Generally requires other than dishonorable discharge</li>
      </ul>
      
      <h3 className="text-xl font-semibold mb-3">Priority Groups</h3>
      
      <p className="mb-4">
        The VA assigns eligible Veterans to priority groups (1-8) to balance demand with resources.
        Higher priority groups typically have lower or no copayments.
      </p>
      
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eligibility Criteria</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                Veterans with 50% or more service-connected disabilities; Veterans determined by VA to be unemployable due to service-connected conditions
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                Veterans with 30% or 40% service-connected disabilities
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">3</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                Veterans who are former POWs; Veterans awarded a Purple Heart; Veterans with 10% or 20% service-connected disabilities; Veterans discharged for a disability incurred or aggravated in the line of duty
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">4-8</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                Various other categories based on income, service period, and other factors
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-blue-800 mb-4">Eligibility Self-Assessment</h3>
        <p className="mb-4 text-gray-700">
          Use this tool to get a preliminary indication of your eligibility for VA healthcare:
        </p>
        
        {!showResult ? (
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When did you serve?
              </label>
              <select
                value={servicePeriod}
                onChange={(e) => setServicePeriod(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select service period</option>
                <option value="post-9/11">After September 11, 2001</option>
                <option value="gulf-war">Gulf War (August 1990 - September 2001)</option>
                <option value="vietnam">Vietnam Era (1964 - 1975)</option>
                <option value="korean">Korean War (1950 - 1953)</option>
                <option value="other">Other service period</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What was your discharge status?
              </label>
              <select
                value={dischargeStatus}
                onChange={(e) => setDischargeStatus(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select discharge status</option>
                <option value="honorable">Honorable</option>
                <option value="general">General (Under Honorable Conditions)</option>
                <option value="other-than-honorable">Other Than Honorable</option>
                <option value="bad-conduct">Bad Conduct</option>
                <option value="dishonorable">Dishonorable</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={serviceConnectedDisability}
                  onChange={(e) => setServiceConnectedDisability(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Do you have a service-connected disability?
                </span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual household income range
              </label>
              <select
                value={incomeLevel}
                onChange={(e) => setIncomeLevel(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select income range</option>
                <option value="low">Below $35,000</option>
                <option value="medium">$35,000 - $70,000</option>
                <option value="high">Above $70,000</option>
              </select>
            </div>
            
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCheckEligibility}
                disabled={!servicePeriod || !dischargeStatus || !incomeLevel}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  !servicePeriod || !dischargeStatus || !incomeLevel
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                Check Eligibility
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <div className={`rounded-md ${isEligible() ? 'bg-green-50' : 'bg-red-50'} p-4 mb-4`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {isEligible() ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isEligible() ? 'text-green-800' : 'text-red-800'}`}>
                    {isEligible() 
                      ? 'Based on your responses, you likely qualify for VA healthcare.' 
                      : 'Based on your responses, you may face challenges qualifying for VA healthcare.'}
                  </h3>
                  <div className={`mt-2 text-sm ${isEligible() ? 'text-green-700' : 'text-red-700'}`}>
                    <p>
                      {isEligible() 
                        ? 'We recommend you apply for VA healthcare as soon as possible. Even with a positive indication here, the VA will make the final determination upon reviewing your full application.' 
                        : 'We still recommend applying as individual circumstances vary. You may qualify for specific programs, and the VA makes the final eligibility determination.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-3">
              <a
                href="https://www.va.gov/health-care/how-to-apply/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply for VA Healthcare
              </a>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-3">How Vet1Stop Can Help</h3>
      <p className="mb-4">
        Our platform can assist you with your VA healthcare eligibility in several ways:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Use our <a href="/health/pathways/transitioning-from-military-healthcare" className="text-blue-600 hover:text-blue-800">Healthcare Transition Pathway</a> for a personalized checklist</li>
        <li>Connect with veteran service officers through our <a href="/health/connect/vso" className="text-blue-600 hover:text-blue-800">VSO Directory</a> for expert assistance</li>
        <li>Access our <a href="/health/resources" className="text-blue-600 hover:text-blue-800">resource library</a> for more detailed eligibility information</li>
      </ul>
    </div>
  );
}
