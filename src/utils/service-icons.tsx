import React from 'react';
import { 
  HeartIcon, 
  UserGroupIcon, 
  HomeIcon, 
  AcademicCapIcon, 
  CurrencyDollarIcon,
  BeakerIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

// Service type icons for NGO resources
export const serviceTypeIcons: Record<string, React.ReactNode> = {
  'Mental Health': (
    <HeartIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
  ),
  'Physical Health': (
    <BeakerIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
  ),
  'Family Support': (
    <UserGroupIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
  ),
  'Housing': (
    <HomeIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
  ),
  'Education': (
    <AcademicCapIcon className="h-5 w-5 text-purple-500" aria-hidden="true" />
  ),
  'Financial': (
    <CurrencyDollarIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
  ),
  // Add fallback for other service types
  'default': (
    <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
  )
};

// Military branch icons
export const branchIcons: Record<string, React.ReactNode> = {
  'Army': (
    <ShieldCheckIcon className="h-5 w-5 text-green-700" aria-hidden="true" />
  ),
  'Navy': (
    <ShieldCheckIcon className="h-5 w-5 text-blue-700" aria-hidden="true" />
  ),
  'Air Force': (
    <ShieldCheckIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
  ),
  'Marines': (
    <ShieldCheckIcon className="h-5 w-5 text-red-700" aria-hidden="true" />
  ),
  'Coast Guard': (
    <ShieldCheckIcon className="h-5 w-5 text-teal-700" aria-hidden="true" />
  ),
  'National Guard': (
    <ShieldCheckIcon className="h-5 w-5 text-yellow-700" aria-hidden="true" />
  ),
  'Reserves': (
    <ShieldCheckIcon className="h-5 w-5 text-purple-700" aria-hidden="true" />
  ),
  // Add fallback for other branches
  'default': (
    <ShieldCheckIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
  )
};

// Get icon by service type
export function getServiceTypeIcon(serviceType: string): React.ReactNode {
  return serviceTypeIcons[serviceType] || serviceTypeIcons['default'];
}

// Get icon by branch
export function getBranchIcon(branch: string): React.ReactNode {
  return branchIcons[branch] || branchIcons['default'];
}

// Verification badge element
export function VerificationBadge() {
  return (
    <span 
      className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
      title="This organization has been verified by the Vet1Stop team"
    >
      <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-blue-700" fill="currentColor" viewBox="0 0 8 8">
        <circle cx={4} cy={4} r={3} />
      </svg>
      Verified
    </span>
  );
}

// Federal badge element
export function FederalBadge() {
  return (
    <span 
      className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
      title="This is a federal government organization"
    >
      <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-indigo-500" fill="currentColor" viewBox="0 0 8 8">
        <circle cx={4} cy={4} r={3} />
      </svg>
      Federal
    </span>
  );
}

// Non-profit badge element
export function NonProfitBadge() {
  return (
    <span 
      className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
      title="This is a non-profit organization"
    >
      <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 8 8">
        <circle cx={4} cy={4} r={3} />
      </svg>
      Non-Profit
    </span>
  );
}
