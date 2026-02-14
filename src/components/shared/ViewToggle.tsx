import React from 'react';

/**
 * View type options for resource display
 */
export type ViewType = 'card' | 'list';

interface ViewToggleProps {
  currentView: ViewType;
  onChange: (view: ViewType) => void;
  className?: string;
}

/**
 * ViewToggle component
 * 
 * Allows users to toggle between card view and list view for resources
 * Implements recommendation #4 from resource-ux-ui-recommendations.md
 */
const ViewToggle: React.FC<ViewToggleProps> = ({ 
  currentView, 
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center border border-gray-200 rounded-md overflow-hidden ${className}`}>
      <button
        type="button"
        className={`
          flex items-center justify-center px-3 py-1.5 text-sm font-medium
          ${currentView === 'card' 
            ? 'bg-[#1A2C5B] text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50'}
        `}
        onClick={() => onChange('card')}
        aria-pressed={currentView === 'card'}
        aria-label="Card view"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-1" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
          />
        </svg>
        Cards
      </button>
      <button
        type="button"
        className={`
          flex items-center justify-center px-3 py-1.5 text-sm font-medium
          ${currentView === 'list' 
            ? 'bg-[#1A2C5B] text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50'}
        `}
        onClick={() => onChange('list')}
        aria-pressed={currentView === 'list'}
        aria-label="List view"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-1" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 10h16M4 14h16M4 18h16" 
          />
        </svg>
        List
      </button>
    </div>
  );
};

export default ViewToggle;
