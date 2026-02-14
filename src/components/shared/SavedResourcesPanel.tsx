import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { HealthResource } from '../../types/health';
import Link from 'next/link';

interface SavedResourcesPanelProps {
  savedResources: HealthResource[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (resourceId: string) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * SavedResourcesPanel component
 * 
 * Displays a sidebar panel with saved/favorited resources
 * Part of the Save/Favorite Functionality (Recommendation #5)
 * 
 * Features:
 * - Fully accessible with proper ARIA attributes
 * - Keyboard navigation with focus trap for modal behavior
 * - Loading and error states
 * - Support for empty state visualization
 */
const SavedResourcesPanel: React.FC<SavedResourcesPanelProps> = ({
  savedResources,
  isOpen,
  onClose,
  onRemove,
  onViewAll,
  isLoading = false,
  error = null
}) => {
  // Refs for focus management
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [firstFocusableEl, setFirstFocusableEl] = useState<HTMLElement | null>(null);
  const [lastFocusableEl, setLastFocusableEl] = useState<HTMLElement | null>(null);
  
  // Store the element that had focus before opening the panel
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements in the panel when it opens
  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Save the currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Focus the close button
      closeButtonRef.current?.focus();
      
      // Find all focusable elements
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const elements = Array.from(focusables);
      setFocusableElements(elements);
      
      if (elements.length) {
        setFirstFocusableEl(elements[0]);
        setLastFocusableEl(elements[elements.length - 1]);
      }
    }
    
    // Restore focus when closing
    return () => {
      if (!isOpen && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, savedResources]);

  // Handle escape key to close panel and trap focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    
    // Trap focus in modal
    if (e.key === 'Tab') {
      // If shift + tab and on first element, move to last element
      if (e.shiftKey && document.activeElement === firstFocusableEl) {
        e.preventDefault();
        lastFocusableEl?.focus();
      } 
      // If tab and on last element, move to first element
      else if (!e.shiftKey && document.activeElement === lastFocusableEl) {
        e.preventDefault();
        firstFocusableEl?.focus();
      }
    }
  };

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity" 
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-labelledby="saved-resources-title"
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h2 id="saved-resources-title" className="text-lg font-medium text-[#1A2C5B] flex items-center">
            <BookmarkIconSolid className="h-5 w-5 text-[#B22234] mr-2" aria-hidden="true" />
            Saved Resources
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3C3B6E]"
            onClick={onClose}
            aria-label="Close saved resources panel"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-20">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1A2C5B]"></div>
              <p className="mt-4 text-gray-600">Loading saved resources...</p>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
              <ExclamationCircleIcon className="h-10 w-10 text-[#B22234] mb-4" aria-hidden="true" />
              <p className="text-gray-800 font-medium mb-2">Unable to load saved resources</p>
              <p className="text-sm text-gray-600">{error.message || 'An unknown error occurred'}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-[#1A2C5B] text-white rounded-md hover:bg-[#3C3B6E] focus:outline-none focus:ring-2 focus:ring-[#3C3B6E] focus:ring-offset-2"
              >
                Refresh page
              </button>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && !error && savedResources.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
              <BookmarkIconSolid className="h-10 w-10 text-gray-300 mb-4" aria-hidden="true" />
              <p className="text-gray-500 mb-2">You haven't saved any resources yet</p>
              <p className="text-sm text-gray-400">
                Click the bookmark icon on any resource to save it for quick access later
              </p>
            </div>
          )}
          
          {/* Resource list */}
          {!isLoading && !error && savedResources.length > 0 && (
            <ul 
              className="divide-y divide-gray-200"
              aria-label="Saved health resources"
            >
              {savedResources.map((resource) => {
                const resourceId = resource.id || resource._id || '';
                return (
                  <li key={resourceId} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#1A2C5B] truncate">
                          {resource.title || resource.name || 'Unnamed Resource'}
                        </h3>
                        {resource.category && (
                          <p className="text-xs text-gray-500">
                            {resource.category}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                          {resource.description || 'No description available'}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <button
                          type="button"
                          onClick={() => onRemove(resourceId)}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3C3B6E] rounded-full p-1"
                          aria-label={`Remove ${resource.title || resource.name || 'resource'} from saved list`}
                        >
                          <span className="sr-only">Remove</span>
                          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {(resource.link || resource.url || resource.website) && (
                      <div className="mt-2">
                        <Link
                          href={resource.link || resource.url || resource.website || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#1A2C5B] font-medium flex items-center hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3C3B6E] rounded p-1"
                        >
                          View Resource
                          <ChevronRightIcon className="h-3 w-3 ml-1" aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && savedResources.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {savedResources.length} saved {savedResources.length === 1 ? 'resource' : 'resources'}
              </p>
              {onViewAll && (
                <button
                  type="button"
                  onClick={onViewAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1A2C5B] rounded-md hover:bg-[#3C3B6E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3C3B6E]"
                >
                  View All Saved Resources
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SavedResourcesPanel;
