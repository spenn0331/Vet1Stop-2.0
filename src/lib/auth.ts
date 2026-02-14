// This file has been superseded by contexts/AuthContext.tsx
// This file now re-exports from contexts/AuthContext.tsx to maintain compatibility

import { useAuth, AuthProvider } from '@/contexts/AuthContext';

// Re-export the components and hooks from the main implementation
export { useAuth, AuthProvider };

// Type definition for code that might still expect these exports
export type UserProfile = {
  veteranType?: string;
  branch?: string;
  age?: number;
  priorMOS?: string;
} | null;

// This empty context is to prevent errors in any code that might still import AuthContext directly
// All components should use the useAuth hook instead
import { createContext } from 'react';
export const AuthContext = createContext({});
