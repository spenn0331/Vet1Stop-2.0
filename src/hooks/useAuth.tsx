'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Mock User interface for development
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
});

// Hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Simple mock implementation for development
function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate auth state loading
    const timer = setTimeout(() => {
      const mockUser: User = {
        uid: 'mock-user-id',
        email: 'veteran@example.com',
        displayName: 'Veteran User',
        photoURL: null,
        emailVerified: true,
        getIdToken: async () => 'mock-token-for-development',
      };
      
      setUser(mockUser);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log(`Mock sign in: ${email}`);
      
      const mockUser: User = {
        uid: 'mock-user-id',
        email,
        displayName: 'Veteran User',
        photoURL: null,
        emailVerified: true,
        getIdToken: async () => 'mock-token-for-development',
      };
      
      setUser(mockUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign in error'));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign out error'));
    } finally {
      setLoading(false);
    }
  };

  const getIdToken = async () => {
    if (!user) return null;
    return 'mock-token-for-development';
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    getIdToken,
  };
}

// Provider component to wrap the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const authValue = useAuthProvider();
  
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default useAuth;
