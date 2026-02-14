import React from 'react';

export default function CommunityQAAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Community Q&A Management</h2>
        <div className="flex gap-2">
          <select
            className="block px-3 py-2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            defaultValue="all"
          >
            <option value="all">All Questions</option>
            <option value="pending">Pending</option>
            <option value="answered">Answered</option>
            <option value="verified">Verified</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1A2C5B] border border-transparent rounded-md hover:bg-blue-800"
          >
            Filter
          </button>
        </div>
      </div>
      
      {/* Questions List */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {/* Sample questions - in real implementation, these would come from the API */}
          {[
            {
              id: '1',
              question: 'Does the VA hospital in Richmond offer specialized PTSD treatment?',
              ngoName: 'VA Health Services',
              askedBy: 'John D.',
              status: 'pending',
              date: '2025-04-20'
            },
            {
              id: '2',
              question: 'What documents do I need to bring to qualify for housing assistance?',
              ngoName: 'Veterans Housing Alliance',
              askedBy: 'Michael S.',
              status: 'answered',
              date: '2025-04-18'
            },
            {
              id: '3',
              question: 'Is there a waiting list for mental health services?',
              ngoName: 'Combat Veterans Support Network',
              askedBy: 'Anonymous Veteran',
              status: 'verified',
              date: '2025-04-15'
            }
          ].map((question) => (
            <li key={question.id}>
              <div className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#1A2C5B] truncate">
                      {question.question}
                    </p>
                    <div className="flex ml-2">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          question.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : question.status === 'answered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <p>
                        NGO: <span className="font-medium">{question.ngoName}</span>
                      </p>
                      <p className="ml-6">
                        Asked by: <span className="font-medium">{question.askedBy}</span>
                      </p>
                      <p className="ml-6">
                        Date: <span className="font-medium">{question.date}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex mt-2 space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-[#1A2C5B] bg-blue-100 border border-transparent rounded-md hover:bg-blue-200"
                    >
                      View & Answer
                    </button>
                    {question.status === 'answered' && (
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-transparent rounded-md hover:bg-green-200"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Question Detail/Answer Modal - would be implemented with state management in real app */}
      <div className="hidden">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-3xl px-4 py-6 bg-white rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">View & Answer Question</h3>
              {/* Question details and answer form would go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
