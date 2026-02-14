# Vet1Stop Design System

## Brand Identity

### Core Values
- **Trustworthiness**: Conveying reliability and credibility in all visual elements
- **Accessibility**: Ensuring all users, including those with disabilities, can navigate the platform
- **Professionalism**: Presenting a polished, organized appearance that respects veterans' service
- **Community**: Creating a sense of belonging and connection among users
- **Patriotism**: Honoring military service while avoiding excessive nationalism

### Color Palette

#### Primary Colors
- **Navy Blue (#0D3B66)**: Primary brand color, representing trust, stability, and professionalism
- **Red (#F95738)**: Accent color for calls-to-action, conveying energy and importance
- **White (#FFFFFF)**: Background color for readability and clean aesthetic

#### Secondary Colors
- **Light Blue (#BCD2EE)**: For hover states, backgrounds, and secondary elements
- **Gold (#FFD700)**: Sparingly used for premium features or special highlights
- **Gray (#6C757D)**: For neutral text and subtle UI elements

#### Semantic Colors
- **Success Green (#28A745)**: For positive messages and confirmations
- **Warning Yellow (#FFC107)**: For cautionary messages
- **Error Red (#DC3545)**: For error messages and critical alerts

### Typography

#### Font Hierarchy
- **Headings**: "Source Sans Pro", sans-serif (700 weight)
- **Body Text**: "Source Sans Pro", sans-serif (400 weight)
- **Accent Text**: "Source Sans Pro", sans-serif (600 weight italic)
- **System Fallbacks**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

#### Font Sizes
- **H1**: 2.5rem (40px)
- **H2**: 2rem (32px)
- **H3**: 1.75rem (28px)
- **H4**: 1.5rem (24px)
- **Body**: 1rem (16px)
- **Small**: 0.875rem (14px)
- **XSmall**: 0.75rem (12px)

#### Line Heights
- **Headings**: 1.2
- **Body Text**: 1.5
- **Buttons & Labels**: 1.2

### Spacing System
- **Base Unit**: 0.25rem (4px)
- **Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
- **Component Spacing**: Consistent margin and padding using the spacing scale

### Border Radius
- **Small**: 0.25rem (4px) - For buttons, inputs, and small elements
- **Medium**: 0.5rem (8px) - For cards and larger components
- **Large**: 1rem (16px) - For modal windows and feature sections
- **Pill**: 9999px - For tags and status indicators

## Component Library

### Navigation Components
- **Header**: Fixed top navigation with logo, primary navigation, and authentication controls
- **Footer**: Three-column layout with resources, quick links, and contact information
- **Sidebar**: Collapsible navigation for resource sections (on applicable pages)
- **Breadcrumbs**: Showing user location within resource hierarchies

### Content Components
- **Hero Section**: Background with overlay text and call-to-action
- **Resource Card**: Standard card for displaying resource previews with consistent padding and imagery
- **Category Card**: Larger card for main navigation on homepage (Hub and Resources sections)
- **Info Box**: Styled container for featured information or tips
- **Testimonial**: Quote format with attribution for veteran stories
- **Alert**: System for notifications, warnings, and errors with appropriate icons

### Interactive Elements
- **Primary Button**: Bold, filled style for main actions
- **Secondary Button**: Outlined style for alternative actions
- **Tertiary Button**: Text-only for minor actions
- **Search Bar**: Prominent with autocomplete functionality
- **Form Controls**: Consistent styling for inputs, selects, checkboxes, and radio buttons
- **Pagination**: For navigating through multi-page content
- **Filter Controls**: For refining resource searches
- **Dropdown Menu**: For navigation and selection interfaces

### Layout Patterns
- **Card Grid**: Responsive grid layout for displaying multiple cards
- **Split Screen**: 50/50 layout for comparison or feature highlighting
- **Tabbed Interface**: For organizing related content within pages
- **Accordion**: For FAQ sections and collapsible content
- **Sidebar + Main Content**: For resource browsing with filtering options

## Responsive Behavior

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1023px
- **Desktop**: 1024px - 1279px
- **Large Desktop**: >= 1280px

### Mobile Adaptations
- Header transforms to hamburger menu
- Card grids reduce columns (3→2→1)
- Font sizes scale down slightly
- Touch targets increase to minimum 44px
- Side-by-side layouts stack vertically

## Accessibility Standards

### Requirements
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Semantic HTML and ARIA labels throughout
- **Focus States**: Visible focus indicators on all interactive elements
- **Alt Text**: Descriptive alternative text for all images
- **Text Scaling**: Supports browser text scaling up to 200%
- **Reduced Motion**: Alternative animations for users with vestibular disorders

### Implementation Notes
- Use `rem` units for scaling with user preferences
- Label all form elements explicitly
- Provide visible error messages on form validation
- Ensure correct heading hierarchy (H1 → H6)
- Add skip navigation links for keyboard users

## Animation Guidelines

### Principles
- Subtle, purposeful animations that enhance rather than distract
- Maximum duration of 300ms for interface transitions
- Easing functions that feel natural (ease-out for entrances, ease-in for exits)
- Always provide non-animated alternatives

### Common Animations
- **Hover Effects**: Subtle scale or color changes (150ms)
- **Page Transitions**: Fade-in content (250ms)
- **Modal Entrances**: Scale and fade (300ms)
- **Loading States**: Spinning or pulsing indicators
- **Success Actions**: Checkmark or confirmation animations (300ms)

## Implementation with Tailwind CSS

### Configuration
- Custom color palette defined in tailwind.config.js
- Extended spacing scale to match design system
- Typography plugin configured for consistent text styling
- Custom component classes for recurring patterns

### Utility Class Strategy
- Favor composition of utility classes over custom CSS
- Create component classes for complex, repeating patterns
- Maintain consistent class ordering: layout → typography → visual → interactive
- Use Tailwind's `@apply` sparingly and only for highly reused patterns

### Responsive Philosophy
- Mobile-first approach with breakpoint-specific adjustments
- Consistent responsive padding and margin scales
- Fluid typography where appropriate
- Graceful degradation of complex layouts

This design system provides the foundation for building a cohesive, accessible, and professional user experience across all pages of the Vet1Stop platform.
