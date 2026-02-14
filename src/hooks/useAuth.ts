"use client";

import { useState, useEffect, useCallback } from 'react';

// Define user type
interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isVerified?: boolean;
  role?: 'user' | 'admin';
  preferences?: Record<string, any>;
}

// Define auth hook return type
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * Custom hook for authentication
 * This is a simplified version for the prototype
 * In a real implementation, this would integrate with Firebase Auth
 */
const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    // Simulate auth check with localStorage
    const storedUser = localStorage.getItem('vet1stop_user');
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    }
    
    // Simulate auth loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For prototype, accept any credentials and create a mock user
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        displayName: email.split('@')[0],
        isVerified: true,
        role: 'user'
      };
      
      // Save to localStorage
      localStorage.setItem('vet1stop_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during sign in'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For prototype, create a mock user
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        displayName: displayName || email.split('@')[0],
        isVerified: false,
        role: 'user'
      };
      
      // Save to localStorage
      localStorage.setItem('vet1stop_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during sign up'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from localStorage
      localStorage.removeItem('vet1stop_user');
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during sign out'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would trigger a password reset email
      console.log(`Password reset email sent to ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error during password reset'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword
  };
};

export default useAuth;
