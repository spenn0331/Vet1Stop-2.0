import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Switch } from '../../components/ui/switch';
import { Checkbox } from '../../components/ui/checkbox';
import { Button, buttonVariants } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  VETERAN_TYPE_OPTIONS, 
  SERVICE_BRANCH_OPTIONS,
  ELIGIBILITY_OPTIONS,
  US_STATES,
  RESOURCE_TYPES,
  HEALTH_CATEGORY_OPTIONS
} from '../../constants/filterOptions';

interface FilterOptions {
  selectedState?: string;
  veteranType?: string[];
  serviceBranch?: string[];
  eligibility?: string[];
  resourceTypes?: string[];
  categories?: string[];
  includeVA?: boolean;
  includeNGO?: boolean;
  includeState?: boolean;
  includeFederal?: boolean;
  rating?: number;
  distanceInMiles?: number;
}

interface AdvancedFilterPanelProps {
  selectedState: string;
  setSelectedState: (state: string) => void;
  veteranType: string;
  setVeteranType: (type: string) => void;
  serviceBranch: string;
  setServiceBranch: (branch: string) => void;
  eligibility: string;
  setEligibility: (eligibility: string) => void;
  resourceType?: string;
  setResourceType?: (type: string) => void;
  onResetFilters: () => void;
  isExpanded: boolean;
}

/**
 * AdvancedFilterPanel component
 * 
 * Provides advanced filtering options for resources with multiple selectable criteria
 * Implements Recommendation #8 (Interactive Filtering) from resource-ux-ui-recommendations.md
 */
const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  selectedState,
  setSelectedState,
  veteranType,
  setVeteranType,
  serviceBranch,
  setServiceBranch,
  eligibility,
  setEligibility,
  resourceType = 'all',
  setResourceType = () => {},
  onResetFilters,
  isExpanded
}) => {
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    selectedState,
    veteranType: [veteranType],
    serviceBranch: [serviceBranch],
    eligibility: [eligibility],
    resourceTypes: [resourceType],
    categories: [],
    includeVA: true,
    includeNGO: true,
    includeState: true,
    includeFederal: true,
    rating: 1,
    distanceInMiles: 50
  });
  
  // Track if filters have been modified
  const [filtersModified, setFiltersModified] = useState(false);
  
  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    veteran: true,
    resourceType: true,
    categories: true,
    ratings: false
  });
  
  // Refs for accessibility
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [firstFocusableEl, setFirstFocusableEl] = useState<HTMLElement | null>(null);
  const [lastFocusableEl, setLastFocusableEl] = useState<HTMLElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Initialize filters from props
  useEffect(() => {
    setFilters({
      selectedState,
      veteranType: [veteranType],
      serviceBranch: [serviceBranch],
      eligibility: [eligibility],
      resourceTypes: [resourceType],
      categories: [],
      includeVA: true,
      includeNGO: true,
      includeState: true,
      includeFederal: true,
      rating: 1,
      distanceInMiles: 50
    });
    setFiltersModified(false);
  }, [selectedState, veteranType, serviceBranch, eligibility, resourceType]);

  // Manage focus and keyboard navigation
  useEffect(() => {
    if (isExpanded && panelRef.current) {
      // Save the currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Focus the close button
      closeButtonRef.current?.focus();
      
      // Find all focusable elements
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const elements = Array.from(focusables);
      setFocusableElements(elements);
      
      if (elements.length) {
        setFirstFocusableEl(elements[0]);
        setLastFocusableEl(elements[elements.length - 1]);
      }
    }
    
    // Restore focus when closing
    return () => {
      if (!isExpanded && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isExpanded]);

  // Handle escape key to close panel and trap focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onResetFilters();
      return;
    }
    
    // Tab key handling for focus trap
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // If shift + tab and first element is focused, move to last
        if (document.activeElement === firstFocusableEl) {
          e.preventDefault();
          lastFocusableEl?.focus();
        }
      } else {
        // If tab and last element is focused, move to first
        if (document.activeElement === lastFocusableEl) {
          e.preventDefault();
          firstFocusableEl?.focus();
        }
      }
    }
  };

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onResetFilters();
    }
  };

  // Toggle filter sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update filter values
  const updateFilter = (
    key: keyof FilterOptions, 
    value: string | string[] | boolean | number
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setFiltersModified(true);
  };

  // Toggle array values (for checkboxes)
  const toggleArrayValue = (
    key: keyof Pick<FilterOptions, 'veteranType' | 'serviceBranch' | 'eligibility' | 'resourceTypes' | 'categories'>,
    value: string
  ) => {
    setFilters(prev => {
      const currentArray = prev[key] || [];
      
      // If value exists in array, remove it
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [key]: currentArray.filter(item => item !== value)
        };
      }
      
      // If not, add it
      return {
        ...prev,
        [key]: [...currentArray, value]
      };
    });
    setFiltersModified(true);
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    setSelectedState(filters.selectedState || '');
    setVeteranType(filters.veteranType?.[0] || 'all');
    setServiceBranch(filters.serviceBranch?.[0] || 'all');
    setEligibility(filters.eligibility?.[0] || 'all');
    setResourceType?.(filters.resourceTypes?.[0] || 'all');
    onResetFilters();
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const emptyFilters: FilterOptions = {
      selectedState: '',
      veteranType: ['all'],
      serviceBranch: ['all'],
      eligibility: ['all'],
      resourceTypes: ['all'],
      categories: [],
      includeVA: true,
      includeNGO: true,
      includeState: true,
      includeFederal: true,
      rating: 1,
      distanceInMiles: 50
    };
    setFilters(emptyFilters);
    onResetFilters();
    setFiltersModified(true);
  };

  // Calculate active filter count
  const activeFilterCount = [
    filters.selectedState,
    ...((filters.veteranType && filters.veteranType.length > 0 && filters.veteranType[0] !== 'all') ? filters.veteranType : []),
    ...((filters.serviceBranch && filters.serviceBranch.length > 0 && filters.serviceBranch[0] !== 'all') ? filters.serviceBranch : []),
    ...((filters.eligibility && filters.eligibility.length > 0 && filters.eligibility[0] !== 'all') ? filters.eligibility : []),
    ...((filters.resourceTypes && filters.resourceTypes.length > 0 && filters.resourceTypes[0] !== 'all') ? filters.resourceTypes : []),
    ...((filters.categories && filters.categories.length > 0) ? filters.categories : [])
  ].filter(Boolean).length;
  
  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity" 
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-labelledby="filter-panel-title"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 
            id="filter-panel-title" 
            className="text-lg font-medium text-[#1A2C5B]"
          >
            Advanced Filters
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3C3B6E]"
            onClick={onResetFilters}
            aria-label="Close filter panel"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-32">
          <div className="p-4">
            {/* Location section */}
            <div className="mb-6">
              <button
                type="button"
                className="flex w-full justify-between items-center text-left font-medium text-[#1A2C5B] mb-2 focus:outline-none focus:text-[#3C3B6E]"
                onClick={() => toggleSection('location')}
                aria-expanded={expandedSections.location}
              >
                <span className="text-lg">Location</span>
                {expandedSections.location ? (
                  <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              
              {expandedSections.location && (
                <div className="ml-2 space-y-4 mt-3">
                  <div>
                    <label htmlFor="state-selector" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      id="state-selector"
                      value={filters.selectedState || ''}
                      onChange={(e) => updateFilter('selectedState', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#3C3B6E] focus:ring-[#3C3B6E]"
                    >
                      <option value="">All States</option>
                      {US_STATES.map(state => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="distance-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Distance (miles)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        id="distance-input"
                        type="range"
                        min="5"
                        max="500"
                        step="5"
                        value={filters.distanceInMiles || 50}
                        onChange={(e) => updateFilter('distanceInMiles', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                        {filters.distanceInMiles || 50}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Veteran specific section */}
            <div className="mb-6">
              <button
                type="button"
                className="flex w-full justify-between items-center text-left font-medium text-[#1A2C5B] mb-2 focus:outline-none focus:text-[#3C3B6E]"
                onClick={() => toggleSection('veteran')}
                aria-expanded={expandedSections.veteran}
              >
                <span className="text-lg">Veteran Details</span>
                {expandedSections.veteran ? (
                  <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              
              {expandedSections.veteran && (
                <div className="ml-2 space-y-4 mt-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Veteran Type</h3>
                    <div className="space-y-2">
                      {VETERAN_TYPE_OPTIONS.map(option => (
                        <div key={option} className="flex items-center">
                          <input
                            type="radio"
                            id={`veteran-type-${option}`}
                            name="veteranType"
                            value={option}
                            checked={veteranType === option}
                            onChange={() => setVeteranType(option)}
                            className="mr-2 h-4 w-4 text-[#1A2C5B] focus:ring-[#3C3B6E]"
                          />
                          <label
                            htmlFor={`veteran-type-${option}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Service Branch</h3>
                    <div className="space-y-2">
                      {SERVICE_BRANCH_OPTIONS.map(option => (
                        <div key={option} className="flex items-center">
                          <input
                            type="radio"
                            id={`service-branch-${option}`}
                            name="serviceBranch"
                            value={option}
                            checked={serviceBranch === option}
                            onChange={() => setServiceBranch(option)}
                            className="mr-2 h-4 w-4 text-[#1A2C5B] focus:ring-[#3C3B6E]"
                          />
                          <label
                            htmlFor={`service-branch-${option}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Eligibility</h3>
                    <div className="space-y-2">
                      {ELIGIBILITY_OPTIONS.map(option => (
                        <div key={option} className="flex items-center">
                          <input
                            type="radio"
                            id={`eligibility-${option}`}
                            name="eligibility"
                            value={option}
                            checked={eligibility === option}
                            onChange={() => setEligibility(option)}
                            className="mr-2 h-4 w-4 text-[#1A2C5B] focus:ring-[#3C3B6E]"
                          />
                          <label
                            htmlFor={`eligibility-${option}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Resource type section */}
            <div className="mb-6">
              <button
                type="button"
                className="flex w-full justify-between items-center text-left font-medium text-[#1A2C5B] mb-2 focus:outline-none focus:text-[#3C3B6E]"
                onClick={() => toggleSection('resourceType')}
                aria-expanded={expandedSections.resourceType}
              >
                <span className="text-lg">Provider Type</span>
                {expandedSections.resourceType ? (
                  <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              
              {expandedSections.resourceType && (
                <div className="ml-2 space-y-4 mt-3">
                  {/* Resource Type Radio Buttons */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Resource Provider Type</h3>
                    <div className="space-y-2">
                      {RESOURCE_TYPES.map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            type="radio"
                            id={`resource-type-${type.toLowerCase().replace(/\//g, '-')}`}
                            name="resourceType"
                            value={type}
                            checked={resourceType === type || (type === 'All' && resourceType === 'all')}
                            onChange={() => {
                              if (setResourceType) {
                                setResourceType(type);
                                updateFilter('resourceTypes', [type]);
                              }
                            }}
                            className="mr-2 h-4 w-4 text-[#1A2C5B] focus:ring-[#3C3B6E]"
                          />
                          <label 
                            htmlFor={`resource-type-${type.toLowerCase().replace(/\//g, '-')}`}
                            className="text-sm text-gray-600"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <label htmlFor="toggle-va" className="text-sm text-gray-600">
                      VA Resources
                    </label>
                    <Switch
                      id="toggle-va"
                      checked={filters.includeVA ?? true}
                      onCheckedChange={(checked: boolean) => updateFilter('includeVA', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <label htmlFor="toggle-ngo" className="text-sm text-gray-600">
                      NGOs & Non-Profits
                    </label>
                    <Switch
                      id="toggle-ngo"
                      checked={filters.includeNGO ?? true}
                      onCheckedChange={(checked: boolean) => updateFilter('includeNGO', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <label htmlFor="toggle-state" className="text-sm text-gray-600">
                      State Resources
                    </label>
                    <Switch
                      id="toggle-state"
                      checked={filters.includeState ?? true}
                      onCheckedChange={(checked: boolean) => updateFilter('includeState', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <label htmlFor="toggle-federal" className="text-sm text-gray-600">
                      Federal Resources
                    </label>
                    <Switch
                      id="toggle-federal"
                      checked={filters.includeFederal ?? true}
                      onCheckedChange={(checked: boolean) => updateFilter('includeFederal', checked)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer buttons */}
            <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg md:right-auto md:w-96">
              <div className="flex justify-between space-x-4">
                <Button
                  onClick={handleClearFilters}
                  className={`${buttonVariants({ variant: 'outline' })} flex-1`}
                  disabled={!filtersModified && activeFilterCount === 0}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className={`${buttonVariants({ variant: 'default' })} flex-1`}
                  disabled={!filtersModified}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedFilterPanel;
