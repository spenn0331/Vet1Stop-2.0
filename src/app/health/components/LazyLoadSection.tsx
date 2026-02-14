"use client";

import React, { useEffect, useRef, useState } from 'react';

interface LazyLoadSectionProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  fadeIn?: boolean;
  slideIn?: boolean;
  delay?: number;
}

const LazyLoadSection: React.FC<LazyLoadSectionProps> = ({
  children,
  threshold = 0.1,
  className = '',
  fadeIn = true,
  slideIn = false,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the section becomes visible
        if (entry.isIntersecting) {
          // Set a timeout if delay is specified
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
          } else {
            setIsVisible(true);
          }
          
          // Mark as loaded and disconnect the observer
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: threshold
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [threshold, delay]);

  // Determine animation classes
  const animationClasses = isVisible
    ? `opacity-100 ${slideIn ? 'translate-y-0' : ''} transition-all duration-700 ease-out`
    : `opacity-0 ${slideIn ? 'translate-y-8' : ''} transition-all duration-700 ease-out`;

  return (
    <div
      ref={sectionRef}
      className={`${className} ${fadeIn || slideIn ? animationClasses : ''}`}
    >
      {/* Only render children if section has been visible at least once */}
      {(isLoaded || isVisible) && children}
    </div>
  );
};

export default LazyLoadSection;
