import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

export default function FaqSection() {
  // State to track which FAQ items are expanded
  const [openItems, setOpenItems] = useState<number[]>([]);
  
  // Toggle FAQ item open/closed
  const toggleItem = (index: number) => {
    if (openItems.includes(index)) {
      setOpenItems(openItems.filter((item) => item !== index));
    } else {
      setOpenItems([...openItems, index]);
    }
  };
  
  // FAQ data
  const faqs = [
    {
      question: "When should I start the transition process from military to VA healthcare?",
      answer: "You should begin the transition process at least 6 months before your separation date. This gives you enough time to gather records, complete enrollment forms, and ensure continuity of care. If you're part of the Transition Assistance Program (TAP), healthcare transition will be covered, but it's still beneficial to start early and be proactive."
    },
    {
      question: "Will there be a gap in my healthcare coverage during the transition?",
      answer: "If you plan ahead, there shouldn't be a gap. Active duty service members typically have TRICARE coverage for 180 days after separation through the Transitional Assistance Management Program (TAMP). To avoid gaps, apply for VA healthcare before your separation date. Your coverage can begin as soon as your veteran status is confirmed."
    },
    {
      question: "Do I need to choose between TRICARE and VA healthcare?",
      answer: "No, you can use both if you're eligible. Many veterans, especially military retirees, have both VA healthcare and TRICARE. The VA generally becomes the primary provider for service-connected conditions, while TRICARE can be used for family members and as supplementary coverage. Using both systems strategically can maximize your benefits and provider options."
    },
    {
      question: "What happens to my prescriptions during the transition?",
      answer: "Bring a 90-day supply of current medications to your first VA appointment. Your VA provider will review your medications and can issue new VA prescriptions. The VA has its own formulary, so some medications may be substituted with equivalent alternatives. For specialized or non-formulary medications, your provider can submit a request for approval."
    },
    {
      question: "Can I keep seeing my current healthcare providers?",
      answer: "It depends. If your providers are part of the VA Community Care Network, you may be able to continue seeing them under certain circumstances. Otherwise, you'll likely be assigned to VA providers. If you live far from VA facilities or face long wait times, you may qualify for the Community Care program, which allows you to see non-VA providers with VA covering the cost."
    },
    {
      question: "What if I'm currently undergoing treatment for a serious condition?",
      answer: "Notify the VA immediately during enrollment about ongoing treatment for serious conditions. The VA has care coordination teams that can help ensure continuity of care for complex or critical conditions. In some cases, you may be allowed to complete your current treatment plan with your existing providers before transitioning fully to VA care."
    },
    {
      question: "How does the VA determine my priority group?",
      answer: "The VA assigns priority groups (1-8) based on several factors: percentage of service-connected disability, receipt of a Purple Heart or Medal of Honor, POW status, income level, and other special eligibility factors. Priority group 1 receives the highest priority for care and cost exemptions, while groups 2-8 have varying levels of benefits and potential copayments."
    },
    {
      question: "What if I don't live near a VA medical facility?",
      answer: "The VA offers several options for veterans in remote areas: The Community Care program allows eligible veterans to receive care from local non-VA providers at VA expense, Telehealth services provide remote consultations with VA providers, Mobile clinics visit underserved areas periodically, and the VA may reimburse travel expenses for veterans who must travel to VA facilities for care of service-connected conditions."
    },
    {
      question: "Is mental health care included in VA healthcare?",
      answer: "Yes, the VA offers comprehensive mental health services including treatment for PTSD, depression, anxiety, substance use disorders, and other conditions. Mental health care is available at all VA medical centers and many community clinics. Additionally, the VA offers specialized programs for military sexual trauma, suicide prevention, and readjustment counseling through Vet Centers, which operate separately from VA medical facilities."
    },
    {
      question: "What happens if I need emergency care during the transition period?",
      answer: "If you experience a medical emergency, go to the nearest emergency department immediately. The VA may cover emergency care at non-VA facilities if you meet certain criteria. To qualify for coverage, you generally must be enrolled in VA healthcare, have received VA care within the past 24 months, and have no other healthcare coverage that would fully cover the emergency care. Notify the VA within 72 hours of the emergency visit by calling 1-844-724-7842."
    }
  ];
  
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
      
      <p className="mb-6">
        Transitioning from military to VA healthcare often raises many questions. Here are answers to the most 
        common questions veterans have during this process.
      </p>
      
      <div className="space-y-4 mb-8">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center text-left">
                <QuestionMarkCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <h4 className="font-medium text-gray-900">{faq.question}</h4>
              </div>
              {openItems.includes(index) ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {openItems.includes(index) && (
              <div className="px-4 py-3 bg-white">
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Still Have Questions?</h3>
        <p className="mb-4">
          If you couldn't find the answer to your question, there are several ways to get personalized assistance:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="https://www.va.gov/contact-us/" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 mr-3">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </span>
            <div>
              <h4 className="font-medium text-blue-700">VA Contact Center</h4>
              <p className="text-sm text-gray-600">1-877-222-VETS (8387)</p>
            </div>
          </a>
          
          <a 
            href="/health/connect/vso" 
            className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 mr-3">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </span>
            <div>
              <h4 className="font-medium text-blue-700">Veteran Service Officer</h4>
              <p className="text-sm text-gray-600">Get free personalized help</p>
            </div>
          </a>
          
          <a 
            href="https://www.va.gov/find-locations/" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 mr-3">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </span>
            <div>
              <h4 className="font-medium text-blue-700">VA Medical Center</h4>
              <p className="text-sm text-gray-600">Visit your local enrollment office</p>
            </div>
          </a>
          
          <a 
            href="/health/support/navigator" 
            className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 mr-3">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </span>
            <div>
              <h4 className="font-medium text-blue-700">Vet1Stop Support</h4>
              <p className="text-sm text-gray-600">Chat with our healthcare navigators</p>
            </div>
          </a>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-2">Community Forum</h4>
        <p className="text-blue-700 mb-3">
          Connect with other veterans who have gone through the healthcare transition process.
          Our community forum has dedicated threads for healthcare transition questions.
        </p>
        <a 
          href="/community/healthcare-transition" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <span>Visit the Healthcare Transition Forum</span>
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </a>
      </div>
    </div>
  );
}
