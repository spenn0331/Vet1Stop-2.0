import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FundingBadge from '@/app/health/components/FundingBadge';

describe('FundingBadge Component', () => {
  test('renders government funding type correctly', () => {
    render(<FundingBadge type="government" />);
    
    const badge = screen.getByText('Government Funded');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-blue-100');
  });

  test('renders private funding type correctly', () => {
    render(<FundingBadge type="private" />);
    
    const badge = screen.getByText('Privately Funded');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-purple-100');
  });

  test('renders hybrid funding type correctly', () => {
    render(<FundingBadge type="hybrid" />);
    
    const badge = screen.getByText('Hybrid Funding');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-teal-100');
  });

  test('renders default unknown funding when no type is provided', () => {
    render(<FundingBadge />);
    
    const badge = screen.getByText('Funding Type Unknown');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('div')).toHaveClass('bg-gray-100');
  });
});
