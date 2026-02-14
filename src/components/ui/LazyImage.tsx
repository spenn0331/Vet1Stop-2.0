"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderColor?: string;
  priority?: boolean;
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
}

/**
 * LazyImage component with intersection observer for optimized loading
 * Only loads images when they are about to enter the viewport
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = 200,
  height = 200,
  className = '',
  placeholderColor = '#E5E7EB', // Default light gray
  priority = false,
  objectFit = 'cover'
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer
  useEffect(() => {
    // If image is marked as priority, load it immediately without observation
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading when image is 200px from viewport
        threshold: 0.01, // Trigger when 1% of the element is visible
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // Handle image load error
  const handleImageError = () => {
    setHasError(true);
  };

  return (
    <div 
      ref={imageRef} 
      className={`relative ${className}`}
      style={{ width, height, backgroundColor: placeholderColor }}
    >
      {(isInView || priority) && !hasError ? (
        <>
          {/* Image placeholder/skeleton while loading */}
          {!isLoaded && (
            <div 
              className="absolute inset-0 animate-pulse" 
              style={{ backgroundColor: placeholderColor }}
            />
          )}
          
          {/* Actual image */}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ objectFit }}
            sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`}
            loading={priority ? 'eager' : 'lazy'}
          />
        </>
      ) : (
        // Fallback for errors or not yet in view
        <div 
          className="flex items-center justify-center w-full h-full text-gray-400"
          style={{ backgroundColor: placeholderColor }}
        >
          {hasError ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
      )}
    </div>
  );
};

export default LazyImage;
