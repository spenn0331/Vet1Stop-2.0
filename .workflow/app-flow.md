# Application Flow for Vet1Stop

## Overview

This document outlines the primary user flows and application navigation paths for the Vet1Stop platform, providing a reference for development and design decisions.

## User Navigation

- Users start on the main landing page ("Home") and utilize search features to find resources.
- Main resource sections (Education, Health, Life and Leisure) are navigated using cards in a grid layout, with filters to narrow queries and a search bar for broader exploration.
- An AI chatbot assists veterans by greeting them (e.g., "Welcome! How can I help you find resources?"), asking clarifying questions (e.g., "How long did you serve? What branch?"), and recommending resources based on needs (e.g., a 24-year-old veteran recently out of the military).

### Resource Pages

| Page | Function | Features |
|------|----------|----------|
| **Local Page** | Functions like a Google location/business search | Location, name, services, ratings, directions from current location |
| **Shop Page** | Navigated like popular e-commerce platforms | Recommendations, sponsored listings, product categories, secure checkout |
| **Careers Page** | Veteran-focused job listings | Federal, state, and local opportunities, premium features for subscribers |
| **Social Page** | Community platform for veterans | Events section for meetups, groups for topic discussions |

## Main User Actions

- Searching for resources, switching tabs, connecting with other veterans, accessing benefits.
- Exploring veteran-owned businesses and products, joining social groups, applying for careers, and purchasing items securely.
- Veteran business owners can apply to sell products through the "Sell on Vet1Stop" onboarding process.

## Business Onboarding Process

1. Veteran-owned businesses access the onboarding form through the "Sell on Vet1Stop" button on the shop page
2. Multi-step form collects:
   - **Business Information**: Name, owner details, contact information, and address
   - **Veteran Status**: Military branch, service details, and business story
   - **Product Details**: Categories, inventory management approach, and product descriptions
   - **Terms Agreement**: Acceptance of marketplace seller terms and commission structure
3. Applications are submitted for review by administrators
4. Once approved, businesses can list and manage their products on the marketplace

## User Journeys

### New Veteran User
1. **First-time Landing Experience**
   - Arrives at homepage through direct URL, search engine, or referral
   - Views hero banner with clear value proposition
   - Scrolls to see resource category cards (Education, Health, Life and Leisure, Careers)
   - May explore navigation menu to understand site structure

2. **Resource Discovery Process**
   - Selects a resource category of interest (e.g., Education)
   - Views filtered grid of resource cards with visual indicators for source (federal, state, NGO)
   - Uses filter sidebar to narrow down by subcategory, relevance, or other attributes
   - Clicks on resource cards to view detailed information
   - Bookmarks resources of interest when logged in

3. **Account Creation Path**
   - Triggered by attempting to bookmark a resource or access premium features
   - Completes streamlined signup form with optional military verification
   - Verifies email address
   - Creates profile with service information and resource interests
   - Receives personalized resource recommendations

### Returning Authenticated User
1. **Personalized Dashboard Experience**
   - Views saved resources and recent activity
   - Receives notifications about new resources matching their interests
   - Sees personalized recommendations based on previous interactions
   - Accesses premium features based on subscription status

2. **Social Engagement Flow**
   - Navigates to Social page from main navigation
   - Views and joins groups related to interests or service branch
   - RSVPs to upcoming events in their area
   - Interacts with posts from other veterans
   - Creates new discussions or events

### Business User
1. **Registration and Verification Process**
   - Navigates to "Sell on Vet1Stop" from Shop page or footer
   - Completes business profile with veteran status documentation
   - Awaits verification (typically 1-2 business days)
   - Receives notification of approval
   - Completes onboarding tutorials

2. **Product Management Flow**
   - Accesses seller dashboard
   - Creates product listings with images, descriptions, pricing
   - Manages inventory and fulfillment options
   - Monitors sales analytics and customer reviews
   - Processes orders and shipments

## Navigation Paths

### Primary Navigation
The primary navigation follows this structure:

1. **Home** - Landing page with access to all main sections
2. **Education** - Education-focused resources 
3. **Health** - Health-focused resources
4. **Life & Leisure** - Housing, financial, family, and recreational resources
5. **Careers** - Employment and entrepreneurship resources (includes job opportunities and business resources)
6. **Local** - Veteran-owned local businesses
7. **Shop** - E-commerce for veteran-owned products
8. **Social** - Community engagement and events

## Mobile Experience Considerations

- **Responsive Priority Areas**:
  - Navigation transforms to hamburger menu on small screens
  - Resource cards stack vertically with adjusted information density
  - Filter controls collapse into accessible dropdown panels
  - Touch targets enlarged for all interactive elements (minimum 44×44px)

- **Performance Optimizations**:
  - Critical CSS delivered inline for faster rendering
  - Image lazy loading implemented for resource cards
  - Server-side rendering for initial page load
  - Caching strategies for frequently accessed resources

## AI Chatbot Integration

### Chatbot Conversation Flows

1. **Initial Greeting Flow**
   - Bot initiates with friendly, non-intrusive greeting
   - Offers clear options for assistance categories
   - Explains capabilities and limitations

2. **Needs Assessment Flow**
   - Collects relevant information about veteran status and needs
   - Asks clarifying questions to narrow resource recommendations
   - Confirms understanding before making suggestions

3. **Resource Recommendation Flow**
   - Suggests 3-5 highly relevant resources based on conversation
   - Provides brief context for why each resource was selected
   - Offers to refine recommendations if needed
   - Includes direct links to resources

## Admin Interface Navigation

- Administrators access the admin panel at `/admin` with secure authentication
- The admin panel dashboard provides statistics on resource counts by category
- Resources can be managed through a data table with the following features:
  - **Filtering**: By category (Education, Health, Life & Leisure, Careers), subcategory, location, or tags
  - **Searching**: Text search across all resource fields
  - **Sorting**: Click column headers to sort by any field
  - **Pagination**: Navigate through resources with adjustable page sizes (25, 50, 100, 200, ALL)

## Admin User Actions

### Authentication
- Login to admin panel using secure credentials
- Logout when finished to protect admin access

### Resource Management
- Create new resources with all relevant fields (category, subcategory, title, description, link, contact, location, tags)
- Edit existing resources to update information
- Delete resources that are no longer needed
- Duplicate resources to create similar entries quickly

### Seller Management
- Review new business applications for the marketplace
- Approve or reject seller applications based on verification
- Configure automation settings for seller approvals
- Contact applicants for additional information if needed
- Monitor seller performance and metrics

### Bulk Operations
- Select multiple resources using checkboxes
- Delete multiple resources at once

### Import/Export
- Export the entire resource database to a JSON file for backup
- Import resources from a JSON file for migration or restoration

### Advanced Filtering
- Apply multiple filter criteria simultaneously
- Reset filters to view all resources