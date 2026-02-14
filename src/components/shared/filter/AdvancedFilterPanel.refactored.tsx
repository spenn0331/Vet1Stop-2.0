import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, buttonVariants } from '../../../components/ui/button';

// Import reusable filter components
import CollapsibleFilterSection from './CollapsibleFilterSection';
import RadioFilterGroup from './RadioFilterGroup';
import DropdownFilter from './DropdownFilter';
import ToggleFilter from './ToggleFilter';

// Import filter options
import { 
  VETERAN_TYPE_OPTIONS, 
  SERVICE_BRANCH_OPTIONS,
  ELIGIBILITY_OPTIONS,
  US_STATES,
  RESOURCE_TYPES
} from '../../../constants/filterOptions';

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
 * AdvancedFilterPanel - Refactored
 * 
 * Provides comprehensive filtering options in a modal panel
 * Uses composable, reusable filter components for better maintainability
 * Implements keyboard navigation and accessibility features
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
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  // Internal filter state for controlled components
  const [localState, setLocalState] = useState({
    selectedState,
    veteranType,
    serviceBranch,
    eligibility,
    resourceType,
    // Additional filter options
    includeVA: true,
    includeNGO: true,
    includeState: true,
    includeFederal: true,
    rating: 3,
    distanceInMiles: 50
  });

  // Track if filters have been modified
  const [filtersModified, setFiltersModified] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    setLocalState({
      selectedState,
      veteranType,
      serviceBranch,
      eligibility,
      resourceType,
      includeVA: true,
      includeNGO: true,
      includeState: true,
      includeFederal: true,
      rating: 3,
      distanceInMiles: 50
    });
    setFiltersModified(false);
  }, [selectedState, veteranType, serviceBranch, eligibility, resourceType]);

  // Set up keyboard focus management
  useEffect(() => {
    if (isExpanded && panelRef.current) {
      // Set initial focus on close button for accessibility
      closeButtonRef.current?.focus();
      
      // Find all focusable elements in the panel
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        firstFocusableRef.current = focusableElements[0] as HTMLElement;
        lastFocusableRef.current = focusableElements[focusableElements.length - 1] as HTMLElement;
      }
    }
  }, [isExpanded]);

  // Handle keyboard trap inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose?.();
      return;
    }
    
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusableRef.current) {
        e.preventDefault();
        lastFocusableRef.current?.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusableRef.current) {
        e.preventDefault();
        firstFocusableRef.current?.focus();
      }
    }
  };

  // Update handler for local state
  const updateLocalState = <K extends keyof typeof localState>(key: K, value: (typeof localState)[K]) => {
    setLocalState(prev => ({ ...prev, [key]: value }));
    setFiltersModified(true);
  };

  // Count active filters for badges
  const getActiveSectionCounts = () => {
    return {
      location: localState.selectedState !== 'all' && localState.selectedState !== '' ? 1 : 0,
      veteran: (
        (localState.veteranType !== 'all' ? 1 : 0) +
        (localState.serviceBranch !== 'all' ? 1 : 0) +
        (localState.eligibility !== 'all' ? 1 : 0)
      ),
      resourceType: localState.resourceType !== 'all' ? 1 : 0,
      organizations: (
        (!localState.includeVA ? 1 : 0) +
        (!localState.includeNGO ? 1 : 0) +
        (!localState.includeState ? 1 : 0) +
        (!localState.includeFederal ? 1 : 0)
      )
    };
  };

  // Calculate total active filters
  const activeFilterCount = Object.values(getActiveSectionCounts()).reduce((sum, count) => sum + count, 0);
  
  // Filter section counts for badges
  const sectionCounts = getActiveSectionCounts();

  // Apply filters to parent components
  const handleApplyFilters = () => {
    setSelectedState(localState.selectedState);
    setVeteranType(localState.veteranType);
    setServiceBranch(localState.serviceBranch);
    setEligibility(localState.eligibility);
    setResourceType(localState.resourceType);
    setFiltersModified(false);
    
    onClose?.();
  };

  // Reset local filters
  const handleResetFilters = () => {
    setLocalState({
      selectedState: 'all',
      veteranType: 'all',
      serviceBranch: 'all',
      eligibility: 'all',
      resourceType: 'all',
      includeVA: true,
      includeNGO: true,
      includeState: true,
      includeFederal: true,
      rating: 3,
      distanceInMiles: 50
    });
    
    onResetFilters();
    setFiltersModified(false);
  };

  // If not expanded, don't render
  if (!isExpanded) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex bg-black bg-opacity-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-heading"
      ref={panelRef}
      onKeyDown={handleKeyDown}
    >
      {/* Filter panel */}
      <div 
        className="relative ml-auto w-full max-w-md bg-white shadow-xl h-full flex flex-col"
        aria-labelledby="filter-heading"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1A2C5B] text-white">
          <h2 id="filter-heading" className="text-xl font-semibold">Advanced Filters</h2>
          <button
            ref={closeButtonRef}
            className="p-1 rounded-full hover:bg-[#0F1A36] focus:outline-none focus:ring-2 focus:ring-white"
            onClick={onClose}
            aria-label="Close filters panel"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Filter content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Location section */}
            <CollapsibleFilterSection 
              title="Location" 
              defaultExpanded={true}
              badge={sectionCounts.location}
            >
              <DropdownFilter
                label="State"
                options={US_STATES}
                selectedValue={localState.selectedState}
                onChange={(state) => updateLocalState('selectedState', state)}
                placeholder="Select a state"
                description="Filter resources by state"
              />
            </CollapsibleFilterSection>

            {/* Veteran Information section */}
            <CollapsibleFilterSection 
              title="Veteran Information" 
              defaultExpanded={true}
              badge={sectionCounts.veteran}
            >
              <div className="space-y-4">
                <RadioFilterGroup
                  name="veteran-type"
                  label="Veteran Type"
                  options={VETERAN_TYPE_OPTIONS}
                  selectedValue={localState.veteranType}
                  onChange={(type) => updateLocalState('veteranType', type)}
                  description="Filter by veteran status or military affiliation"
                />

                <RadioFilterGroup
                  name="service-branch"
                  label="Service Branch"
                  options={SERVICE_BRANCH_OPTIONS}
                  selectedValue={localState.serviceBranch}
                  onChange={(branch) => updateLocalState('serviceBranch', branch)}
                />

                <RadioFilterGroup
                  name="eligibility"
                  label="Eligibility"
                  options={ELIGIBILITY_OPTIONS}
                  selectedValue={localState.eligibility}
                  onChange={(eligibility) => updateLocalState('eligibility', eligibility)}
                />
              </div>
            </CollapsibleFilterSection>

            {/* Resource Type section */}
            <CollapsibleFilterSection 
              title="Resource Type" 
              defaultExpanded={true}
              badge={sectionCounts.resourceType}
            >
              <RadioFilterGroup
                name="resource-type"
                label="Provider Type"
                options={RESOURCE_TYPES}
                selectedValue={localState.resourceType}
                onChange={(type) => updateLocalState('resourceType', type)}
                description="Filter resources by provider organization type"
              />
            </CollapsibleFilterSection>

            {/* Organization Toggles section */}
            <CollapsibleFilterSection 
              title="Organizations" 
              defaultExpanded={true}
              badge={sectionCounts.organizations}
            >
              <div className="space-y-3">
                <ToggleFilter
                  label="VA Resources"
                  checked={localState.includeVA}
                  onChange={(checked) => updateLocalState('includeVA', checked)}
                  description="Veterans Affairs healthcare services"
                />

                <ToggleFilter
                  label="NGO Resources"
                  checked={localState.includeNGO}
                  onChange={(checked) => updateLocalState('includeNGO', checked)}
                  description="Non-profit and charitable organizations"
                />

                <ToggleFilter
                  label="State Resources"
                  checked={localState.includeState}
                  onChange={(checked) => updateLocalState('includeState', checked)}
                  description="State-level programs and services"
                />

                <ToggleFilter
                  label="Federal Resources"
                  checked={localState.includeFederal}
                  onChange={(checked) => updateLocalState('includeFederal', checked)}
                  description="Federal government programs"
                />
              </div>
            </CollapsibleFilterSection>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex justify-between space-x-3">
            <Button
              onClick={handleResetFilters}
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
              Apply {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;
