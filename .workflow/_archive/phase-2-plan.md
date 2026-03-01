# Phase 2: Needs-Based Navigation and Advanced Filtering Plan

## Overview
- **Timeline**: Short-term (1-2 months)
- **Focus**: Implement needs-based navigation and advanced filtering to further personalize the resource discovery experience.
- **Start Date**: TBD
- **Key Goals**:
  - Reduce user overwhelm by guiding them based on specific needs.
  - Improve resource relevance through advanced filters.
  - Build trust through user feedback and ratings.

## Key Features

### 1. Needs-Based Navigation
- **Description**: Guide users to relevant resources based on their specific needs or situations (e.g., "I'm looking for mental health support").
- **Implementation Steps**:
  - Create a new UI component (e.g., a wizard or card-based selection) on the Health page to prompt users to select their primary need or concern.
  - Map user needs to specific resource categories or tags in the backend.
  - Update the `ResourceFinderSection` to pre-filter resources based on the selected need.
  - Ensure this navigation integrates with existing category filtering and pagination.
  - Test user flows to ensure intuitive navigation and accurate resource recommendations.
- **Target Files**:
  - `src/app/health/page.tsx` - Add the needs-based UI component.
  - `src/app/health/components/ResourceFinderSection.tsx` - Update filtering logic.
  - `src/types/resources.ts` - Add fields for needs mapping if necessary.

### 2. Tabbed Navigation
- **Description**: Implement a tabbed interface to organize Health page content and reduce information overload.
- **Status**: ✅ Completed
- **Implementation Steps**:
  - ✅ Create a reusable `TabNavigation` component with mobile-responsive design.
  - ✅ Add icons to each tab for improved visual recognition.
  - ✅ Ensure tabs are keyboard accessible and meet WCAG standards.
  - ✅ Implement mobile-friendly dropdown navigation for smaller screens.
  - ✅ Include tab descriptions to help users understand the content in each section.
  - ✅ Add NGO Resources as a dedicated tab.
  - ✅ Update Health page layout to use the new tabbed navigation system.
- **Target Files**:
  - `src/app/health/components/TabNavigation.tsx` - New reusable component
  - `src/app/health/components/TabIcons.tsx` - SVG icons for tab navigation
  - `src/app/health/page.tsx` - Update to use tabbed navigation

### 3. Advanced Filtering
- **Description**: Allow users to filter resources by multiple criteria such as location, veteran type, branch, and eligibility.
- **Status**: ✅ Completed
- **Implementation Steps**:
  - ✅ Expand the existing filter UI in `ResourceFinderSection` to include additional filter options.
  - ✅ Add state selection dropdown with all US states.
  - ✅ Implement veteran type filter (Active Duty, Veteran, Family Member, etc.).
  - ✅ Add service branch filter (Army, Navy, Air Force, Marines, Coast Guard, Space Force).
  - ✅ Create eligibility filter for different veteran statuses.
  - ✅ Update filtering logic to handle advanced criteria.
  - ⬜ Update the API query parameters in the backend to handle multiple filter criteria.
  - ⬜ Implement logic to save user filter preferences (e.g., via localStorage or user profile if authenticated).
  - ⬜ Add visual indicators to show active filters and a clear way to reset them.
  - ⬜ Test filtering combinations to ensure they work seamlessly with pagination and needs-based navigation.
- **Target Files**:
  - `src/app/health/components/ResourceFinderSection.tsx` - Enhance filter UI and logic.
  - API route files (e.g., `src/app/api/health-resources/route.ts`) - Update to handle advanced filter queries.

### 4. Resource Rating and Feedback
- **Description**: Enable users to rate resources and provide feedback to build trust and improve resource quality over time.
- **Implementation Steps**:
  - Add a rating UI component (e.g., star rating) to the `ResourceCard` component.
  - Create a feedback form modal or section for users to submit detailed comments.
  - Implement backend endpoints to store and retrieve ratings and feedback (likely in MongoDB).
  - Update the resource display to show average ratings and number of reviews.
  - Add moderation guidelines or flagging mechanisms for inappropriate feedback.
  - Test the rating system to ensure it doesn't interfere with saving or filtering resources.
- **Target Files**:
  - `src/app/health/components/ResourceCard.tsx` - Add rating UI.
  - New component for feedback form (e.g., `src/components/ui/FeedbackModal.tsx`).
  - Backend API routes for handling ratings and feedback.
  - `src/types/resources.ts` - Add fields for ratings and feedback counts.

## Technical Considerations
- **Database Integration**: Ensure MongoDB schema supports new fields for needs mapping, advanced filters, and user feedback. Follow strict backup and validation protocols during any database changes to prevent data loss, as emphasized by the user.
- **API Updates**: Enhance API endpoints to handle complex queries for needs-based filtering and advanced criteria.
- **User Authentication**: Consider how authentication status affects feedback and saved preferences (e.g., localStorage vs. database storage for authenticated users).
- **Performance**: Optimize queries and UI rendering to handle multiple filters without slowing down the user experience.
- **Accessibility**: Ensure all new UI components (wizard, advanced filters, rating systems) comply with accessibility standards.

## Implementation Timeline
- **Week 1-2**: Design and prototype needs-based navigation UI and map user needs to resource categories.
- **Week 3-4**: Implement advanced filtering UI and backend logic, integrating with existing pagination.
- **Week 5-6**: Develop rating and feedback system, including UI and backend storage.
- **Week 7-8**: Test all features together, optimize performance, and address any bugs or UX issues.

## Potential Challenges
- **Data Mapping**: Accurately mapping user needs to resource categories may require additional metadata or tagging of resources.
- **Filter Complexity**: Handling multiple filter criteria without overwhelming the user or slowing down the API.
- **Feedback Moderation**: Ensuring user feedback is constructive and appropriate, potentially requiring moderation tools.

## Next Steps
1. Finalize the start date for Phase 2 implementation.
2. Review and refine this plan based on any feedback or additional requirements.
3. Begin prototyping the needs-based navigation UI component.

This plan will guide the implementation of Phase 2, building on the foundation of Phase 1 to create a more personalized and effective resource discovery experience for veterans using Vet1Stop.
