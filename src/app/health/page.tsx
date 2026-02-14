"use client";

import React, { useState, Suspense, useEffect } from 'react';
// Temporary placeholder imports for Header and Footer until correct path is confirmed
// import Header from '../../components/layout/Header';
// import Footer from '../../components/layout/Footer';
// Placeholder components as fallback
const Header = () => <header className="bg-[#1A2C5B] text-white p-4">Vet1Stop Header</header>;
const Footer = () => <footer className="bg-[#1A2C5B] text-white p-4">Vet1Stop Footer &copy; {new Date().getFullYear()}</footer>;

// Import components
import HeroSection from './components/HeroSection';
import CrisisBanner from './components/CrisisBanner';
import UnifiedResourceFinder from './components/UnifiedResourceFinder';
import ResourceFinderSection from './components/ResourceFinderSection';
import VAHealthcareBenefitsSection from './components/VAHealthcareBenefitsSection';
import StateResourcesSection from './components/StateResourcesSection';
import NGOResourcesSection from './components/NGOResourcesSection';
import ResourcePathwaysSection from './components/ResourcePathwaysSection';
import SymptomBasedResourceFinder from './components/symptom-finder';
import LocationAwareSymptomFinder from './components/symptom-finder/LocationAwareSymptomFinder';
import { HealthResource } from './types/consolidated-health-types';

// Removed metadata export as it cannot be used in a client component
// Metadata is now defined in layout.tsx

// Sample health resources for development/testing
const sampleHealthResources: HealthResource[] = [
  {
    id: '1',
    title: 'VA Mental Health Services',
    description: 'Comprehensive mental health services for veterans, including treatment for depression, PTSD, anxiety, and substance use disorders.',
    url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/',
    imageUrl: '/images/va-mental-health.jpg',
    categories: ['Mental Health', 'VA', 'Crisis Services'],
    tags: ['PTSD', 'Depression', 'Anxiety', 'Substance Use'],
    rating: 4.5,
    reviewCount: 128,
    provider: 'Department of Veterans Affairs',
    isVerified: true,
    isVeteranLed: false,
    contactInfo: {
      phone: '1-800-273-8255',
      email: 'vhainfo@va.gov',
      website: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/'
    },
    eligibility: 'Veterans enrolled in VA healthcare',
    costInfo: 'Free for eligible veterans',
    serviceTypes: ['Counseling', 'Medication Management', 'Group Therapy', 'Telehealth'],
    serviceBranches: ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard'],
    veteranEras: ['Post-9/11', 'Gulf War', 'Vietnam Era', 'Korean War', 'World War II'],
    lastUpdated: '2025-04-15',
    isFeatured: true
  },
  {
    id: '2',
    title: 'Give An Hour',
    description: 'Free mental health services provided by volunteer mental health professionals to veterans, service members, and their families.',
    url: 'https://giveanhour.org/',
    imageUrl: '/images/give-an-hour.jpg',
    categories: ['Mental Health', 'NGO', 'Family Support'],
    tags: ['Counseling', 'PTSD', 'Depression', 'Family'],
    rating: 4.8,
    reviewCount: 92,
    provider: 'Give An Hour',
    isVerified: true,
    isVeteranLed: false,
    contactInfo: {
      email: 'info@giveanhour.org',
      website: 'https://giveanhour.org/'
    },
    eligibility: 'Veterans, service members, and their families',
    costInfo: 'Free',
    serviceTypes: ['Counseling', 'Therapy', 'Support Groups'],
    serviceBranches: ['All branches'],
    lastUpdated: '2025-04-10'
  },
  {
    id: '3',
    title: 'Wounded Warrior Project',
    description: 'Programs and services for veterans and service members who incurred a physical or mental injury or illness while serving in the military on or after September 11, 2001.',
    url: 'https://www.woundedwarriorproject.org/',
    imageUrl: '/images/wounded-warrior.jpg',
    categories: ['Physical Health', 'Mental Health', 'NGO'],
    tags: ['PTSD', 'TBI', 'Rehabilitation', 'Support'],
    rating: 4.3,
    reviewCount: 215,
    provider: 'Wounded Warrior Project',
    isVerified: true,
    isVeteranLed: true,
    contactInfo: {
      phone: '1-888-997-2586',
      email: 'resourcecenter@woundedwarriorproject.org',
      website: 'https://www.woundedwarriorproject.org/'
    },
    eligibility: 'Post-9/11 veterans with service-connected injuries or illnesses',
    costInfo: 'Free for eligible veterans',
    serviceTypes: ['Rehabilitation', 'Mental Health Support', 'Physical Health Programs', 'Career Counseling'],
    serviceBranches: ['All branches'],
    veteranEras: ['Post-9/11'],
    lastUpdated: '2025-04-12',
    isFeatured: true
  },
  {
    id: '4',
    title: 'VA Whole Health',
    description: 'A personalized health approach that considers the full range of physical, emotional, mental, social, spiritual, and environmental factors that influence your health and well-being.',
    url: 'https://www.va.gov/wholehealth/',
    imageUrl: '/images/va-whole-health.jpg',
    categories: ['Physical Health', 'Wellness Programs', 'VA'],
    tags: ['Whole Health', 'Wellness', 'Preventive Care'],
    rating: 4.2,
    reviewCount: 78,
    provider: 'Department of Veterans Affairs',
    isVerified: true,
    isVeteranLed: false,
    contactInfo: {
      website: 'https://www.va.gov/wholehealth/'
    },
    eligibility: 'Veterans enrolled in VA healthcare',
    costInfo: 'Free for eligible veterans',
    serviceTypes: ['Wellness Programs', 'Preventive Care', 'Complementary Therapies'],
    serviceBranches: ['All branches'],
    lastUpdated: '2025-04-08'
  },
  {
    id: '5',
    title: 'Cohen Veterans Network',
    description: 'High-quality, accessible mental health care for veterans and their families through a nationwide network of clinics.',
    url: 'https://www.cohenveteransnetwork.org/',
    imageUrl: '/images/cohen-veterans.jpg',
    categories: ['Mental Health', 'NGO', 'Family Support'],
    tags: ['Counseling', 'PTSD', 'Depression', 'Family'],
    rating: 4.7,
    reviewCount: 103,
    provider: 'Cohen Veterans Network',
    isVerified: true,
    isVeteranLed: false,
    contactInfo: {
      phone: '1-888-523-6936',
      website: 'https://www.cohenveteransnetwork.org/'
    },
    eligibility: 'Post-9/11 veterans and their families',
    costInfo: 'Low or no cost',
    serviceTypes: ['Counseling', 'Therapy', 'Case Management'],
    serviceBranches: ['All branches'],
    veteranEras: ['Post-9/11'],
    lastUpdated: '2025-04-05',
    isFeatured: true
  },
  {
    id: '6',
    title: 'Headstrong Project',
    description: 'Confidential, cost-free, and frictionless mental health treatment for post-9/11 veterans and their families.',
    url: 'https://getheadstrong.org/',
    imageUrl: '/images/headstrong.jpg',
    categories: ['Mental Health', 'NGO', 'Crisis Services'],
    tags: ['PTSD', 'Trauma', 'Therapy'],
    rating: 4.6,
    reviewCount: 87,
    provider: 'Headstrong Project',
    isVerified: true,
    isVeteranLed: true,
    contactInfo: {
      email: 'info@getheadstrong.org',
      website: 'https://getheadstrong.org/'
    },
    eligibility: 'Post-9/11 veterans and their families',
    costInfo: 'Free',
    serviceTypes: ['Therapy', 'Trauma Treatment'],
    serviceBranches: ['All branches'],
    veteranEras: ['Post-9/11'],
    lastUpdated: '2025-04-03'
  },
  {
    id: '7',
    title: 'VA Caregiver Support Program',
    description: 'Support and resources for family caregivers of veterans, including education, training, and respite care.',
    url: 'https://www.caregiver.va.gov/',
    imageUrl: '/images/va-caregiver.jpg',
    categories: ['Family Support', 'VA', 'Wellness Programs'],
    tags: ['Caregivers', 'Support', 'Training'],
    rating: 4.0,
    reviewCount: 65,
    provider: 'Department of Veterans Affairs',
    isVerified: true,
    isVeteranLed: false,
    contactInfo: {
      phone: '1-855-260-3274',
      website: 'https://www.caregiver.va.gov/'
    },
    eligibility: 'Caregivers of veterans enrolled in VA healthcare',
    costInfo: 'Free for eligible caregivers',
    serviceTypes: ['Support Groups', 'Education', 'Respite Care'],
    lastUpdated: '2025-04-01'
  },
  {
    id: '8',
    title: 'Team Red, White & Blue',
    description: 'Enriching veterans\'s lives by connecting them to their community through physical and social activity.',
    url: 'https://www.teamrwb.org/',
    imageUrl: '/images/team-rwb.jpg',
    categories: ['Physical Health', 'Wellness Programs', 'NGO'],
    tags: ['Fitness', 'Social', 'Community'],
    rating: 4.9,
    reviewCount: 156,
    provider: 'Team RWB',
    isVerified: true,
    isVeteranLed: true,
    contactInfo: {
      email: 'info@teamrwb.org',
      website: 'https://www.teamrwb.org/'
    },
    eligibility: 'Veterans, service members, and civilians',
    costInfo: 'Free',
    serviceTypes: ['Physical Activity', 'Social Events', 'Community Building'],
    serviceBranches: ['All branches'],
    lastUpdated: '2025-03-28'
  }
];

export default function HealthPage() {
  // State for active tab in resource finder
  const [activeResourceTab, setActiveResourceTab] = useState('all');
  
  // State for health resources
  const [healthResources, setHealthResources] = useState<HealthResource[]>([]);
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch health resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // For now, we'll simulate a delay and use mock data
        const response = await fetch('/api/health-resources');
        
        if (response.ok) {
          const data = await response.json();
          setHealthResources(data.resources || []);
        } else {
          // If API fails, use sample data
          setHealthResources(sampleHealthResources);
        }
      } catch (error) {
        console.error('Error fetching health resources:', error);
        // Fallback to sample data
        setHealthResources(sampleHealthResources);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResources();
    
    // Load saved resources from localStorage
    const loadSavedResources = () => {
      try {
        const saved = localStorage.getItem('savedHealthResources');
        if (saved) {
          setSavedResourceIds(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading saved resources:', error);
      }
    };
    
    loadSavedResources();
  }, []);
  
  // Handle saving/unsaving resources
  const handleSaveResource = (resourceId: string) => {
    setSavedResourceIds(prev => {
      let newSaved;
      if (prev.includes(resourceId)) {
        // Remove if already saved
        newSaved = prev.filter(id => id !== resourceId);
      } else {
        // Add if not saved
        newSaved = [...prev, resourceId];
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('savedHealthResources', JSON.stringify(newSaved));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      return newSaved;
    });
  };
  
  // Handle viewing resource details
  const handleViewResourceDetails = (resource: HealthResource) => {
    // In a real implementation, this would navigate to a details page or open a modal
    console.log('View details for resource:', resource);
    // For now, we'll just open the resource URL in a new tab
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-[#1A2C5B] text-white py-16 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Health Resources for Veterans</h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Comprehensive healthcare information and resources to support your well-being.
              </p>
              <div className="mt-8">
                <a 
                  href="#symptom-finder" 
                  className="bg-[#B22234] hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition-colors inline-flex items-center"
                >
                  Find Resources Based on Your Needs
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Crisis Banner - Always visible for immediate help */}
        <CrisisBanner />

        {/* Symptom-Based Resource Finder - Main Feature */}
        <section id="symptom-finder" className="py-12 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h2 className="text-3xl font-bold text-[#1A2C5B] mb-4">Find Health Resources Tailored to Your Needs</h2>
              <p className="text-gray-600 text-lg">
                Answer a few questions about your health needs to discover personalized resources designed for veterans like you.
              </p>
            </div>
            
            <Suspense fallback={
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2C5B]"></div>
              </div>
            }>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2C5B]"></div>
                </div>
              ) : (
                <LocationAwareSymptomFinder 
                  resources={healthResources}
                  onSaveResource={handleSaveResource}
                  savedResourceIds={savedResourceIds}
                  onViewDetails={handleViewResourceDetails}
                />
              )}
            </Suspense>
          </div>
        </section>

        {/* Resource Finder Tabs */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-8">
              <h2 className="text-2xl font-bold text-[#1A2C5B] mb-2">Health Resources</h2>
              <p className="text-gray-600">
                Browse our comprehensive collection of health resources for veterans.
              </p>
            </div>

            {/* Resource Tabs Navigation */}
            <div className="flex flex-wrap justify-center mb-8 border-b border-gray-200">
              <button
                onClick={() => setActiveResourceTab('all')}
                className={`px-4 py-3 font-medium text-sm ${
                  activeResourceTab === 'all'
                    ? 'text-[#1A2C5B] border-b-2 border-[#1A2C5B]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Resources
              </button>
              <button
                onClick={() => setActiveResourceTab('va')}
                className={`px-4 py-3 font-medium text-sm ${
                  activeResourceTab === 'va'
                    ? 'text-[#1A2C5B] border-b-2 border-[#1A2C5B]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                VA Resources
              </button>
              <button
                onClick={() => setActiveResourceTab('state')}
                className={`px-4 py-3 font-medium text-sm ${
                  activeResourceTab === 'state'
                    ? 'text-[#1A2C5B] border-b-2 border-[#1A2C5B]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                State Resources
              </button>
              <button
                onClick={() => setActiveResourceTab('ngo')}
                className={`px-4 py-3 font-medium text-sm ${
                  activeResourceTab === 'ngo'
                    ? 'text-[#1A2C5B] border-b-2 border-[#1A2C5B]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                NGO Resources
              </button>
            </div>

            {/* Resource Tab Content */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <Suspense fallback={
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2C5B]"></div>
                </div>
              }>
                {activeResourceTab === 'all' && (
                  <ResourceFinderSection />
                )}
                {activeResourceTab === 'va' && (
                  <VAHealthcareBenefitsSection />
                )}
                {activeResourceTab === 'state' && (
                  <StateResourcesSection />
                )}
                {activeResourceTab === 'ngo' && (
                  <NGOResourcesSection />
                )}
              </Suspense>
            </div>
          </div>
        </section>

        {/* Transition Pathways Section */}
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-8">
              <h2 className="text-2xl font-bold text-[#1A2C5B] mb-2">Healthcare Transition Pathways</h2>
              <p className="text-gray-600">
                Step-by-step guides to help you navigate your healthcare journey.
              </p>
            </div>
            
            <Suspense fallback={
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2C5B]"></div>
              </div>
            }>
              <ResourcePathwaysSection />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
      
      {/* Sample health resources for development/testing */}
      {/* This would be replaced with actual API data in production */}
      {/* @ts-ignore */}
      <script type="application/json" id="sample-health-resources" style={{display: 'none'}}>
        {JSON.stringify(sampleHealthResources)}
      </script>
    </div>
  );
}
