import React, { useId } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';

type OptionType = string | { code: string; name: string };

interface CheckboxFilterGroupProps {
  options: OptionType[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  name: string;
  label?: string;
  className?: string;
  description?: string;
}

/**
 * CheckboxFilterGroup component for filter options that allow multiple selections
 * Used for inclusive filter options
 * 
 * Supports both simple string arrays and object arrays with code/name properties
 */
const CheckboxFilterGroup: React.FC<CheckboxFilterGroupProps> = ({
  options,
  selectedValues,
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
  
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      // Add the option if it's not already selected
      onChange([...selectedValues, value]);
    } else {
      // Remove the option if it's selected
      onChange(selectedValues.filter(val => val !== value));
    }
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
      
      <div className="space-y-2" role="group">
        {options.map((option) => {
          const { display, value } = getOptionValues(option);
          const id = `${name}-${groupId}-${value.toLowerCase().replace(/\s+/g, '-')}`;
          const isSelected = selectedValues.some(
            val => val.toLowerCase() === value.toLowerCase()
          );
          
          return (
            <div key={id} className="flex items-center">
              <Checkbox
                id={id}
                checked={isSelected}
                onCheckedChange={(checked) => 
                  handleCheckboxChange(value, checked === true)
                }
              />
              <label
                htmlFor={id}
                className={`ml-3 text-sm ${isSelected ? 'font-medium text-[#1A2C5B]' : 'font-normal text-gray-600'}`}
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

export default CheckboxFilterGroup;
