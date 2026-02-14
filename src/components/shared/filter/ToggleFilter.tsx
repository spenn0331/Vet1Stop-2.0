import React, { useId } from 'react';
import { Switch } from '../../../components/ui/switch';

interface ToggleFilterProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  id?: string; // Optional - will generate one if not provided
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * ToggleFilter component for binary filter options
 * Used for yes/no filter choices with a toggle switch UI
 * 
 * Enhanced with proper accessibility attributes and keyboard focus handling
 */
const ToggleFilter: React.FC<ToggleFilterProps> = ({
  label,
  checked,
  onChange,
  description,
  id: providedId,
  className = '',
  disabled = false,
  ariaLabel
}) => {
  const generatedId = useId();
  const id = providedId || `toggle-${generatedId}`;
  const descriptionId = description ? `${id}-description` : undefined;
  
  return (
    <div 
      className={`flex items-center justify-between ${className} ${disabled ? 'opacity-60' : ''}`}
      role="group"
      aria-labelledby={id}
    >
      <div className="flex-1 mr-2">
        <label 
          id={id}
          htmlFor={`${id}-switch`} 
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p 
            id={descriptionId} 
            className="text-xs text-gray-500 mt-1"
          >
            {description}
          </p>
        )}
      </div>
      <Switch
        id={`${id}-switch`}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={ariaLabel || label}
        aria-describedby={descriptionId}
        disabled={disabled}
        aria-checked={checked}
      />
    </div>
  );
};

export default ToggleFilter;
