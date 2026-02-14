"use client";

import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

interface ModalProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export default function Modal({
  title,
  isOpen,
  onClose,
  children,
  size = 'md',
  className = '',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (backdropRef.current && backdropRef.current === e.target) {
      onClose();
    }
  };

  // Handle animation
  const [animationClass, setAnimationClass] = useState('opacity-0 scale-95');
  
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

  if (!mounted) return null;

  // Create portal element in the document
  const portalElement = document.getElementById('modal-root');
  
  // If the portal element doesn't exist, create it
  if (!portalElement && typeof document !== 'undefined') {
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  }

  // Return nothing if not open
  if (!isOpen) return null;

  // Portal the modal to body
  return createPortal(
    <div 
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className={`w-full ${sizeClass} bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 ${animationClass} ${className} my-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div 
          className="sticky top-0 z-[9999] flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white"
          style={{ position: 'sticky', top: 0, zIndex: 9999 }}
        >
          {title && (
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Modal content */}
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
