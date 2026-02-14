import React, { useId } from 'react';

type OptionType = string | { code: string; name: string };

interface RadioFilterGroupProps {
  options: OptionType[];
  selectedValue: string;
  onChange: (value: string) => void;
  name: string;
  label?: string;
  className?: string;
  description?: string;
}

/**
 * RadioFilterGroup component for filter options that use radio button selection
 * Used for mutually exclusive filter options
 * 
 * Supports both simple string arrays and object arrays with code/name properties
 */
const RadioFilterGroup: React.FC<RadioFilterGroupProps> = ({
  options,
  selectedValue,
  onChange,
  name,
  label,
  className = '',
  description
}) => {
  const groupId = useId();
  
  // Helper to get the display value and value from an option
  const getOptionValues = (option: OptionType): { display: string; value: string } => {
    if (typeof option === 'string') {
      return { display: option, value: option };
    }
    return { display: option.name, value: option.code };
  };

  return (
    <fieldset 
      className={className}
      aria-describedby={description ? `${name}-${groupId}-description` : undefined}
    >
      {label && (
        <legend className="text-sm font-medium text-gray-900 mb-2">{label}</legend>
      )}
      
      {description && (
        <p 
          id={`${name}-${groupId}-description`}
          className="text-xs text-gray-500 mb-2"
        >
          {description}
        </p>
      )}
      
      <div className="space-y-2" role="radiogroup">
        {options.map((option) => {
          const { display, value } = getOptionValues(option);
          const id = `${name}-${groupId}-${value.toLowerCase().replace(/\s+/g, '-')}`;
          const isSelected = selectedValue.toLowerCase() === value.toLowerCase();
          
          return (
            <div key={id} className="flex items-center">
              <input
                id={id}
                name={name}
                type="radio"
                value={value}
                checked={isSelected}
                onChange={() => onChange(value)}
                className="h-4 w-4 text-[#1A2C5B] focus:ring-[#1A2C5B] border-gray-300"
              />
              <label
                htmlFor={id}
                className={`ml-3 text-sm ${
                  isSelected 
                    ? 'font-medium text-[#1A2C5B]' 
                    : 'font-normal text-gray-600'
                }`}
              >
                {display}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

export default RadioFilterGroup;
