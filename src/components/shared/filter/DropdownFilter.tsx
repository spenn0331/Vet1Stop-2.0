import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

type OptionType = string | { code: string; name: string };

interface DropdownFilterProps {
  options: OptionType[];
  selectedValue: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  description?: string;
}

/**
 * DropdownFilter component for filter options that use select/dropdown selection
 * Built with accessibility in mind using proper ARIA attributes
 * 
 * Supports both simple string arrays and object arrays with code/name properties
 */
const DropdownFilter: React.FC<DropdownFilterProps> = ({
  options,
  selectedValue,
  onChange,
  label,
  placeholder = 'Select an option',
  className = '',
  description
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const id = `dropdown-${uniqueId}`;
  
  // Helper to get the display value and value from an option
  const getOptionValues = (option: OptionType): { display: string; value: string } => {
    if (typeof option === 'string') {
      return { display: option, value: option };
    }
    return { display: option.name, value: option.code };
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus management when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedOption = listRef.current.querySelector('[aria-selected="true"]');
      if (selectedOption) {
        (selectedOption as HTMLElement).focus();
      } else {
        const firstOption = listRef.current.querySelector('[role="option"]');
        if (firstOption) {
          (firstOption as HTMLElement).focus();
        }
      }
    }
  }, [isOpen]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, optionValue?: string) => {
    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Enter':
      case ' ':
        if (optionValue !== undefined) {
          onChange(optionValue);
          setIsOpen(false);
          buttonRef.current?.focus();
          e.preventDefault();
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'ArrowDown':
        if (!isOpen) {
          setIsOpen(true);
        } else if (listRef.current) {
          const currentElement = document.activeElement;
          const options = Array.from(listRef.current.querySelectorAll('[role="option"]'));
          const currentIndex = options.indexOf(currentElement as Element);
          const nextIndex = Math.min(currentIndex + 1, options.length - 1);
          (options[nextIndex] as HTMLElement).focus();
        }
        e.preventDefault();
        break;
      case 'ArrowUp':
        if (!isOpen) {
          setIsOpen(true);
        } else if (listRef.current) {
          const currentElement = document.activeElement;
          const options = Array.from(listRef.current.querySelectorAll('[role="option"]'));
          const currentIndex = options.indexOf(currentElement as Element);
          const prevIndex = Math.max(currentIndex - 1, 0);
          (options[prevIndex] as HTMLElement).focus();
        }
        e.preventDefault();
        break;
    }
  };
  
  // Find the display value for the currently selected value
  const getSelectedDisplayValue = (): string => {
    if (selectedValue === 'all' || selectedValue === '') {
      return placeholder;
    }
    
    const selectedOption = options.find(option => {
      const { value } = getOptionValues(option);
      return value.toLowerCase() === selectedValue.toLowerCase();
    });
    
    if (selectedOption) {
      return getOptionValues(selectedOption).display;
    }
    
    return selectedValue; // Fallback
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label 
        id={`${id}-label`}
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      
      {description && (
        <p 
          id={`${id}-description`}
          className="text-xs text-gray-500 mb-2"
        >
          {description}
        </p>
      )}
      
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        className="relative w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-[#1A2C5B] focus:border-[#1A2C5B] sm:text-sm"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="block truncate">
          {getSelectedDisplayValue()}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          )}
        </span>
      </button>

      {isOpen && (
        <div 
          ref={listRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          role="listbox"
          aria-labelledby={`${id}-label`}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const { display, value } = getOptionValues(option);
            const isSelected = selectedValue.toLowerCase() === value.toLowerCase();
            const optionId = `${id}-option-${index}`;
            
            return (
              <div
                key={optionId}
                id={optionId}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                  isSelected
                    ? 'text-white bg-[#1A2C5B]'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => {
                  onChange(value);
                  setIsOpen(false);
                }}
                onKeyDown={(e) => handleKeyDown(e, value)}
              >
                <span className={`block truncate ${
                  isSelected ? 'font-medium' : 'font-normal'
                }`}>
                  {display}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownFilter;
