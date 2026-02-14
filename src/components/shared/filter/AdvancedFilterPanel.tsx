import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { 
  VETERAN_TYPE_OPTIONS, 
  SERVICE_BRANCH_OPTIONS,
  ELIGIBILITY_OPTIONS,
  US_STATES,
  RESOURCE_TYPES,
  HEALTH_CATEGORY_OPTIONS
} from '../../../constants/filterOptions';

// Import our new filter components
import CollapsibleFilterSection from './CollapsibleFilterSection';
import RadioFilterGroup from './RadioFilterGroup';
import DropdownFilter from './DropdownFilter';
import ToggleFilter from './ToggleFilter';

interface AdvancedFilterPanelProps {
  // Required props
  selectedState: string;
  setSelectedState: (state: string) => void;
  veteranType: string;
  setVeteranType: (type: string) => void;
  serviceBranch: string;
  setServiceBranch: (branch: string) => void;
  eligibility: string;
  setEligibility: (eligibility: string) => void;
  
  // Optional props
  resourceType?: string;
  setResourceType?: (type: string) => void;
  onResetFilters: () => void;
  isExpanded: boolean;
  onClose?: () => void;
}

/**
 * AdvancedFilterPanel component - Refactored
 * 
 * Provides advanced filtering options for resources with multiple selectable criteria
 * Implements Recommendation #8 (Interactive Filtering) from resource-ux-ui-recommendations.md
 * 
 * This version uses smaller, reusable components for better maintainability
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
  isExpanded,
  onClose
}) => {
  // Refs for accessibility
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // States for filter functionality
  const [localFilters, setLocalFilters] = useState({
    state: selectedState,
    veteranType,
    serviceBranch,
    eligibility,
    resourceType,
    includeVA: true,
    includeNGO: true,
    includeState: true,
    includeFederal: true,
    rating: 1,
    distanceInMiles: 50
  });

  // Track if filters have been modified for UX feedback
  const [filtersModified, setFiltersModified] = useState(false);
  
  // Calculate active filter count for UI
  const activeFilterCount = Object.entries(localFilters).reduce((count, [key, value]) => {
    if (key === 'state' && value !== 'all') return count + 1;
    if (key === 'veteranType' && value !== 'all') return count + 1;
    if (key === 'serviceBranch' && value !== 'all') return count + 1;
    if (key === 'eligibility' && value !== 'all') return count + 1;
    if (key === 'resourceType' && value !== 'all') return count + 1;
    return count;
  }, 0);

  // Sync local state with props
  useEffect(() => {
    setLocalFilters({
      state: selectedState,
      veteranType,
      serviceBranch,
      eligibility,
      resourceType,
      includeVA: true,
      includeNGO: true,
      includeState: true,
      includeFederal: true,
      rating: 1,
      distanceInMiles: 50
    });
    setFiltersModified(false);
  }, [selectedState, veteranType, serviceBranch, eligibility, resourceType]);

  // Focus management for accessibility
  useEffect(() => {
    if (isExpanded && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isExpanded]);

  // Event handlers
  const handleStateChange = (state: string) => {
    setLocalFilters(prev => ({ ...prev, state }));
    setFiltersModified(true);
  };

  const handleVeteranTypeChange = (type: string) => {
    setLocalFilters(prev => ({ ...prev, veteranType: type }));
    setFiltersModified(true);
  };

  const handleServiceBranchChange = (branch: string) => {
    setLocalFilters(prev => ({ ...prev, serviceBranch: branch }));
    setFiltersModified(true);
  };

  const handleEligibilityChange = (eligibility: string) => {
    setLocalFilters(prev => ({ ...prev, eligibility }));
    setFiltersModified(true);
  };

  const handleResourceTypeChange = (type: string) => {
    setLocalFilters(prev => ({ ...prev, resourceType: type }));
    setFiltersModified(true);
  };

  const handleToggleChange = (key: string, checked: boolean) => {
    setLocalFilters(prev => ({ ...prev, [key]: checked }));
    setFiltersModified(true);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      state: 'all',
      veteranType: 'all',
      serviceBranch: 'all',
      eligibility: 'all',
      resourceType: 'all',
      includeVA: true,
      includeNGO: true,
      includeState: true,
      includeFederal: true,
      rating: 1,
      distanceInMiles: 50
    });
    onResetFilters();
    setFiltersModified(false);
  };

  const handleApplyFilters = () => {
    // Apply all filter changes at once
    setSelectedState(localFilters.state);
    setVeteranType(localFilters.veteranType);
    setServiceBranch(localFilters.serviceBranch);
    setEligibility(localFilters.eligibility);
    setResourceType(localFilters.resourceType);
    setFiltersModified(false);
    
    // Close panel if needed
    if (onClose) {
      onClose();
    }
  };

  // Only render the panel content when it's expanded
  if (!isExpanded) {
    return null;
  }

  return (
    <div 
      ref={panelRef}
      className="fixed inset-0 z-40 flex bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-label="Advanced filter options"
    >
      {/* Main filter panel */}
      <div 
        className="ml-auto w-full max-w-xs md:max-w-md overflow-hidden bg-white shadow-xl h-full flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#1A2C5B] px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Advanced Filters</h2>
          <button
            ref={closeButtonRef}
            className="rounded-md bg-[#1A2C5B] text-white hover:bg-[#0F1A36] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={onClose}
            aria-label="Close filters panel"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Filter content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Location Section */}
            <CollapsibleFilterSection 
              title="Location" 
              defaultExpanded={true}
              badge={localFilters.state !== 'all' ? 1 : 0}
            >
              <DropdownFilter
                id="state-filter"
                label="State"
                options={US_STATES}
                selectedValue={localFilters.state}
                onChange={handleStateChange}
                placeholder="Select a state"
                className="mt-2"
              />
            </CollapsibleFilterSection>

            {/* Veteran Information Section */}
            <CollapsibleFilterSection 
              title="Veteran Information" 
              defaultExpanded={true}
              badge={
                (localFilters.veteranType !== 'all' ? 1 : 0) +
                (localFilters.serviceBranch !== 'all' ? 1 : 0) +
                (localFilters.eligibility !== 'all' ? 1 : 0)
              }
            >
              <div className="space-y-4">
                <RadioFilterGroup
                  name="veteran-type"
                  label="Veteran Type"
                  options={VETERAN_TYPE_OPTIONS}
                  selectedValue={localFilters.veteranType}
                  onChange={handleVeteranTypeChange}
                />

                <RadioFilterGroup
                  name="service-branch"
                  label="Service Branch"
                  options={SERVICE_BRANCH_OPTIONS}
                  selectedValue={localFilters.serviceBranch}
                  onChange={handleServiceBranchChange}
                />

                <RadioFilterGroup
                  name="eligibility"
                  label="Eligibility"
                  options={ELIGIBILITY_OPTIONS}
                  selectedValue={localFilters.eligibility}
                  onChange={handleEligibilityChange}
                />
              </div>
            </CollapsibleFilterSection>

            {/* Resource Type Section */}
            <CollapsibleFilterSection 
              title="Resource Type" 
              defaultExpanded={true}
              badge={localFilters.resourceType !== 'all' ? 1 : 0}
            >
              <RadioFilterGroup
                name="resource-type"
                options={RESOURCE_TYPES}
                selectedValue={localFilters.resourceType}
                onChange={handleResourceTypeChange}
              />

              <div className="mt-4 space-y-3">
                <ToggleFilter
                  id="include-va"
                  label="VA Resources"
                  checked={localFilters.includeVA}
                  onChange={(checked) => handleToggleChange('includeVA', checked)}
                  description="Veterans Affairs healthcare services"
                />

                <ToggleFilter
                  id="include-ngo"
                  label="NGO Resources"
                  checked={localFilters.includeNGO}
                  onChange={(checked) => handleToggleChange('includeNGO', checked)}
                  description="Non-profit and charitable organizations"
                />

                <ToggleFilter
                  id="include-state"
                  label="State Resources"
                  checked={localFilters.includeState}
                  onChange={(checked) => handleToggleChange('includeState', checked)}
                  description="State-level programs and services"
                />

                <ToggleFilter
                  id="include-federal"
                  label="Federal Resources"
                  checked={localFilters.includeFederal}
                  onChange={(checked) => handleToggleChange('includeFederal', checked)}
                  description="Federal government programs"
                />
              </div>
            </CollapsibleFilterSection>
          </div>
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
  );
};

export default AdvancedFilterPanel;
