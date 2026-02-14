"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Define user profile type
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  veteranStatus?: 'active' | 'veteran' | 'family' | 'supporter' | 'unknown';
  branch?: string;
  serviceYears?: number;
  state?: string;
  createdAt?: any;
  lastLoginAt?: any;
  preferences?: {
    savedResources?: string[];
    preferredCategories?: string[];
    notificationSettings?: {
      email: boolean;
      push: boolean;
    };
  };
}

// Define auth state type
interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Define auth methods return type
interface UseAuth extends AuthState {
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  saveResource: (resourceId: string) => Promise<void>;
  unsaveResource: (resourceId: string) => Promise<void>;
  updatePreferredCategories: (categories: string[]) => Promise<void>;
}

/**
 * Custom hook for Firebase authentication and user management
 * Handles sign-up, sign-in, sign-out, profile management, and user preferences
 */
export function useAuth(): UseAuth {
  // Initialize state
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user profile from Firestore
          const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          
          if (profileDoc.exists()) {
            // User profile exists, update state
            setState({
              user,
              profile: profileDoc.data() as UserProfile,
              loading: false,
              error: null
            });
            
            // Update last login timestamp
            await updateDoc(doc(db, 'userProfiles', user.uid), {
              lastLoginAt: serverTimestamp()
            });
          } else {
            // User profile doesn't exist, create it
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              veteranStatus: 'unknown',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              preferences: {
                savedResources: [],
                preferredCategories: [],
                notificationSettings: {
                  email: true,
                  push: false
                }
              }
            };
            
            await setDoc(doc(db, 'userProfiles', user.uid), newProfile);
            
            setState({
              user,
              profile: newProfile,
              loading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setState({
            user,
            profile: null,
            loading: false,
            error: 'Failed to load user profile'
          });
        }
      } else {
        // User is signed out
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null
        });
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName });
      
      // Create user profile in Firestore
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName,
        photoURL: null,
        veteranStatus: 'unknown',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        preferences: {
          savedResources: [],
          preferredCategories: [],
          notificationSettings: {
            email: true,
            push: false
          }
        }
      };
      
      await setDoc(doc(db, 'userProfiles', user.uid), newProfile);
      
      setState(prev => ({
        ...prev,
        user,
        profile: newProfile,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error signing up:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign up'
      }));
      throw error;
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state listener will update the state
    } catch (error: any) {
      console.error('Error signing in:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign in'
      }));
      throw error;
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Auth state listener will update the state
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign in with Google'
      }));
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await firebaseSignOut(auth);
      // Auth state listener will update the state
    } catch (error: any) {
      console.error('Error signing out:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to sign out'
      }));
      throw error;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await sendPasswordResetEmail(auth, email);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to reset password'
      }));
      throw error;
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!state.user) {
      throw new Error('User not authenticated');
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Update profile in Firestore
      await updateDoc(doc(db, 'userProfiles', state.user.uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      // Get updated profile
      const profileDoc = await getDoc(doc(db, 'userProfiles', state.user.uid));
      
      if (profileDoc.exists()) {
        setState(prev => ({
          ...prev,
          profile: profileDoc.data() as UserProfile,
          loading: false
        }));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to update profile'
      }));
      throw error;
    }
  }, [state.user]);

  // Save a resource
  const saveResource = useCallback(async (resourceId: string) => {
    if (!state.user || !state.profile) {
      throw new Error('User not authenticated');
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get current saved resources
      const savedResources = state.profile.preferences?.savedResources || [];
      
      // Add resource if not already saved
      if (!savedResources.includes(resourceId)) {
        const updatedResources = [...savedResources, resourceId];
        
        // Update in Firestore
        await updateDoc(doc(db, 'userProfiles', state.user.uid), {
          'preferences.savedResources': updatedResources,
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        setState(prev => ({
          ...prev,
          profile: prev.profile ? {
            ...prev.profile,
            preferences: {
              ...prev.profile.preferences,
              savedResources: updatedResources
            }
          } : null,
          loading: false
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error: any) {
      console.error('Error saving resource:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to save resource'
      }));
      throw error;
    }
  }, [state.user, state.profile]);

  // Unsave a resource
  const unsaveResource = useCallback(async (resourceId: string) => {
    if (!state.user || !state.profile) {
      throw new Error('User not authenticated');
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get current saved resources
      const savedResources = state.profile.preferences?.savedResources || [];
      
      // Remove resource if saved
      if (savedResources.includes(resourceId)) {
        const updatedResources = savedResources.filter(id => id !== resourceId);
        
        // Update in Firestore
        await updateDoc(doc(db, 'userProfiles', state.user.uid), {
          'preferences.savedResources': updatedResources,
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        setState(prev => ({
          ...prev,
          profile: prev.profile ? {
            ...prev.profile,
            preferences: {
              ...prev.profile.preferences,
              savedResources: updatedResources
            }
          } : null,
          loading: false
        }));
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error: any) {
      console.error('Error unsaving resource:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to unsave resource'
      }));
      throw error;
    }
  }, [state.user, state.profile]);

  // Update preferred categories
  const updatePreferredCategories = useCallback(async (categories: string[]) => {
    if (!state.user || !state.profile) {
      throw new Error('User not authenticated');
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Update in Firestore
      await updateDoc(doc(db, 'userProfiles', state.user.uid), {
        'preferences.preferredCategories': categories,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? {
          ...prev.profile,
          preferences: {
            ...prev.profile.preferences,
            preferredCategories: categories
          }
        } : null,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error updating preferred categories:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to update preferred categories'
      }));
      throw error;
    }
  }, [state.user, state.profile]);

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateUserProfile,
    saveResource,
    unsaveResource,
    updatePreferredCategories
  };
}
