/**
 * AI Layout Wrapper Component
 * 
 * This component wraps the entire application and adds the AI features
 * (chatbot and voice commands) that should be available on every page.
 * It provides a consistent AI experience across the Vet1Stop platform.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ChatbotWidget from './ChatbotWidget';
import VoiceCommandButton from './VoiceCommandButton';
import { UserProfile } from '@/lib/ai/contextManager';

interface AILayoutWrapperProps {
  children?: React.ReactNode;
  initialUserProfile?: UserProfile;
}

const AILayoutWrapper: React.FC<AILayoutWrapperProps> = ({
  children,
  initialUserProfile,
}) => {
  // States
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(initialUserProfile);
  const [currentPage, setCurrentPage] = useState<string>('Home');
  
  // Get current pathname for context
  const pathname = usePathname();
  
  // Update current page when pathname changes
  useEffect(() => {
    if (pathname) {
      // Extract page name from pathname
      const pageName = pathname === '/' 
        ? 'Home' 
        : pathname.split('/')[1].charAt(0).toUpperCase() + pathname.split('/')[1].slice(1);
      
      setCurrentPage(pageName);
    }
  }, [pathname]);
  
  // Load user profile from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedProfile = localStorage.getItem('vet1stop_user_profile');
        if (storedProfile) {
          setUserProfile(JSON.parse(storedProfile));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
  }, []);
  
  // Update user profile
  const updateUserProfile = (newProfile: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...newProfile };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('vet1stop_user_profile', JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving user profile:', error);
        }
      }
      
      return updated;
    });
  };
  
  return (
    <>
      {children}
      
      {/* AI Components - Only visible overlay elements */}
      <ChatbotWidget 
        userProfile={userProfile} 
        currentPage={currentPage} 
      />
      
      <VoiceCommandButton 
        position="bottom-left" 
        userProfile={userProfile}
      />
    </>
  );
};

export default AILayoutWrapper;
