import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { 
  VETERAN_TYPE_OPTIONS, 
  SERVICE_BRANCH_OPTIONS, 
  ELIGIBILITY_OPTIONS,
  US_STATES 
} from '@/constants/filterOptions';

interface FilterPanelProps {
  selectedState: string;
  setSelectedState: (state: string) => void;
  veteranType: string;
  setVeteranType: (type: string) => void;
  serviceBranch: string;
  setServiceBranch: (branch: string) => void;
  eligibility: string;
  setEligibility: (eligibility: string) => void;
  isExpanded?: boolean;
  onResetFilters: () => void;
}

/**
 * FilterPanel component
 * 
 * A reusable, collapsible panel of filters for resource categories
 * Used across health, education, and other resource pages
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedState,
  setSelectedState,
  veteranType,
  setVeteranType,
  serviceBranch,
  setServiceBranch,
  eligibility,
  setEligibility,
  isExpanded = false,
  onResetFilters
}) => {
  const [expanded, setExpanded] = useState<boolean>(isExpanded);

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Filter Panel Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-[#1A2C5B] text-white hover:bg-[#12234E] transition"
        aria-expanded={expanded}
      >
        <h3 className="text-lg font-semibold flex items-center">
          Advanced Filters
          {!expanded && veteranType !== 'all' && <span className="ml-2 text-xs bg-red-500 rounded-full px-2 py-1">1</span>}
          {!expanded && serviceBranch !== 'all' && <span className="ml-2 text-xs bg-red-500 rounded-full px-2 py-1">1</span>}
          {!expanded && eligibility !== 'all' && <span className="ml-2 text-xs bg-red-500 rounded-full px-2 py-1">1</span>}
          {!expanded && selectedState && <span className="ml-2 text-xs bg-red-500 rounded-full px-2 py-1">1</span>}
        </h3>
        {expanded ? (
          <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      
      {/* Filter Panel Content */}
      {expanded && (
        <div className="p-4 divide-y divide-gray-200">
          {/* Location Filter */}
          <div className="py-4">
            <h4 className="font-medium text-gray-700 mb-2">Location</h4>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="Filter by state"
            >
              <option value="">All States</option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Veteran Type Filter */}
          <div className="py-4">
            <h4 className="font-medium text-gray-700 mb-2">Veteran Type</h4>
            <select
              value={veteranType}
              onChange={(e) => setVeteranType(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="Filter by veteran type"
            >
              {VETERAN_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type === 'All' ? 'all' : type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Service Branch Filter */}
          <div className="py-4">
            <h4 className="font-medium text-gray-700 mb-2">Service Branch</h4>
            <select
              value={serviceBranch}
              onChange={(e) => setServiceBranch(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="Filter by service branch"
            >
              {SERVICE_BRANCH_OPTIONS.map((branch) => (
                <option key={branch} value={branch === 'All' ? 'all' : branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
          
          {/* Eligibility Filter */}
          <div className="py-4">
            <h4 className="font-medium text-gray-700 mb-2">Eligibility</h4>
            <select
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              aria-label="Filter by eligibility"
            >
              {ELIGIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option === 'All' ? 'all' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          {/* Reset Filters Button */}
          <div className="pt-4">
            <button
              onClick={onResetFilters}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition"
              aria-label="Reset all filters"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
