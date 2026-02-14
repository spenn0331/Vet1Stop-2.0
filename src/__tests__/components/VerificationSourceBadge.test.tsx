import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VerificationSourceBadge from '@/app/health/components/VerificationSourceBadge';

describe('VerificationSourceBadge Component', () => {
  test('renders VA verification source correctly', () => {
    render(<VerificationSourceBadge source="va" />);
    
    const badge = screen.getByText('VA Verified');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-blue-100');
  });

  test('renders DoD verification source correctly', () => {
    render(<VerificationSourceBadge source="dod" />);
    
    const badge = screen.getByText('DoD Verified');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-green-100');
  });

  test('renders community verification source correctly', () => {
    render(<VerificationSourceBadge source="community" />);
    
    const badge = screen.getByText('Community Verified');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-yellow-100');
  });

  test('renders custom verification source correctly', () => {
    render(<VerificationSourceBadge source="Custom Organization" />);
    
    const badge = screen.getByText('Verified by Custom Organization');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-gray-100');
  });

  test('renders default unverified when no source is provided', () => {
    render(<VerificationSourceBadge />);
    
    const badge = screen.getByText('Unverified');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-gray-100');
  });
});
