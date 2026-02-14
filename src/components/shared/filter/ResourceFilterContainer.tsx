import React, { useState, useCallback } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Button, buttonVariants } from '../../../components/ui/button';
import AdvancedFilterPanelRefactored from './AdvancedFilterPanel.refactored';
import { ResourceFilters } from '../../../hooks/useResourceFilters';

interface ResourceFilterContainerProps {
  // Filter states from the useResourceFilters hook
  filters: ResourceFilters;
  
  // Filter update methods
  setSearchTerm: (term: string) => void;
  setCategory: (category: string) => void;
  setState: (state: string) => void;
  setVeteranType: (type: string) => void;
  setServiceBranch: (branch: string) => void;
  setEligibility: (eligibility: string) => void;
  setResourceType: (type: string) => void;
  
  // Filter reset method
  resetFilters: () => void;
  
  // Filter counts for visual feedback
  filterCounts: {
    total: number;
    active: number;
  };
  
  // Optional props for customization
  className?: string;
  panelPosition?: 'right' | 'left';
  label?: string;
}

/**
 * ResourceFilterContainer component
 * 
 * Main container component that coordinates all filtering functionality
 * Provides the button to open the advanced filter panel and manages its state
 */
const ResourceFilterContainer: React.FC<ResourceFilterContainerProps> = ({
  filters,
  setSearchTerm,
  setCategory,
  setState,
  setVeteranType,
  setServiceBranch,
  setEligibility,
  setResourceType,
  resetFilters,
  filterCounts,
  className = '',
  panelPosition = 'right',
  label = 'Filters'
}) => {
  // Panel open/close state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Open the advanced filter panel
  const openFilterPanel = useCallback(() => {
    setIsPanelOpen(true);
    // Prevent background scrolling when panel is open
    document.body.style.overflow = 'hidden';
  }, []);
  
  // Close the advanced filter panel
  const closeFilterPanel = useCallback(() => {
    setIsPanelOpen(false);
    // Restore background scrolling when panel is closed
    document.body.style.overflow = '';
  }, []);
  
  return (
    <div className={className}>
      {/* Filter toggle button */}
      <Button
        onClick={openFilterPanel}
        aria-label={`Open advanced filters. ${filterCounts.active} filters currently active.`}
        aria-expanded={isPanelOpen}
        className={`${buttonVariants({ variant: 'default' })} inline-flex items-center`}
      >
        <FunnelIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        {label}
        {filterCounts.active > 0 && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#1A2C5B]">
            {filterCounts.active}
          </span>
        )}
      </Button>
      
      {/* Advanced filter panel */}
      {isPanelOpen && (
        <AdvancedFilterPanelRefactored
          selectedState={filters.selectedState}
          setSelectedState={setState}
          veteranType={filters.veteranType}
          setVeteranType={setVeteranType}
          serviceBranch={filters.serviceBranch}
          setServiceBranch={setServiceBranch}
          eligibility={filters.eligibility}
          setEligibility={setEligibility}
          resourceType={filters.resourceType}
          setResourceType={setResourceType}
          onResetFilters={resetFilters}
          isExpanded={isPanelOpen}
          onClose={closeFilterPanel}
        />
      )}
    </div>
  );
};

export default ResourceFilterContainer;
