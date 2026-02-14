"use client";

import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  HeartIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Define resource type options
export const RESOURCE_TYPES = [
  { id: 'va', label: 'VA Resources', icon: <BuildingLibraryIcon className="h-5 w-5 text-[#1A2C5B]" /> },
  { id: 'federal', label: 'Federal Programs', icon: <BuildingOffice2Icon className="h-5 w-5 text-[#1A2C5B]" /> },
  { id: 'state', label: 'State Resources', icon: <GlobeAltIcon className="h-5 w-5 text-[#1A2C5B]" /> },
  { id: 'ngo', label: 'NGO/Non-Profit', icon: <HeartIcon className="h-5 w-5 text-[#B22234]" /> },
  { id: 'academic', label: 'Academic', icon: <AcademicCapIcon className="h-5 w-5 text-[#1A2C5B]" /> },
  { id: 'private', label: 'Private Sector', icon: <BriefcaseIcon className="h-5 w-5 text-[#1A2C5B]" /> }
];

// Define veteran types for filtering
export const VETERAN_TYPES = [
  { id: 'all-veterans', label: 'All Veterans' },
  { id: 'post-911', label: 'Post-9/11 Veterans' },
  { id: 'vietnam', label: 'Vietnam Era Veterans' },
  { id: 'gulf-war', label: 'Gulf War Veterans' },
  { id: 'disabled', label: 'Disabled Veterans' },
  { id: 'combat', label: 'Combat Veterans' },
  { id: 'female', label: 'Women Veterans' },
  { id: 'retired', label: 'Retired Veterans' },
  { id: 'active-duty', label: 'Active Duty' },
  { id: 'reservist', label: 'Reservists' },
  { id: 'national-guard', label: 'National Guard' },
  { id: 'family', label: 'Family Members' }
];

// Define service branches for filtering
export const SERVICE_BRANCHES = [
  { id: 'army', label: 'Army' },
  { id: 'navy', label: 'Navy' },
  { id: 'air-force', label: 'Air Force' },
  { id: 'marines', label: 'Marines' },
  { id: 'coast-guard', label: 'Coast Guard' },
  { id: 'space-force', label: 'Space Force' }
];

// Interface for the component props
interface AdvancedFilterPanelProps {
  onFilterChange: (filters: AdvancedFilters) => void;
  initialFilters?: AdvancedFilters;
  className?: string;
}

// Interface for filter state
export interface AdvancedFilters {
  resourceTypes: string[];
  veteranTypes: string[];
  serviceBranches: string[];
  featuredOnly: boolean;
  recentlyUpdated: boolean;
}

export default function AdvancedFilterPanel({
  onFilterChange,
  initialFilters,
  className
}: AdvancedFilterPanelProps) {
  // Default initial filters if none provided
  const defaultFilters: AdvancedFilters = {
    resourceTypes: [],
    veteranTypes: [],
    serviceBranches: [],
    featuredOnly: false,
    recentlyUpdated: false
  };

  // State for filters
  const [filters, setFilters] = useState<AdvancedFilters>(initialFilters || defaultFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle resource type selection
  const handleResourceTypeChange = (type: string) => {
    setFilters((prev) => {
      const updatedTypes = prev.resourceTypes.includes(type)
        ? prev.resourceTypes.filter((t) => t !== type)
        : [...prev.resourceTypes, type];

      const updatedFilters = {
        ...prev,
        resourceTypes: updatedTypes
      };

      onFilterChange(updatedFilters);
      return updatedFilters;
    });
  };

  // Handle veteran type selection
  const handleVeteranTypeChange = (type: string) => {
    setFilters((prev) => {
      const updatedTypes = prev.veteranTypes.includes(type)
        ? prev.veteranTypes.filter((t) => t !== type)
        : [...prev.veteranTypes, type];

      const updatedFilters = {
        ...prev,
        veteranTypes: updatedTypes
      };

      onFilterChange(updatedFilters);
      return updatedFilters;
    });
  };

  // Handle service branch selection
  const handleServiceBranchChange = (branch: string) => {
    setFilters((prev) => {
      const updatedBranches = prev.serviceBranches.includes(branch)
        ? prev.serviceBranches.filter((b) => b !== branch)
        : [...prev.serviceBranches, branch];

      const updatedFilters = {
        ...prev,
        serviceBranches: updatedBranches
      };

      onFilterChange(updatedFilters);
      return updatedFilters;
    });
  };

  // Handle toggle filters (featuredOnly, recentlyUpdated)
  const handleToggleChange = (key: keyof AdvancedFilters) => {
    setFilters((prev) => {
      const updatedFilters = {
        ...prev,
        [key]: !prev[key as keyof typeof prev]
      };

      onFilterChange(updatedFilters);
      return updatedFilters;
    });
  };

  // Reset all filters to defaults
  const resetFilters = () => {
    const resetFilters = {
      resourceTypes: [],
      veteranTypes: [],
      serviceBranches: [],
      featuredOnly: false,
      recentlyUpdated: false
    };
    
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Count active filters
  const activeFilterCount = 
    filters.resourceTypes.length + 
    filters.veteranTypes.length + 
    filters.serviceBranches.length + 
    (filters.featuredOnly ? 1 : 0) + 
    (filters.recentlyUpdated ? 1 : 0);

  return (
    <div className={`rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Panel Header */}
      <button 
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="advanced-filter-panel"
      >
        <div className="flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-[#1A2C5B]" />
          <span className="font-medium">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-[#1A2C5B] text-white text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Filter Content (Collapsible) */}
      <div
        id="advanced-filter-panel"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px]' : 'max-h-0'
        }`}
        role="region"
        aria-labelledby="advanced-filter-heading"
      >
        <div className="p-4 bg-white border-t border-gray-200">
          {/* Resource Types Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Resource Provider Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {RESOURCE_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`resource-type-${type.id}`}
                    checked={filters.resourceTypes.includes(type.id)}
                    onCheckedChange={() => handleResourceTypeChange(type.id)}
                  />
                  <Label 
                    htmlFor={`resource-type-${type.id}`}
                    className="flex items-center text-sm font-medium cursor-pointer"
                  >
                    <span className="mr-1.5">{type.icon}</span>
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="featured-only"
                checked={filters.featuredOnly}
                onCheckedChange={() => handleToggleChange('featuredOnly')}
              />
              <Label htmlFor="featured-only" className="text-sm font-medium cursor-pointer">
                Featured resources only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="recently-updated"
                checked={filters.recentlyUpdated}
                onCheckedChange={() => handleToggleChange('recentlyUpdated')}
              />
              <Label htmlFor="recently-updated" className="text-sm font-medium cursor-pointer">
                Recently updated
              </Label>
            </div>
          </div>

          {/* Service Member Type */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Veteran/Service Member Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {VETERAN_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`veteran-type-${type.id}`}
                    checked={filters.veteranTypes.includes(type.id)}
                    onCheckedChange={() => handleVeteranTypeChange(type.id)}
                  />
                  <Label 
                    htmlFor={`veteran-type-${type.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Service Branch */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Service Branch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {SERVICE_BRANCHES.map((branch) => (
                <div key={branch.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`branch-${branch.id}`}
                    checked={filters.serviceBranches.includes(branch.id)}
                    onCheckedChange={() => handleServiceBranchChange(branch.id)}
                  />
                  <Label 
                    htmlFor={`branch-${branch.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {branch.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-gray-600"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Reset Filters
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="bg-[#1A2C5B] hover:bg-[#1A2C5B]/90"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
