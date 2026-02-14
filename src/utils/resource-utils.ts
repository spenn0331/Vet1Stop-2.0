/**
 * Utility functions for working with resources
 */
import React from 'react';
import {
  BuildingLibraryIcon,
  StarIcon,
  BeakerIcon,
  BookOpenIcon,
  AcademicCapIcon,
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  UserIcon,
  GlobeAltIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  HandRaisedIcon,
  BuildingOffice2Icon,
  TruckIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  LifebuoyIcon
} from '@heroicons/react/24/outline';

// Resource type interfaces
export interface HealthResource {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  resourceType?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: { lat: number; lng: number } | null;
  };
  eligibility?: string;
  veteranType?: string[];
  serviceBranch?: string[];
  tags?: string[];
  isFeatured?: boolean;
  lastUpdated?: Date;
  imageUrl?: string;
  thumbnail?: string;
  rating?: number;
  reviewCount?: number;
  link?: string;
  organization?: string;
}

/**
 * Get appropriate icon based on resource category and type
 */
export const getCategoryIcon = (
  category: string,
  resourceType: string = '',
  resource?: HealthResource
) => {
  // Convert to lowercase for case-insensitive matching
  const normalizedCategory = category.toLowerCase();
  const normalizedType = resourceType.toLowerCase();
  
  // Common sizes for icons
  const iconSize = 'h-16 w-16';
  const iconColor = 'text-white';
  
  // Mental health resources
  if (
    normalizedCategory.includes('mental health') ||
    normalizedCategory.includes('ptsd') ||
    normalizedCategory.includes('counseling') ||
    normalizedCategory.includes('therapy')
  ) {
    return <SparklesIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Primary care resources
  if (
    normalizedCategory.includes('primary care') ||
    normalizedCategory.includes('healthcare') ||
    normalizedCategory.includes('health care') ||
    normalizedCategory.includes('medical')
  ) {
    return <BuildingOffice2Icon className={`${iconSize} ${iconColor}`} />;
  }
  
  // VA resources
  if (
    normalizedType.includes('va') ||
    normalizedCategory.includes('va benefits') ||
    normalizedCategory.includes('va healthcare')
  ) {
    return <BuildingLibraryIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Emergency resources
  if (
    normalizedCategory.includes('emergency') ||
    normalizedCategory.includes('crisis')
  ) {
    return <ExclamationTriangleIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Specialty care
  if (normalizedCategory.includes('specialty care')) {
    return <BeakerIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Wellness programs
  if (
    normalizedCategory.includes('wellness') ||
    normalizedCategory.includes('fitness') ||
    normalizedCategory.includes('nutrition')
  ) {
    return <StarIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Caregiver support
  if (normalizedCategory.includes('caregiver')) {
    return <HandRaisedIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Women's health
  if (normalizedCategory.includes('women')) {
    return <UserIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Substance abuse
  if (
    normalizedCategory.includes('substance') ||
    normalizedCategory.includes('addiction') ||
    normalizedCategory.includes('alcohol') ||
    normalizedCategory.includes('drug')
  ) {
    return <LifebuoyIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Dental/vision services
  if (
    normalizedCategory.includes('dental') ||
    normalizedCategory.includes('vision')
  ) {
    return <BookOpenIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Pharmacy services
  if (normalizedCategory.includes('pharmacy')) {
    return <ClipboardDocumentListIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Telehealth services
  if (normalizedCategory.includes('telehealth')) {
    return <ComputerDesktopIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Community care
  if (normalizedCategory.includes('community')) {
    return <UserGroupIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Financial assistance
  if (normalizedCategory.includes('financial')) {
    return <BanknotesIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Housing assistance
  if (normalizedCategory.includes('housing')) {
    return <HomeIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Education programs
  if (normalizedCategory.includes('education')) {
    return <AcademicCapIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Vocational rehabilitation
  if (
    normalizedCategory.includes('vocational') ||
    normalizedCategory.includes('rehabilitation')
  ) {
    return <BriefcaseIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Recreational therapy
  if (normalizedCategory.includes('recreational')) {
    return <PuzzlePieceIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Non-governmental organizations
  if (normalizedCategory.includes('ngo') || normalizedType.includes('ngo')) {
    return <GlobeAltIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Peer support
  if (normalizedCategory.includes('peer support')) {
    return <UserGroupIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Research & clinical trials
  if (
    normalizedCategory.includes('research') ||
    normalizedCategory.includes('clinical')
  ) {
    return <BeakerIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Fall back to resource type if category doesn't match
  // Federal resources
  if (normalizedType.includes('federal')) {
    return <BuildingLibraryIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // State resources
  if (normalizedType.includes('state')) {
    return <BuildingOffice2Icon className={`${iconSize} ${iconColor}`} />;
  }
  
  // NGO/Non-profit resources
  if (
    normalizedType.includes('ngo') ||
    normalizedType.includes('non-profit') ||
    normalizedType.includes('nonprofit')
  ) {
    return <GlobeAltIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Private sector resources
  if (normalizedType.includes('private')) {
    return <BriefcaseIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Academic resources
  if (normalizedType.includes('academic')) {
    return <AcademicCapIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Military resources
  if (normalizedType.includes('military')) {
    return <ShieldCheckIcon className={`${iconSize} ${iconColor}`} />;
  }
  
  // Default icon for unknown categories
  const fallbackIcons = [
    <BuildingLibraryIcon key="building" className={`${iconSize} ${iconColor}`} />,
    <GlobeAltIcon key="globe" className={`${iconSize} ${iconColor}`} />,
    <LifebuoyIcon key="lifebuoy" className={`${iconSize} ${iconColor}`} />,
    <StarIcon key="star" className={`${iconSize} ${iconColor}`} />
  ];
  
  // Use consistent fall back based on resource title or id
  const uniqueValue = (resource?.id || resource?._id || resource?.title || category)
    .toString()
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return fallbackIcons[uniqueValue % fallbackIcons.length];
};
