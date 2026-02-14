# State Management Blueprint

## Overview
This document outlines the state management approach for the Vet1Stop Next.js application, focusing on clean, scalable patterns that balance simplicity for the MVP phase with flexibility for future enhancements after funding.

## State Management Philosophy

For the Vet1Stop MVP, we adopt a pragmatic approach to state management:

1. **Use React's built-in state management where appropriate**
2. **Leverage Next.js data fetching capabilities**
3. **Implement React Context for global state**
4. **Use SWR for remote data fetching and caching**
5. **Minimize complexity while maintaining extensibility**

## State Categories

Our application state can be categorized as follows:

### 1. Server State (Data from APIs)
- Resource data (education, health, life & leisure, entrepreneur)
- User profile information
- Search results
- Filter configurations

### 2. UI State
- Active navigation items
- Modal open/closed states
- Form input values
- Loading indicators
- Error messages

### 3. Session State
- Authentication status
- Current user basic information
- Feature flags for premium indicators

## Implementation for MVP

### React Context for Global State

For the MVP, we'll use React Context to manage global application state that needs to be accessed across components:

```jsx
// contexts/AppContext.jsx
'use client';

import { createContext, useContext, useState } from 'react';

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  // Global UI states
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  
  // Simple feature flags for MVP (these would come from a real system post-funding)
  const [featureFlags] = useState({
    enablePremiumFeatures: process.env.NEXT_PUBLIC_ENABLE_PREMIUM_FEATURES === 'true',
    showLocalBusinesses: true,
    showShopFeature: true,
    showSocialFeature: true,
  });
  
  const value = {
    // UI state
    isFilterMenuOpen,
    setIsFilterMenuOpen,
    activeCategory,
    setActiveCategory,
    isPremiumModalOpen,
    setIsPremiumModalOpen,
    
    // Feature flags
    featureFlags,
  };
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
}
```

Implementation in the layout:

```jsx
// app/layout.jsx
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### SWR for Data Fetching (MVP Implementation)

For the MVP, we'll use SWR (stale-while-revalidate) to handle data fetching, caching, and revalidation:

```jsx
// hooks/useResources.js
'use client';

import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useResources(category, filters = {}) {
  // Convert filters object to URLSearchParams
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Handle array values (e.g., multiple selected filter options)
      if (value.length > 0) {
        params.set(key, value.join(','));
      }
    } else if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });
  
  const queryString = params.toString();
  const url = `/api/resources/${category}${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  
  return {
    resources: data?.resources || [],
    isLoading,
    isError: error,
    mutate, // For manual revalidation
  };
}

// Example usage in a page component:
// const { resources, isLoading } = useResources('education', { source: ['federal', 'ngo'] });
```

### Resource Filtering State (MVP Implementation)

For resource pages, we need to manage filter state:

```jsx
// components/organisms/FilterPanel/FilterPanel.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Button } from '@/components/atoms/Button';

export default function FilterPanel({ category }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get initial filters from URL query params
  const [filters, setFilters] = useState({
    sources: searchParams.get('sources')?.split(',') || [],
    tags: searchParams.get('tags')?.split(',') || [],
  });
  
  // Filter options based on category
  const filterOptions = {
    education: {
      sources: [
        { id: 'federal', label: 'Federal Programs' },
        { id: 'state', label: 'State Programs' },
        { id: 'ngo', label: 'Non-Profit Organizations' },
        { id: 'university', label: 'Universities' },
      ],
      tags: [
        { id: 'gibill', label: 'GI Bill' },
        { id: 'scholarship', label: 'Scholarships' },
        { id: 'vocational', label: 'Vocational Training' },
        { id: 'certification', label: 'Certifications' },
      ],
    },
    health: {
      sources: [
        { id: 'va', label: 'VA Healthcare' },
        { id: 'tricare', label: 'TRICARE' },
        { id: 'ngo', label: 'Non-Profit Organizations' },
        { id: 'mental', label: 'Mental Health' },
      ],
      tags: [
        { id: 'primary', label: 'Primary Care' },
        { id: 'specialty', label: 'Specialty Care' },
        { id: 'emergency', label: 'Emergency Services' },
        { id: 'telehealth', label: 'Telehealth' },
      ],
    },
    // Add other categories as needed
  }[category] || { sources: [], tags: [] };
  
  const handleToggleFilter = (type, id) => {
    setFilters(prev => {
      const current = [...prev[type]];
      const index = current.indexOf(id);
      
      if (index === -1) {
        current.push(id);
      } else {
        current.splice(index, 1);
      }
      
      return { ...prev, [type]: current };
    });
  };
  
  const handleApplyFilters = () => {
    // Create new search params
    const params = new URLSearchParams(searchParams);
    
    // Update or remove filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (value.length) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    });
    
    // Update URL with new params
    router.push(`/${category}?${params.toString()}`);
  };
  
  const handleResetFilters = () => {
    setFilters({
      sources: [],
      tags: [],
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">Filter Resources</h2>
      
      {/* Sources Filter */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-2">Source</h3>
        <div className="space-y-2">
          {filterOptions.sources.map(source => (
            <div key={source.id} className="flex items-center">
              <Checkbox
                id={`source-${source.id}`}
                checked={filters.sources.includes(source.id)}
                onCheckedChange={() => handleToggleFilter('sources', source.id)}
              />
              <label 
                htmlFor={`source-${source.id}`}
                className="ml-2 text-sm text-gray-700 cursor-pointer"
              >
                {source.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tags Filter */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
        <div className="space-y-2">
          {filterOptions.tags.map(tag => (
            <div key={tag.id} className="flex items-center">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={filters.tags.includes(tag.id)}
                onCheckedChange={() => handleToggleFilter('tags', tag.id)}
              />
              <label 
                htmlFor={`tag-${tag.id}`}
                className="ml-2 text-sm text-gray-700 cursor-pointer"
              >
                {tag.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col space-y-2">
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
        <Button 
          variant="outline" 
          onClick={handleResetFilters}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
```

### Form State Management (MVP Implementation)

For forms in the MVP, we'll use the `useForm` React hook from `react-hook-form` for a balance of simplicity and functionality:

```jsx
// components/molecules/ContactForm/ContactForm.jsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { Button } from '@/components/atoms/Button';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setFormError('');
    
    try {
      // For MVP, just console log the data
      // In the future, this would send to an API endpoint
      console.log('Form data:', data);
      
      // Simulate API call for MVP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormSuccess(true);
      reset();
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setFormSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError('Failed to submit the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {formSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          Your message has been sent successfully!
        </div>
      )}
      
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {formError}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <Input
          id="name"
          {...register('name')}
          className={errors.name ? 'border-red-300' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-red-300' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <Input
          id="subject"
          {...register('subject')}
          className={errors.subject ? 'border-red-300' : ''}
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <Textarea
          id="message"
          rows={5}
          {...register('message')}
          className={errors.message ? 'border-red-300' : ''}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
        )}
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
```

## Authentication State (MVP Implementation)

For the MVP, we'll use Firebase Authentication with a simple AuthContext:

```jsx
// contexts/AuthContext.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Set the user state with basic information (only what's needed for MVP)
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          // Simple mock of premium status for MVP
          // In the future, this would come from a subscription DB lookup
          isPremium: false,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
```

## Premium Feature Indicators (MVP Implementation)

For the MVP, we'll implement visual indicators for premium features without actual payment processing:

```jsx
// components/molecules/PremiumFeatureIndicator/PremiumFeatureIndicator.jsx
'use client';

import { useState } from 'react';
import { HiLockClosed, HiStar } from 'react-icons/hi';
import { Button } from '@/components/atoms/Button';
import PremiumModal from '@/components/molecules/PremiumModal';
import { useAuth } from '@/contexts/AuthContext';

export default function PremiumFeatureIndicator({ 
  feature = 'this feature',
  children,
  className = '',
}) {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  
  // For MVP, we'll simulate premium status
  // In reality, this would check a subscription database
  const isPremium = user?.isPremium || false;
  
  if (isPremium) {
    return children;
  }
  
  return (
    <>
      <div className={`relative ${className}`}>
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none opacity-70">
          {children}
        </div>
        
        {/* Premium overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-lg p-4 text-center">
          <div className="bg-white bg-opacity-90 rounded-lg p-6 max-w-xs">
            <HiLockClosed className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Premium Feature
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Upgrade to premium to unlock {feature} and more benefits for veterans.
            </p>
            <Button 
              onClick={() => setShowModal(true)}
              className="w-full"
            >
              <HiStar className="mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
      
      {/* Premium modal */}
      {showModal && (
        <PremiumModal 
          onClose={() => setShowModal(false)} 
          feature={feature}
        />
      )}
    </>
  );
}

// Example usage:
// <PremiumFeatureIndicator feature="advanced filters">
//   <AdvancedFilters />
// </PremiumFeatureIndicator>
```

## Future State Management Enhancements (Post-Funding)

The following state management enhancements will be implemented by the professional development team after funding:

### 1. Advanced Authentication & Authorization

```jsx
// Future enhancement - Not needed for MVP
// This would integrate with military verification systems
// and manage complex authorization rules

// contexts/AdvancedAuthContext.jsx
'use client';

/*
This would include:
- Military verification status tracking
- JWT token management with refresh logic
- Role-based access control
- SSO integration
- Session timeout management
*/
```

### 2. Redux Integration

For more complex state management requirements post-MVP:

```jsx
// Future enhancement - Not needed for MVP
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import resourcesReducer from './slices/resourcesSlice';
import filtersReducer from './slices/filtersSlice';
import premiumReducer from './slices/premiumSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    resources: resourcesReducer,
    filters: filtersReducer,
    premium: premiumReducer,
  },
});
```

### 3. Server State Management with React Query

For more advanced data fetching needs post-MVP:

```jsx
// Future enhancement - Not needed for MVP
// hooks/useResourceQuery.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useResourceQuery(category, filters) {
  return useQuery({
    queryKey: ['resources', category, filters],
    queryFn: () => fetchResources(category, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSaveResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: saveResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedResources'] });
    },
  });
}
```

## Implementation Strategy for MVP

### Phase 1: Core State Management

1. Implement the AuthContext for Firebase authentication
2. Create the AppContext for global UI state
3. Set up data fetching hooks with SWR
4. Implement form state management with react-hook-form

### Phase 2: Page-Specific State

1. Implement filter state for resource pages
2. Add search functionality with state management
3. Create premium feature indicators
4. Implement basic error and loading states

### Phase 3: Polish and Optimization

1. Ensure consistent UX with loading states
2. Implement error boundaries for fault tolerance
3. Add data prefetching for optimal performance
4. Create placeholder state for empty results

## Best Practices for MVP State Management

1. **Keep it Simple**: Avoid over-engineering state management for the MVP
2. **Use Built-in Solutions**: Leverage React and Next.js built-in capabilities
3. **Optimize Later**: Focus on functionality first, then optimize
4. **Document Intent**: Comment code with future enhancement notes
5. **Consider Scaling**: Design with future needs in mind, but implement only what's needed now

## Success Criteria for MVP State Management

The state management implementation for the MVP is successful when:

1. User authentication works reliably with Firebase
2. Resource data loads and displays correctly
3. Filters for resources function as expected
4. Basic forms validate and submit properly
5. Premium feature indicators work visually
6. The application state is preserved across page navigation
7. UI responds appropriately to loading and error states

## Notes for Developer

1. Implement only what's needed for the investor demo
2. Focus on visual polish and UX over complex state management
3. Use simple state management patterns now, with comments about future enhancements
4. Ensure the application works reliably with the basic state management in place
5. Document any technical debt for future resolution

This state management blueprint provides a clear, pragmatic approach for the MVP phase while laying the groundwork for more advanced implementations after funding is secured. The focus is on creating a polished, functional application for investor pitching rather than implementing complex state management patterns prematurely.
