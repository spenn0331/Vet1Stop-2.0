# Resource Pathways Feature Documentation

*Last Updated: April 17, 2025*

## Overview
The Resource Pathways feature transforms the Vet1Stop Health page from a static resource directory into an interactive, guided journey experience for veterans navigating complex healthcare scenarios. This document provides comprehensive documentation of the implementation, architecture, and usage guidelines.

## Business Value
- **Improved User Experience**: Guides veterans step-by-step through common healthcare journeys
- **Increased Engagement**: Higher retention through multi-step processes compared to basic resource lists
- **Better Resource Discovery**: Contextual presentation of resources within a meaningful sequence
- **Personalization**: Branching paths adapt to veterans' specific situations
- **Metric Tracking**: Ability to measure completion rates and effectiveness of pathways

## Implementation Architecture

### Data Model
The pathway data structure is defined in `src/types/pathway.ts` with the following key interfaces:

```typescript
interface Pathway {
  id: string;
  title: string;
  description: string;
  targetAudience: string[];
  icon?: string;
  steps: PathwayStep[];
  tags: string[];
  estimatedDuration?: number;
  // Additional metadata...
}

interface PathwayStep {
  id: string;
  title: string;
  description: string;
  resourceIds: string[];
  content?: string;
  nextStepId?: string;
  nextStepOptions?: PathwayDecision;
  estimatedTimeMinutes?: number;
  order: number;
  // Other properties...
}

interface PathwayDecision {
  id: string;
  question: string;
  options: PathwayDecisionOption[];
}

interface UserPathwayProgress {
  userId: string;
  pathwayId: string;
  currentStepId: string;
  completedSteps: string[];
  // Progress tracking properties...
}
```

### API Endpoints
The following REST API endpoints support the pathways feature:

1. **GET /api/pathways**
   - Lists all available pathways with optional filtering
   - Query parameters: `tag`, `featured`, `limit`
   - Returns an array of pathway objects

2. **GET /api/pathways/[id]**
   - Retrieves a specific pathway by ID
   - Returns the complete pathway with all steps

3. **POST /api/pathways**
   - Creates a new pathway (admin only)
   - Requires authentication and admin privileges
   - Returns the created pathway with assigned ID

4. **PUT /api/pathways/[id]**
   - Updates an existing pathway (admin only)
   - Requires authentication and admin privileges
   - Returns the updated pathway

5. **DELETE /api/pathways/[id]**
   - Deletes a pathway (admin only)
   - Requires authentication and admin privileges
   - Returns success confirmation

6. **GET /api/pathways/progress**
   - Retrieves user's progress on pathways
   - Requires authentication
   - Returns array of progress objects for the authenticated user

7. **POST /api/pathways/progress**
   - Creates or updates user progress on a pathway
   - Requires authentication
   - Returns the updated progress object

### Component Architecture

1. **PathwayProvider** (`src/context/PathwayContext.tsx`)
   - Context provider for managing pathway state
   - Handles loading pathways, progress tracking, navigation, etc.
   - Provides functions for step navigation and decision making

2. **ResourcePathwaysSection** (`src/app/health/components/ResourcePathwaysSection.tsx`)
   - Main container component for the pathways feature
   - Handles selection of pathways and rendering of active pathway
   - Implemented with lazy loading for performance optimization

3. **PathwaySelector** (`src/app/health/components/pathway/PathwaySelector.tsx`)
   - Grid display of available pathways for selection
   - Supports filtering by featured status and limiting results
   - Includes skeleton loading states and error handling

4. **PathwayNavigator** (`src/app/health/components/pathway/PathwayNavigator.tsx`)
   - Visual progress indicator showing the sequence of steps
   - Supports direct navigation to completed or current steps
   - Responsive design for both desktop and mobile views

5. **PathwayStep** (`src/app/health/components/pathway/PathwayStep.tsx`)
   - Displays the current step content and associated resources
   - Handles step completion and decision points
   - Dynamically fetches and caches resources for each step

6. **Pathway Page** (`src/app/health/pathways/[id]/page.tsx`)
   - Dedicated page for viewing a specific pathway
   - Direct access via URL with ID parameter
   - Full pathway experience with navigation and progress tracking

### Integration Points

1. **Resource Integration**
   - Pathways connect to health resources through `resourceIds` in each step
   - Resources are fetched dynamically when a step is viewed
   - Multi-layer caching system optimizes resource loading

2. **Authentication Integration**
   - Progress tracking integrates with Firebase authentication
   - Secure storage of user pathway progress
   - Guest mode supports pathway navigation without saved progress

3. **Health Page Integration**
   - Resource Pathways section appears between Testimonials and Related Resources
   - Lazy loaded to optimize page performance
   - Visually integrated with the Health page design system

4. **MongoDB Integration**
   - Pathways stored in a dedicated `pathways` collection
   - Progress stored in `pathwayProgress` collection with user associations
   - Schema design optimized for efficient querying and indexing

## Performance Considerations

1. **Lazy Loading**
   - The entire Resource Pathways section is lazy loaded
   - IntersectionObserver API used to detect when component should load
   - Reduces initial page load time and memory usage

2. **Multi-layer Caching**
   - In-memory cache for fastest access (session)
   - LocalStorage for persistence across page reloads 
   - Custom cache configuration with different expiration times:
     - Pathways: 30 minutes
     - Step resources: 15 minutes

3. **Optimized State Management**
   - React Context API used to minimize re-renders
   - useCallback hooks for memoized function references
   - Efficient data fetching with skip conditions and dependency tracking

## Implemented Pathways

Three initial pathways have been implemented:

1. **Transitioning from Military Healthcare**
   - 5-step guided journey for veterans transitioning to civilian healthcare
   - Covers medical records, VA enrollment, appointments, and long-term care
   - Target audience: Recently separated veterans

2. **Mental Health and PTSD Support**
   - 5-step journey with decision branching for crisis/non-crisis scenarios
   - Covers symptom recognition, crisis resources, treatment options, support networks, and self-care
   - Target audience: Veterans with PTSD or seeking mental health support

3. **Accessing Emergency Care**
   - 5-step guide for navigating emergency healthcare situations
   - Covers emergency vs. urgent care, VA guidelines, non-VA options, urgent care benefits, and emergency planning
   - Target audience: All veterans with VA healthcare

## Future Enhancements

1. **Personalized Recommendations**
   - Suggest relevant pathways based on user profile and previous activity
   - Implement machine learning for improved pathway suggestions

2. **Advanced Analytics**
   - Track pathway completion rates and resource engagement
   - Measure effectiveness of different pathway designs
   - Identify drop-off points for optimization

3. **Additional Pathways**
   - Women's health journey
   - Chronic pain management
   - Disability claim preparation
   - Agent Orange/toxic exposure resources
   - Caregiver support pathways

4. **Enhanced Interactivity**
   - Interactive decision tools within steps
   - Knowledge checks to reinforce learning
   - Community feedback on pathway effectiveness

## Maintenance Guidelines

1. **Adding New Pathways**
   - Use the seed script as template (`scripts/seed-pathways.js`)
   - Ensure all steps have unique IDs
   - Verify resource IDs exist in the database
   - Test branching logic thoroughly

2. **Updating Existing Pathways**
   - Use the PUT endpoint to modify pathway content
   - Consider impact on users who are in the middle of a journey
   - Update documentation when making significant changes

3. **Monitoring Considerations**
   - Check pathway completion rates regularly
   - Monitor resource availability within pathways
   - Validate that branching decisions work correctly

## Usage Metrics & Success Criteria

The effectiveness of the Resource Pathways feature will be measured by:

1. **Engagement Metrics**
   - Pathway start rate: % of Health page visitors who begin a pathway
   - Step completion rate: % of steps completed vs. abandoned
   - Full pathway completion rate: % of started pathways that reach completion
   - Return rate: % of users who return to continue a pathway

2. **Resource Effectiveness**
   - Resource click-through rate within pathways vs. standard listings
   - Time spent on resources accessed through pathways
   - User feedback on resource relevance (rating system)

3. **User Satisfaction**
   - Post-completion feedback surveys
   - Qualitative user testing results
   - Support ticket analysis related to pathway usage
