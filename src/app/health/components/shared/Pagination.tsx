"use client";

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PaginationProps } from '../../types/health-types';

/**
 * Pagination Component
 * 
 * A reusable pagination component for navigating through pages of resources.
 * Supports page numbers, previous/next buttons, and responsive design.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  // Calculate the range of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Calculate start and end of middle range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pageNumbers.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pageNumbers.push('ellipsis-end');
      }
      
      // Always include last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center mt-8" aria-label="Pagination">
      <div className="flex items-center justify-between w-full max-w-md">
        {/* Previous button */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex space-x-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === page
                    ? 'bg-[#1A2C5B] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-current={currentPage === page ? 'page' : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next button */}
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRightIcon className="h-5 w-5 ml-1" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
