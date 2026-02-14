"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { Z_INDICES } from '../../utils/health-constants';

interface StandaloneModalProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

/**
 * StandaloneModal Component
 * 
 * A self-contained modal implementation that doesn't rely on the shared modal component.
 * Uses high z-index values and inline styles for maximum cross-browser compatibility.
 * This component fixes the issue with modals being cut off by the crisis banner.
 */
const StandaloneModal: React.FC<StandaloneModalProps> = ({
  title,
  isOpen,
  onClose,
  children,
  size = 'md',
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const [animationClass, setAnimationClass] = useState('opacity-0 scale-95');

  // Get size class based on prop
  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4'
  }[size];

  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle animation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      // Small delay to trigger animation
      timer = setTimeout(() => {
        setAnimationClass('opacity-100 scale-100');
      }, 10);
    } else {
      setAnimationClass('opacity-0 scale-95');
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  // Return nothing if not mounted or not open
  if (!mounted || !isOpen) return null;

  // Create portal element in the document
  const portalElement = document.getElementById('modal-root');
  
  // If the portal element doesn't exist, create it
  if (!portalElement && typeof document !== 'undefined') {
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  }

  // Portal the modal to body
  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: Z_INDICES.STANDALONE_MODAL,
        backdropFilter: 'blur(2px)'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${sizeClass} bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 ${animationClass} ${className}`}
        style={{ 
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal header */}
        <div 
          className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white"
          style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: Z_INDICES.MODAL_HEADER
          }}
        >
          {title && (
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 ml-auto"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Modal content */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default StandaloneModal;
