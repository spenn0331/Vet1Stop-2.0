import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusIndicator from '@/app/health/components/StatusIndicator';

describe('StatusIndicator Component', () => {
  test('renders accepting status correctly', () => {
    render(<StatusIndicator status="accepting" />);
    
    const indicator = screen.getByText('Accepting New Veterans');
    expect(indicator).toBeInTheDocument();
    expect(indicator.closest('div')).toHaveClass('bg-green-100');
  });

  test('renders waitlist status correctly', () => {
    render(<StatusIndicator status="waitlist" />);
    
    const indicator = screen.getByText('Waitlist Available');
    expect(indicator).toBeInTheDocument();
    expect(indicator.closest('div')).toHaveClass('bg-yellow-100');
  });

  test('renders closed status correctly', () => {
    render(<StatusIndicator status="closed" />);
    
    const indicator = screen.getByText('Not Accepting New Veterans');
    expect(indicator).toBeInTheDocument();
    expect(indicator.closest('div')).toHaveClass('bg-red-100');
  });

  test('renders default unknown status when no status is provided', () => {
    render(<StatusIndicator />);
    
    const indicator = screen.getByText('Status Unknown');
    expect(indicator).toBeInTheDocument();
    expect(indicator.closest('div')).toHaveClass('bg-gray-100');
  });
});
