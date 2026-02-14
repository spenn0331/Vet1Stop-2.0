# Symptom-Based Resource Finder Documentation

## Overview
The symptom-based resource finder is a key feature of the Vet1Stop health page that helps veterans identify appropriate health resources based on their symptoms rather than medical terminology. This documentation provides a comprehensive guide to the implementation, architecture, and usage of this feature.

## Purpose and Goals
The primary purpose of the symptom-based resource finder is to:
1. Help veterans find relevant health resources based on how they're feeling
2. Reduce barriers to care by avoiding complex medical terminology
3. Provide equal visibility to VA, NGO, and community resources
4. Create an intuitive, step-by-step process for resource discovery
5. Collect feedback to continuously improve resource recommendations

## Component Architecture

### Main Components

#### 1. Main Container (`index.tsx`)
The main container component manages the overall state and flow of the symptom-based resource finder. It integrates all sub-components and handles navigation between steps.

```typescript
// Key responsibilities:
// - Manage wizard state using useWizardState hook
// - Render appropriate step based on current state
// - Handle transitions between steps
// - Manage user data throughout the process
// - Track analytics events
```

#### 2. Step Components

##### `WelcomeScreen.tsx`
Introduces the symptom-based resource finder and explains its purpose to users.

```typescript
// Key features:
// - Clear introduction to the purpose of the tool
// - Explanation of the step-by-step process
// - Start button to begin the process
// - Optional "Skip to Results" for returning users
```

##### `CategorySelector.tsx`
Allows users to select a symptom category (e.g., Mental Health, Physical Health).

```typescript
// Key features:
// - Grid layout of category cards
// - Visual icons for each category
// - Accessible keyboard navigation
// - Selection tracking and highlighting
```

##### `SymptomSelector.tsx`
Enables users to select specific symptoms within the chosen category.

```typescript
// Key features:
// - Checkbox list of symptoms
// - Search functionality for quick finding
// - "Select All" and "Clear" options
// - Dynamic loading based on selected category
```

##### `SeverityAssessor.tsx`
Allows users to rate the severity of their symptoms.

```typescript
// Key features:
// - Slider or button group for severity selection
// - Visual feedback on selection
// - Crisis warning for severe symptoms
// - Clear descriptions of each severity level
```

##### `ResourceResults.tsx`
Displays personalized resource recommendations based on user selections.

```typescript
// Key features:
// - Grid of resource cards
// - Sorting and filtering options
// - Save/bookmark functionality
// - Feedback collection
// - Print and share options
```

#### 3. Utility Components

##### `ProgressIndicator.tsx`
Shows users their progress through the wizard.

```typescript
// Key features:
// - Visual representation of steps
// - Current step highlighting
// - Optional step labels
// - Responsive design
```

##### `EnhancedProgressIndicator.tsx`
An improved version with animations and more visual feedback.

```typescript
// Key features:
// - Animated transitions between steps
// - More detailed step information
// - Progress percentage display
// - Estimated time remaining
```

##### `CrisisWarning.tsx`
Displays a warning for users reporting severe symptoms.

```typescript
// Key features:
// - High visibility alert design
// - Crisis line information
// - Immediate help options
// - Clear call-to-action
```

##### `ResourceCard.tsx`
Displays individual resource information.

```typescript
// Key features:
// - Resource title and description
// - Organization information
// - Contact details
// - Tags and categories
// - Save and share buttons
```

##### `FeedbackCollector.tsx`
Collects user feedback on resources and the overall experience.

```typescript
// Key features:
// - Star rating system
// - Comment field
// - Specific questions about usefulness
// - Thank you confirmation
```

##### `PerformanceMonitor.tsx`
Monitors and visualizes performance metrics (development tool).

```typescript
// Key features:
// - Real-time performance metrics
// - Visual graphs of performance data
// - Optimization suggestions
// - Toggle visibility with keyboard shortcut
```

### Custom Hooks

#### 1. State Management

##### `useWizardState.ts`
Manages the wizard flow and state transitions.

```typescript
// Key functionality:
// - Track current step
// - Store user selections
// - Handle navigation between steps
// - Validate inputs before proceeding
```

##### `useUserPreferences.ts`
Manages user preferences and personalization.

```typescript
// Key functionality:
// - Store and retrieve user preferences
// - Sync with Firebase for authenticated users
// - Fall back to localStorage for anonymous users
// - Track preference changes
```

##### `useResourceMatcher.ts`
Matches resources to symptoms based on user selections.

```typescript
// Key functionality:
// - Algorithm for matching symptoms to resources
// - Scoring system for resource relevance
// - Filtering based on severity and preferences
// - Sorting by relevance score
```

#### 2. Analytics & Performance

##### `useAnalytics.ts`
Tracks user interactions and analytics events.

```typescript
// Key functionality:
// - Track step completions
// - Track resource interactions
// - Track search and filter usage
// - Send events to Firebase Analytics
```

##### `usePerformanceOptimizer.ts`
Optimizes performance through caching and measurement.

```typescript
// Key functionality:
// - Measure component render times
// - Cache resource matching results
// - Implement debouncing for expensive operations
// - Provide performance metrics
```

##### `useABTesting.ts`
Implements A/B testing for optimization.

```typescript
// Key functionality:
// - Assign users to test variants
// - Track variant performance
// - Calculate conversion rates
// - Determine winning variants
```

#### 3. Data & Storage

##### `useLocalStorage.ts`
Persists data locally for anonymous users.

```typescript
// Key functionality:
// - Store and retrieve data from localStorage
// - Handle serialization and deserialization
// - Implement expiration for cached data
// - Fallback mechanisms for errors
```

##### `useFirestore.ts`
Interacts with Firestore database for authenticated users.

```typescript
// Key functionality:
// - CRUD operations for user data
// - Real-time synchronization
// - Offline support
// - Error handling and retry logic
```

## Data Structure

### Symptom Categories
```typescript
interface SymptomCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  symptoms: Symptom[];
}

interface Symptom {
  id: string;
  name: string;
  description: string;
  severityLevels: SeverityLevel[];
  relatedResources: string[]; // Resource IDs
}

interface SeverityLevel {
  id: string;
  name: string;
  description: string;
  isCrisis: boolean;
  recommendedActionText: string;
}
```

### Resources
```typescript
interface Resource {
  id: string;
  title: string;
  description: string;
  organization: {
    id: string;
    name: string;
    logo: string;
    isVA: boolean;
    isNGO: boolean;
    isVeteranFounded: boolean;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  categories: string[];
  tags: string[];
  relatedSymptoms: string[]; // Symptom IDs
  severityLevels: string[]; // Severity level IDs
  rating: number;
  reviewCount: number;
}
```

### User Preferences
```typescript
interface UserPreferences {
  preferredResourceTypes: string[];
  savedResources: string[];
  recentSearches: {
    categoryId: string;
    symptoms: string[];
    severityLevel: string;
    timestamp: Date;
  }[];
  feedbackProvided: Record<string, {
    resourceId: string;
    rating: number;
    comment?: string;
    timestamp: Date;
  }>;
  location?: {
    state: string;
    city: string;
    zipCode: string;
  };
  veteranStatus: {
    isVeteran: boolean;
    branch?: string;
    serviceYears?: number;
    verified: boolean;
  };
}
```

## Integration Points

### Firebase Integration
The symptom-based resource finder integrates with Firebase for:
1. **Authentication** - User accounts and session management
2. **Firestore** - User preferences, saved resources, and feedback
3. **Analytics** - Tracking user interactions and feature usage

### API Integration
The feature integrates with several APIs:
1. **Health Resources API** - For resource data and metadata
2. **VA API** - For veteran verification and VA-specific resources
3. **Location Services** - For location-based resource recommendations

## Performance Optimization

### Caching Strategy
1. **Resource Matching Results** - Cache results based on selections
2. **User Preferences** - Cache preferences for quick access
3. **Recent Searches** - Cache recent searches for quick retrieval

### Lazy Loading
1. **Component Lazy Loading** - Load components as needed
2. **Resource Images** - Lazy load resource images
3. **Additional Data** - Load detailed data only when requested

### Debouncing
1. **Search Operations** - Debounce search input
2. **Filter Operations** - Debounce filter changes
3. **Analytics Events** - Debounce non-critical analytics events

## Accessibility Considerations

### Keyboard Navigation
1. **Full Keyboard Support** - All interactive elements are keyboard accessible
2. **Focus Management** - Proper focus handling between steps
3. **Skip Links** - Allow skipping to main content

### Screen Reader Support
1. **ARIA Attributes** - Proper ARIA roles and attributes
2. **Semantic HTML** - Proper HTML structure for accessibility
3. **Descriptive Alt Text** - For all images and icons

### Visual Accessibility
1. **High Contrast Mode** - Support for high contrast viewing
2. **Text Sizing** - Support for browser text size adjustments
3. **Color Blind Friendly** - Designs tested for color blindness

## Analytics Implementation

### Event Tracking
```typescript
// Example analytics events
trackEvent({
  eventType: 'category_selected',
  categoryId: 'mental_health',
  metadata: {
    stepNumber: 2,
    totalSteps: 5
  }
});

trackEvent({
  eventType: 'resource_click',
  resourceId: 'resource_123',
  resourceTitle: 'VA Mental Health Services',
  resourceType: 'va',
  metadata: {
    position: 3,
    totalResults: 12
  }
});
```

### Performance Tracking
```typescript
// Example performance tracking
const {
  startResourceMatchMeasurement,
  endResourceMatchMeasurement
} = usePerformanceOptimizer();

// Before resource matching
startResourceMatchMeasurement();

// After resource matching
endResourceMatchMeasurement();
```

### A/B Testing
```typescript
// Example A/B test implementation
const { getVariant, trackConversion } = useABTesting(userId);

// Get variant for a test
const layoutVariant = getVariant('symptom-finder-layout');

// Track conversion for a test
trackConversion('symptom-finder-layout', {
  completion_time: 45,
  resources_viewed: 3
});
```

## Maintenance and Troubleshooting

### Common Issues and Solutions

#### 1. Resource Matching Not Working
- Check that the resource data is properly loaded
- Verify that the symptom IDs match the resource's relatedSymptoms
- Ensure the severity levels are properly configured

#### 2. Performance Issues
- Check for unnecessary re-renders using React DevTools
- Verify that caching is working properly
- Check for expensive operations in render functions

#### 3. Firebase Integration Issues
- Verify Firebase configuration in `firebase/config.ts`
- Check authentication state using Firebase console
- Verify Firestore rules allow proper access

### Updating Resource Data
1. Update the resource data in `data.ts` or the appropriate API
2. Ensure new resources have the correct structure
3. Update any related symptom mappings

### Adding New Features
1. Follow the existing component architecture
2. Implement new components in the appropriate directory
3. Update the main container to include the new feature
4. Add appropriate analytics tracking

## Conclusion
The symptom-based resource finder is a critical component of the Vet1Stop health page, designed to help veterans navigate the complex healthcare landscape. By focusing on symptoms rather than medical terminology, it provides a more accessible and user-friendly experience. This documentation provides a comprehensive guide to the implementation, architecture, and usage of this feature to facilitate maintenance and future enhancements.
