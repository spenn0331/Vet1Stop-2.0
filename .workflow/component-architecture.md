# Component Architecture Blueprint

## Overview
This document outlines the modular component architecture for the Vet1Stop Next.js application, designed to ensure consistency, reusability, and maintainability across the platform.

## Component Hierarchy

### Atomic Design Structure
The component architecture follows the Atomic Design methodology:

1. **Atoms**: Basic building blocks (buttons, inputs, icons, typography)
2. **Molecules**: Simple combinations of atoms (form fields, cards, alerts)
3. **Organisms**: Complex components (navigation, resource grids, filters)
4. **Templates**: Page layouts without specific content
5. **Pages**: Complete page implementations with actual content

### Directory Structure
```
src/
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   ├── Button.test.jsx
│   │   │   └── index.js
│   │   ├── Input/
│   │   ├── Typography/
│   │   └── ...
│   ├── molecules/
│   │   ├── FormField/
│   │   ├── ResourceCard/
│   │   ├── SearchBar/
│   │   └── ...
│   ├── organisms/
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── ResourceGrid/
│   │   ├── FilterPanel/
│   │   └── ...
│   ├── templates/
│   │   ├── MainLayout/
│   │   ├── ResourceLayout/
│   │   ├── ProfileLayout/
│   │   └── ...
│   └── pages/
│       ├── Home/
│       ├── Education/
│       ├── Health/
│       └── ...
```

## Core Components

### Design System Atoms

#### Button Component
```jsx
// components/atoms/Button/Button.jsx
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        secondary: "bg-secondary-600 text-white hover:bg-secondary-700",
        outline: "border border-primary-600 text-primary-600 hover:bg-primary-50",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-primary-600 hover:underline underline-offset-4",
      },
      size: {
        sm: "h-9 px-3 rounded-md",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const Button = forwardRef(({ 
  className, 
  variant, 
  size, 
  children,
  ...props 
}, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
```

#### Input Component
```jsx
// components/atoms/Input/Input.jsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(({ 
  className, 
  type = "text", 
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
        "placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
```

### Molecules

#### ResourceCard Component
```jsx
// components/molecules/ResourceCard/ResourceCard.jsx
import { useState } from 'react';
import Link from 'next/link';
import { HiExternalLink, HiBookmark } from 'react-icons/hi';
import { Button } from '@/components/atoms/Button';

export default function ResourceCard({ 
  resource, 
  isPremium = false,
  onSave 
}) {
  const [saved, setSaved] = useState(resource.saved || false);
  
  const handleSave = () => {
    if (!isPremium) {
      // Show premium upgrade modal
      return;
    }
    
    const newSaveState = !saved;
    setSaved(newSaveState);
    onSave?.(resource.id, newSaveState);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
      {/* Category Badge */}
      <div className="px-4 py-2 bg-gray-50">
        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
          {resource.subcategory}
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {resource.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {resource.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {resource.tags?.slice(0, 3).map((tag) => (
            <span 
              key={tag} 
              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleSave}
          className={`${!isPremium ? 'cursor-not-allowed opacity-70' : ''}`}
          disabled={!isPremium}
        >
          <HiBookmark className={`mr-1 ${saved ? 'fill-current' : ''}`} />
          {saved ? 'Saved' : 'Save'}
        </Button>
        
        <Button 
          variant="link" 
          size="sm" 
          asChild
        >
          <Link 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View
            <HiExternalLink className="ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

#### SearchBar Component
```jsx
// components/molecules/SearchBar/SearchBar.jsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiSearch, HiX } from 'react-icons/hi';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';

export default function SearchBar({ placeholder = "Search resources..." }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Create new search params
    const params = new URLSearchParams(searchParams);
    params.set('q', query);
    
    router.push(`/search?${params.toString()}`);
  };
  
  const clearSearch = () => {
    setQuery('');
  };
  
  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-12"
        />
        
        <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <HiX />
          </button>
        )}
        
        <Button
          type="submit"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
          disabled={!query.trim()}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
```

### Organisms

#### Header Component 
```jsx
// components/organisms/Header/Header.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HiMenu, 
  HiX, 
  HiChevronDown, 
  HiUser, 
  HiOutlineLogout 
} from 'react-icons/hi';
import { Button } from '@/components/atoms/Button';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleResources = () => setIsResourcesOpen(!isResourcesOpen);
  
  const isActive = (path) => pathname === path;
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary-600">Vet1Stop</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`text-sm font-medium ${
                isActive('/') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Home
            </Link>
            
            {/* Resources Dropdown */}
            <div className="relative">
              <button
                className={`text-sm font-medium flex items-center ${
                  ['/education', '/health', '/life-leisure', '/entrepreneur'].some(path => 
                    pathname.startsWith(path)
                  ) ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
                }`}
                onClick={toggleResources}
              >
                Resources
                <HiChevronDown className={`ml-1 transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Resources Dropdown Menu */}
              {isResourcesOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-20">
                  <Link 
                    href="/education" 
                    className={`block px-4 py-2 text-sm ${
                      isActive('/education') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Education
                  </Link>
                  <Link 
                    href="/health" 
                    className={`block px-4 py-2 text-sm ${
                      isActive('/health') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Health
                  </Link>
                  <Link 
                    href="/life-leisure" 
                    className={`block px-4 py-2 text-sm ${
                      isActive('/life-leisure') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Life & Leisure
                  </Link>
                  <Link 
                    href="/entrepreneur" 
                    className={`block px-4 py-2 text-sm ${
                      isActive('/entrepreneur') ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Entrepreneur
                  </Link>
                </div>
              )}
            </div>
            
            <Link 
              href="/local" 
              className={`text-sm font-medium ${
                isActive('/local') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Local
            </Link>
            
            <Link 
              href="/shop" 
              className={`text-sm font-medium ${
                isActive('/shop') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Shop
            </Link>
            
            <Link 
              href="/social" 
              className={`text-sm font-medium ${
                isActive('/social') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Social
            </Link>
          </nav>
          
          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <HiUser className="mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => signOut()}
                >
                  <HiOutlineLogout className="mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-700 hover:text-primary-600"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className={`px-2 py-1 ${
                  isActive('/') ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                Home
              </Link>
              
              <button
                className={`px-2 py-1 text-left flex items-center justify-between ${
                  ['/education', '/health', '/life-leisure', '/entrepreneur'].some(path => 
                    pathname.startsWith(path)
                  ) ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
                onClick={toggleResources}
              >
                Resources
                <HiChevronDown className={`transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isResourcesOpen && (
                <div className="pl-4 space-y-2">
                  <Link 
                    href="/education" 
                    className={`block py-1 ${
                      isActive('/education') ? 'text-primary-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Education
                  </Link>
                  <Link 
                    href="/health" 
                    className={`block py-1 ${
                      isActive('/health') ? 'text-primary-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Health
                  </Link>
                  <Link 
                    href="/life-leisure" 
                    className={`block py-1 ${
                      isActive('/life-leisure') ? 'text-primary-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Life & Leisure
                  </Link>
                  <Link 
                    href="/entrepreneur" 
                    className={`block py-1 ${
                      isActive('/entrepreneur') ? 'text-primary-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Entrepreneur
                  </Link>
                </div>
              )}
              
              <Link 
                href="/local" 
                className={`px-2 py-1 ${
                  isActive('/local') ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                Local
              </Link>
              
              <Link 
                href="/shop" 
                className={`px-2 py-1 ${
                  isActive('/shop') ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                Shop
              </Link>
              
              <Link 
                href="/social" 
                className={`px-2 py-1 ${
                  isActive('/social') ? 'text-primary-600 font-medium' : 'text-gray-700'
                }`}
              >
                Social
              </Link>
              
              {/* Mobile Auth Links */}
              <div className="pt-4 border-t border-gray-100">
                {session ? (
                  <>
                    <Link 
                      href="/profile" 
                      className="flex items-center px-2 py-1 text-gray-700"
                    >
                      <HiUser className="mr-2" />
                      Profile
                    </Link>
                    <button 
                      onClick={() => signOut()}
                      className="flex items-center px-2 py-1 text-gray-700 w-full text-left"
                    >
                      <HiOutlineLogout className="mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="block px-2 py-1 text-gray-700"
                    >
                      Login
                    </Link>
                    <Link 
                      href="/signup" 
                      className="block px-2 py-1 text-gray-700"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
```

#### ResourceGrid Component
```jsx
// components/organisms/ResourceGrid/ResourceGrid.jsx
'use client';

import { useState } from 'react';
import ResourceCard from '@/components/molecules/ResourceCard';
import { Button } from '@/components/atoms/Button';
import PremiumUpgradeModal from '@/components/molecules/PremiumUpgradeModal';

export default function ResourceGrid({ 
  resources, 
  isPremium = false,
  onSaveResource,
  initialPageSize = 9,
  loadMoreIncrement = 9
}) {
  const [visibleCount, setVisibleCount] = useState(initialPageSize);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const hasMoreToLoad = visibleCount < resources.length;
  
  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + loadMoreIncrement, resources.length));
  };
  
  const handleSave = (resourceId, isSaved) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    onSaveResource?.(resourceId, isSaved);
  };
  
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.slice(0, visibleCount).map((resource) => (
          <ResourceCard 
            key={resource._id} 
            resource={resource} 
            isPremium={isPremium} 
            onSave={handleSave}
          />
        ))}
      </div>
      
      {hasMoreToLoad && (
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
          >
            Load More Resources
          </Button>
        </div>
      )}
      
      {showPremiumModal && (
        <PremiumUpgradeModal
          feature="save resources"
          onClose={() => setShowPremiumModal(false)}
        />
      )}
    </div>
  );
}
```

### Templates

#### MainLayout Template
```jsx
// components/templates/MainLayout/MainLayout.jsx
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
```

#### ResourceLayout Template
```jsx
// components/templates/ResourceLayout/ResourceLayout.jsx
import { Suspense } from 'react';
import MainLayout from '@/components/templates/MainLayout';
import SearchBar from '@/components/molecules/SearchBar';
import FilterPanel from '@/components/organisms/FilterPanel';
import LoadingSkeleton from '@/components/molecules/LoadingSkeleton';

export default function ResourceLayout({ 
  children, 
  title,
  description,
  filters,
  setFilters
}) {
  return (
    <MainLayout>
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          {description && (
            <p className="text-primary-100 max-w-2xl mb-6">{description}</p>
          )}
          <div className="max-w-2xl">
            <SearchBar placeholder={`Search ${title.toLowerCase()}...`} />
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <FilterPanel 
              filters={filters}
              setFilters={setFilters}
            />
          </div>
          
          <div className="lg:col-span-3">
            <Suspense fallback={<LoadingSkeleton />}>
              {children}
            </Suspense>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
```

## Page Components

### Resource Page Implementation
```jsx
// app/(resources)/education/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ResourceLayout from '@/components/templates/ResourceLayout';
import ResourceGrid from '@/components/organisms/ResourceGrid';
import PremiumBanner from '@/components/molecules/PremiumBanner';
import { useSession } from 'next-auth/react';
import { getEducationResources } from '@/services/resources';

export default function EducationPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isPremium = session?.user?.subscription?.isPremium || false;
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    primary: searchParams.get('primary')?.split(',') || [],
    ngoType: searchParams.get('ngoType')?.split(',') || [],
    // Other filters
  });
  
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const data = await getEducationResources(filters);
        setResources(data);
      } catch (error) {
        console.error('Failed to fetch education resources:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [filters]);
  
  const handleSaveResource = async (resourceId, isSaved) => {
    // Implementation for saving resources
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    // Update URL params for shareable filtered views
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value.length) {
        params.set(key, value.join(','));
      }
    });
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  };
  
  return (
    <ResourceLayout
      title="Education Resources"
      description="Find comprehensive education resources for veterans, including GI Bill benefits, scholarships, tuition assistance, and more."
      filters={filters}
      setFilters={handleFilterChange}
    >
      {!isPremium && <PremiumBanner category="education" />}
      
      {loading ? (
        <p>Loading resources...</p>
      ) : (
        <ResourceGrid 
          resources={resources} 
          isPremium={isPremium}
          onSaveResource={handleSaveResource}
        />
      )}
    </ResourceLayout>
  );
}
```

## Component Documentation

### Component Usage Guidelines

1. **Consistency**: Use the same component for the same purpose across the application
2. **Composition over modification**: Extend components through composition rather than modifying existing ones
3. **Props**: Document all props with types and descriptions
4. **Accessibility**: Ensure all components meet accessibility standards

### Component Testing Strategy

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **Visual Regression Tests**: Ensure UI consistency across changes
4. **Accessibility Tests**: Validate WCAG compliance

## Implementation Best Practices

1. **Server Components vs. Client Components**:
   - Use Server Components for static content and data fetching
   - Use Client Components for interactive elements
   - Mark Client Components with 'use client' directive

2. **Performance Optimization**:
   - Lazy load components below the fold
   - Use React.memo for expensive renders
   - Implement virtualization for long lists

3. **State Management**:
   - Use React Context for global state
   - Leverage React Query for server state
   - Keep component state local when possible

4. **Styling Guidelines**:
   - Use Tailwind utility classes primarily
   - Extract common patterns to component classes with @apply
   - Maintain consistent naming conventions

This component architecture blueprint provides a solid foundation for building a modular, maintainable, and performant Next.js application for Vet1Stop, ensuring consistency across the platform while enabling rapid development.
