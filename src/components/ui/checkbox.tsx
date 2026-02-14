import React from 'react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Checkbox component
 * 
 * An accessible checkbox input component
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  label
}) => {
  return (
    <div className="flex items-center">
      <div className="relative flex items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className={`
            h-4 w-4 rounded border-gray-300 text-[#1A2C5B] 
            focus:ring-[#3C3B6E] focus:ring-offset-2
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${className}
          `}
        />
        {label && (
          <label htmlFor={id} className="ml-2 text-sm text-gray-600">
            {label}
          </label>
        )}
      </div>
    </div>
  );
};

export default Checkbox;
