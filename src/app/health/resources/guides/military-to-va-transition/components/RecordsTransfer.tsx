import React from 'react';
import { 
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function RecordsTransfer() {
  const faqs = [
    {
      question: "Do I need to manually request my records transfer?",
      answer: "Typically, no. When you separate from service and enroll in VA healthcare, your records should automatically transfer from DoD to VA through electronic systems. However, it's still a good idea to verify that this has happened."
    },
    {
      question: "How long does the records transfer take?",
      answer: "Electronic transfers usually complete within 30-45 days after separation. However, some medical facilities may take longer, especially for older or paper records that need digitization."
    },
    {
      question: "What if my records are missing or incomplete?",
      answer: "If you notice missing information, gather any records you have and contact your local VA medical center's Release of Information office. You can also file a request through milConnect to obtain missing military medical records."
    },
    {
      question: "Can I see my transferred records?",
      answer: "Yes, you can view your health records through My HealtheVet (www.myhealth.va.gov) after verifying your identity. You can also request printed copies from your VA medical center."
    }
  ];

  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Medical Records Transfer</h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <p className="text-blue-700">
          <strong>The Good News:</strong> For most veterans, medical records transfer from DoD/TRICARE to VA 
          happens automatically. The DoD and VA use interconnected electronic systems to streamline this 
          process. However, it's important to verify that your records were transferred completely and accurately.
        </p>
      </div>
      
      <p className="mb-4">
        Your military medical records contain crucial information about your health history, 
        including service-connected conditions, treatments, and medications. Ensuring these records 
        transfer completely to your VA healthcare providers is essential for continuity of care.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <ArrowPathIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold">Automatic Transfer Process</h3>
          </div>
          <p>
            When you separate from military service and enroll in VA healthcare, your records should 
            automatically transfer through the following process:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2">1</span>
              <span>DoD compiles your complete military health record</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2">2</span>
              <span>Records are transferred to the VA via secure electronic systems</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2">3</span>
              <span>VA imports records into your VA health profile</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2">4</span>
              <span>Records become available to your VA healthcare providers</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <DocumentDuplicateIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold">Verifying Your Records</h3>
          </div>
          <p>
            To ensure your records transferred correctly:
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-start">
              <ChevronRightIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <span>
                <strong>Ask at your first VA appointment</strong> - Your VA provider can check if your military health records are accessible in their system
              </span>
            </li>
            <li className="flex items-start">
              <ChevronRightIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <span>
                <strong>Check My HealtheVet</strong> - Register for a premium account at <a href="https://www.myhealth.va.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">myhealth.va.gov</a> to view your VA health records
              </span>
            </li>
            <li className="flex items-start">
              <ChevronRightIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <span>
                <strong>Request a copy</strong> - Visit your VA medical center's Release of Information office to request copies of your records
              </span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Considerations</h3>
            <ul className="space-y-2 text-yellow-700">
              <li><strong>Timing:</strong> Records typically transfer within 30-45 days after separation, but this can vary</li>
              <li><strong>Older Records:</strong> If you served before electronic records were common (pre-2000s), additional steps may be needed</li>
              <li><strong>Private Treatment:</strong> Records from non-military healthcare providers won't transfer automatically</li>
              <li><strong>Classified Deployments:</strong> Some records from classified operations may have additional restrictions</li>
            </ul>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-4">If Your Records Are Missing</h3>
      
      <p className="mb-4">
        If you discover that your records haven't transferred or appear incomplete, don't worry. 
        Here are the steps to take:
      </p>
      
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Steps to Recover Missing Records</h4>
        </div>
        <div className="p-6">
          <ol className="space-y-4">
            <li className="flex">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-medium mr-3">1</span>
              <div>
                <p className="font-medium">Contact your local VA medical center's Release of Information office</p>
                <p className="text-sm text-gray-500 mt-1">Explain that you're missing records and need assistance tracking them down</p>
              </div>
            </li>
            <li className="flex">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-medium mr-3">2</span>
              <div>
                <p className="font-medium">Request records through milConnect</p>
                <p className="text-sm text-gray-500 mt-1">
                  Visit <a href="https://milconnect.dmdc.osd.mil" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">milconnect.dmdc.osd.mil</a> and 
                  select "Correspondence/Documentation" then "Defense Personnel Records Information"
                </p>
              </div>
            </li>
            <li className="flex">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-medium mr-3">3</span>
              <div>
                <p className="font-medium">File a request with the National Personnel Records Center</p>
                <p className="text-sm text-gray-500 mt-1">
                  For older records, visit <a href="https://www.archives.gov/veterans/military-service-records" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">archives.gov/veterans</a>
                </p>
              </div>
            </li>
            <li className="flex">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-medium mr-3">4</span>
              <div>
                <p className="font-medium">Contact your former military treatment facility</p>
                <p className="text-sm text-gray-500 mt-1">They may be able to provide copies of your records or assist with the transfer</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
      
      <div className="space-y-4 mb-8">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
              <QuestionMarkCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-gray-900">{faq.question}</h4>
            </div>
            <div className="px-4 py-3">
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-2">How Vet1Stop Can Help</h4>
        <p className="text-blue-700">
          Our <a href="/health/pathways/transitioning-from-military-healthcare" className="text-blue-600 hover:underline">Healthcare Transition Pathway</a> includes 
          specific steps for verifying your records transfer, and our platform can store important 
          documentation to help you keep track of your healthcare journey. We can also connect you 
          with advocates who can help if you experience difficulties with your records transfer.
        </p>
      </div>
    </div>
  );
}
