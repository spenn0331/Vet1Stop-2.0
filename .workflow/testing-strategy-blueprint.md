# Testing Strategy Blueprint

## Overview
This document outlines the testing approach for the Vet1Stop Next.js application, differentiating between essential MVP testing needed for investor demonstration and comprehensive testing to be implemented post-funding by a professional development team.

## Testing Philosophy for MVP

The MVP testing strategy focuses on:

1. **Visual Validation**: Ensuring the application looks professional and polished
2. **Core Functionality**: Validating that essential features work correctly
3. **Responsive Design**: Confirming the application works across devices
4. **Performance Basics**: Checking load times and basic performance metrics
5. **Investor Demo Path**: Testing the specific flow that will be shown to investors

This approach prioritizes what's needed for a successful investor pitch while laying groundwork for more comprehensive testing later.

## MVP Testing Approach

### Manual Testing Checklist

For the MVP phase, prioritize a systematic manual testing approach with checklists:

```markdown
# Resource Pages Manual Test Checklist

## Education Page
- [ ] Grid card layout renders correctly
- [ ] Filter panel displays all options
- [ ] Filters update results correctly
- [ ] Search functionality works
- [ ] Premium feature indicators display correctly
- [ ] Mobile responsiveness (test on 3+ viewports)
- [ ] Links to external resources work
- [ ] "Load More" functionality works properly

## Health Page
- [ ] (Same checks as Education page)

## Navigation
- [ ] Header links navigate correctly
- [ ] Mobile menu opens/closes properly
- [ ] Active page is highlighted in navigation
- [ ] Footer links work properly

## Authentication (Basic)
- [ ] Signup form validates inputs
- [ ] Login form works with test credentials
- [ ] Protected routes redirect appropriately
- [ ] Logout functionality works

## Accessibility
- [ ] Sufficient color contrast
- [ ] All images have alt text
- [ ] Focus states are visible
- [ ] Tab navigation works logically
```

### Automated Testing Implementation for MVP

While full test coverage isn't necessary for the MVP, basic automated tests should be implemented to catch regressions during development:

#### Unit Testing Setup

```jsx
// __tests__/components/atoms/Button.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/atoms/Button';

describe('Button component', () => {
  test('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary-600');
  });

  test('renders correctly with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-secondary-600');
  });

  test('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });
});
```

#### Component Testing Example

```jsx
// __tests__/components/molecules/ResourceCard.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResourceCard from '@/components/molecules/ResourceCard';

// Mock props
const mockResource = {
  id: '123',
  title: 'GI Bill Benefits',
  description: 'Educational assistance for veterans',
  subcategory: 'Education',
  tags: ['federal', 'education', 'benefits'],
  url: 'https://example.com/gibill',
  saved: false
};

const mockHandleSave = jest.fn();

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('ResourceCard component', () => {
  test('renders resource information correctly', () => {
    render(
      <ResourceCard 
        resource={mockResource} 
        isPremium={true} 
        onSave={mockHandleSave} 
      />
    );
    
    expect(screen.getByText(mockResource.title)).toBeInTheDocument();
    expect(screen.getByText(mockResource.description)).toBeInTheDocument();
    expect(screen.getByText(mockResource.subcategory)).toBeInTheDocument();
    expect(screen.getByText('federal')).toBeInTheDocument();
    
    const viewLink = screen.getByRole('link', { name: /view/i });
    expect(viewLink).toHaveAttribute('href', mockResource.url);
  });

  test('calls onSave when save button is clicked (premium user)', async () => {
    render(
      <ResourceCard 
        resource={mockResource} 
        isPremium={true} 
        onSave={mockHandleSave} 
      />
    );
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);
    
    expect(mockHandleSave).toHaveBeenCalledWith(mockResource.id, true);
  });

  test('save button is disabled for non-premium users', () => {
    render(
      <ResourceCard 
        resource={mockResource} 
        isPremium={false} 
        onSave={mockHandleSave} 
      />
    );
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toHaveAttribute('disabled');
    expect(saveButton).toHaveClass('cursor-not-allowed');
  });
});
```

#### Page Testing Example

```jsx
// __tests__/pages/education.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import EducationPage from '@/app/(resources)/education/page';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getEducationResources } from '@/services/resources';

// Mocks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/services/resources', () => ({
  getEducationResources: jest.fn(),
}));

describe('EducationPage', () => {
  beforeEach(() => {
    useSearchParams.mockReturnValue(new URLSearchParams());
    useSession.mockReturnValue({
      data: { user: { subscription: { isPremium: false } } },
      status: 'authenticated',
    });
    getEducationResources.mockResolvedValue([
      {
        _id: '1',
        title: 'GI Bill',
        description: 'Education benefits for veterans',
        category: 'education',
        source: 'federal',
        tags: ['education', 'benefits'],
      },
      {
        _id: '2',
        title: 'Scholarships for Veterans',
        description: 'Scholarship opportunities',
        category: 'education',
        source: 'ngo',
        tags: ['scholarships', 'funding'],
      },
    ]);
  });

  test('renders education resources correctly', async () => {
    render(<EducationPage />);
    
    expect(screen.getByText('Loading resources...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('GI Bill')).toBeInTheDocument();
      expect(screen.getByText('Scholarships for Veterans')).toBeInTheDocument();
    });
  });

  test('shows premium banner for non-premium users', async () => {
    render(<EducationPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Upgrade to premium/i)).toBeInTheDocument();
    });
  });

  test('does not show premium banner for premium users', async () => {
    useSession.mockReturnValue({
      data: { user: { subscription: { isPremium: true } } },
      status: 'authenticated',
    });
    
    render(<EducationPage />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Upgrade to premium/i)).not.toBeInTheDocument();
    });
  });
});
```

### Jest Configuration for MVP

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig);
```

### Jest Setup File

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock Firebase for tests
jest.mock('@/lib/firebase', () => ({
  app: {},
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  },
  db: {},
  storage: {},
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Basic Performance Testing for MVP

Implement simple performance checks using Lighthouse CLI for the MVP:

```bash
# package.json script
"scripts": {
  "test:performance": "lighthouse http://localhost:3000 --output=json --output-path=./performance-report.json --chrome-flags=\"--headless\""
}
```

## Testing Documentation for MVP

For the MVP, create a simple testing document that outlines:

1. Manual testing procedures for investor demo
2. Basic test commands and their purposes
3. Performance benchmarks for the application

Example test documentation:

```markdown
# Vet1Stop Testing Guide

## Running Tests
- `npm test`: Run all unit and component tests
- `npm run test:watch`: Run tests in watch mode during development
- `npm run test:coverage`: Generate test coverage report
- `npm run test:performance`: Run Lighthouse performance tests

## Manual Testing Checklist
The complete manual testing checklist is available at `docs/manual-testing-checklist.md`

## Performance Benchmarks
- First Contentful Paint: < 1.2s
- Time to Interactive: < 3.5s
- Lighthouse Performance Score: > 85
- Lighthouse Accessibility Score: > 90

## Test User Accounts
- Regular User: test@example.com / password123
- Admin User: admin@example.com / admin123
```

## Future Testing Enhancements (Post-Funding)

The following testing enhancements will be implemented by the professional development team after funding:

### Comprehensive Test Coverage

```javascript
// Future implementation - Not required for MVP
// Example of advanced integration test

// __tests__/integration/authentication.test.js
describe('Authentication Flow', () => {
  test('User can sign up, verify email, and access premium content', async () => {
    // Test the complete user journey
  });

  test('Military verification process works correctly', async () => {
    // Test document upload, verification, and status updates
  });
});
```

### End-to-End Testing with Cypress

```javascript
// Future implementation - Not required for MVP
// cypress/e2e/resource-discovery.cy.js
describe('Resource Discovery', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/education');
  });

  it('allows filtering education resources', () => {
    cy.get('[data-testid="filter-panel"]').within(() => {
      cy.get('input[name="sources"][value="federal"]').check();
      cy.get('button').contains('Apply Filters').click();
    });

    cy.url().should('include', 'sources=federal');
    cy.get('[data-testid="resource-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="resource-card"]').first().should('contain', 'Federal');
  });

  it('allows searching for resources', () => {
    cy.get('[data-testid="search-input"]').type('GI Bill{enter}');
    cy.get('[data-testid="resource-card"]').should('contain', 'GI Bill');
  });
});
```

### Visual Regression Testing

```javascript
// Future implementation - Not required for MVP
// Example of visual regression test configuration with Storybook and Chromatic
// .storybook/main.js
module.exports = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
};
```

### Accessibility Testing

```javascript
// Future implementation - Not required for MVP
// __tests__/accessibility/pages.test.js
import { axe } from 'jest-axe';

describe('Accessibility Tests', () => {
  test('Home page passes accessibility tests', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Education page passes accessibility tests', async () => {
    const { container } = render(<EducationPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Load Testing

```javascript
// Future implementation - Not required for MVP
// load-testing/scenarios.js
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  http.get('https://vet1stop.com/');
  http.get('https://vet1stop.com/api/resources/education');
  sleep(1);
}
```

### Security Testing

```javascript
// Future implementation - Not required for MVP
// Security testing with OWASP ZAP or similar tools
// This would be integrated into CI/CD pipelines
// And would include penetration testing reports
```

## Implementation Strategy for MVP

### Phase 1: Test Infrastructure Setup

1. Install and configure Jest and Testing Library
2. Create basic test utilities and mocks
3. Set up test scripts in package.json
4. Create manual testing checklists

### Phase 2: Core Component Testing

1. Write tests for essential atomic components
2. Test key molecules like ResourceCard and SearchBar
3. Validate organism components like Header and ResourceGrid
4. Create snapshot tests for design consistency

### Phase 3: Page-Level Testing

1. Test resource pages (Education, Health, etc.)
2. Validate navigation and routing
3. Test basic authentication flows
4. Verify responsiveness across breakpoints

### Phase 4: Performance Checks

1. Set up Lighthouse CI for performance monitoring
2. Establish performance baselines
3. Identify and fix critical performance issues
4. Document performance metrics for the investor demo

## Best Practices for MVP Testing

1. **Focus on Investor Demo Flow**: Prioritize testing the exact flows that will be shown to investors
2. **Visual Polish**: Test for visual consistency and professional appearance
3. **Responsiveness**: Ensure the application looks good on all devices
4. **Core Functionality**: Verify that essential features work correctly
5. **Realistic Data**: Test with representative sample data
6. **Error States**: Check that error states are handled gracefully
7. **Loading States**: Verify that loading states provide good user feedback

## Success Criteria for MVP Testing

The testing implementation for the MVP is successful when:

1. All manual testing checklists pass
2. Core components have basic unit tests
3. Key pages have integration tests
4. Performance metrics meet or exceed targets
5. The application works correctly across devices
6. The investor demo flow works flawlessly
7. Critical user paths are validated

## Notes for Developer

1. Prioritize manual testing for the MVP phase
2. Write automated tests for core components and critical flows
3. Focus on the visual appearance and responsiveness
4. Document any testing technical debt for future resolution
5. Ensure the investor demo path is thoroughly tested
6. Create a small set of high-quality tests rather than attempting complete coverage
7. Test with realistic data that will be shown during investor demos

## Future Testing Roadmap (Post-Funding)

After securing funding, the professional development team will implement:

1. Comprehensive test suites with high coverage
2. End-to-end testing with Cypress
3. Visual regression testing
4. Accessibility compliance testing
5. Load and performance testing
6. Security vulnerability testing
7. Military verification system testing
8. Payment processing and subscription testing
9. Continuous integration with automated testing
10. Regular security audits and penetration testing

This testing strategy blueprint provides a practical approach for the MVP phase, focusing on what's needed to demonstrate a polished product to investors while documenting which advanced testing practices will be implemented by a professional team post-funding.
