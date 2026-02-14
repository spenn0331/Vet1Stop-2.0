import React, { useState, ReactNode, useId } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface CollapsibleFilterSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  badge?: number; // Optional count of active filters
  className?: string;
}

/**
 * A collapsible section component specifically designed for filter sections
 * Improves UI organization and reduces visual overwhelm
 */
const CollapsibleFilterSection: React.FC<CollapsibleFilterSectionProps> = ({
  title,
  defaultExpanded = false,
  children,
  badge,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const uniqueId = useId();
  const sectionId = `filter-section-${uniqueId}-${title.toLowerCase().replace(/\s/g, '-')}`;
  
  return (
    <div className={`border-b border-gray-200 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#1A2C5B] rounded-md px-2 py-1"
        aria-expanded={isExpanded}
        aria-controls={sectionId}
      >
        <div className="flex items-center">
          <h3 className="text-md font-medium text-gray-900">{title}</h3>
          {badge !== undefined && badge > 0 && (
            <span className="ml-2 rounded-full bg-[#1A2C5B] px-2 py-0.5 text-xs font-medium text-white">
              {badge}
            </span>
          )}
        </div>
        <span className="ml-2 text-gray-500">
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
      </button>
      
      {isExpanded && (
        <div 
          id={sectionId}
          className="mt-3 space-y-3"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleFilterSection;
