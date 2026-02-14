/**
 * Filter components barrel file
 * 
 * Makes importing filter components more convenient by providing a single import source
 */

// Legacy components (pre-refactoring)
export { default as AdvancedFilterPanel } from './AdvancedFilterPanel';

// New modular filter components
export { default as ResourceFilterContainer } from './ResourceFilterContainer';
export { default as CollapsibleFilterSection } from './CollapsibleFilterSection';
export { default as RadioFilterGroup } from './RadioFilterGroup';
export { default as CheckboxFilterGroup } from './CheckboxFilterGroup';
export { default as DropdownFilter } from './DropdownFilter';
export { default as ToggleFilter } from './ToggleFilter';

// Refactored components
export { default as AdvancedFilterPanelRefactored } from './AdvancedFilterPanel.refactored';
