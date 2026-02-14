'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

// Define the shape of our context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
}

// Create the context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple loading component to display during authentication
// Use a consistent class name to avoid hydration errors
const LoadingFallback = () => (
  <div className="auth-loading-container flex flex-col items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2C5B] mb-4"></div>
    <p className="text-gray-600">Loading authentication...</p>
  </div>
);

// Provider component that wraps the app and makes auth object available
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Listen for auth state changes when the component mounts
  useEffect(() => {
    // Mark component as mounted to prevent hydration errors
    setMounted(true);
    
    // Check if Firebase Auth is initialized
    if (!auth) {
      setLoading(false);
      return () => {};
    }
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      // Clean up subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
      return () => {};
    }
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set the user's display name
    await updateProfile(user, { displayName });
    
    // Send email verification
    await sendEmailVerification(user);
    
    return user;
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    await firebaseSignOut(auth);
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<User> => {
    if (!auth || !googleProvider) throw new Error('Firebase Auth or Google Provider is not initialized');
    const { user } = await signInWithPopup(auth, googleProvider);
    return user;
  };

  // Update user profile
  const updateUserProfile = async (displayName: string, photoURL?: string): Promise<void> => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    if (!auth.currentUser) {
      throw new Error('No user is signed in');
    }
    
    await updateProfile(auth.currentUser, {
      displayName,
      photoURL: photoURL || auth.currentUser.photoURL
    });
    
    // Update the local user state to reflect changes
    setUser({ ...auth.currentUser });
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateUserProfile
  };

  // Render children only after hydration is complete
  if (!mounted) {
    return <LoadingFallback />;
  }

  if (loading) {
    return <LoadingFallback />;
  }

  // For client-side rendering, provide the auth context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Provide a safe fallback instead of throwing an error
    console.warn('useAuth was used outside of AuthProvider; using fallback values');
    return {
      user: null,
      loading: false,
      signIn: async () => { 
        console.warn('Auth not initialized: signIn unavailable'); 
        throw new Error('Authentication not initialized');
      },
      signUp: async () => { 
        console.warn('Auth not initialized: signUp unavailable'); 
        throw new Error('Authentication not initialized');
      },
      signOut: async () => { 
        console.warn('Auth not initialized: signOut unavailable'); 
      },
      signInWithGoogle: async () => {
        console.warn('Auth not initialized: signInWithGoogle unavailable');
        throw new Error('Authentication not initialized');
      },
      updateUserProfile: async () => {
        console.warn('Auth not initialized: updateUserProfile unavailable');
        throw new Error('Authentication not initialized');
      }
    } as AuthContextType;
  }
  return context;
}
