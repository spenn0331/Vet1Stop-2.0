/**
 * Health Page UI Validation Tests
 * 
 * This file contains utilities to validate UI components on the Health page.
 * Used for internal testing and development purposes.
 */

export const validateHealthPageUI = () => {
  console.log('Starting Health Page UI validation tests...');
  
  // Test accordion functionality
  const accordions = document.querySelectorAll('.accordion-item');
  console.log(`Found ${accordions.length} accordion items for testing`);
  
  accordions.forEach((accordion, index) => {
    // Test opening/closing
    const button = accordion.querySelector('button');
    const initialState = accordion.classList.contains('open') ? 'open' : 'closed';
    console.log(`Accordion ${index + 1} initial state: ${initialState}`);
    
    if (button) {
      button.click();
      const newState = accordion.classList.contains('open') ? 'open' : 'closed';
      console.log(`Accordion ${index + 1} after click: ${newState}`);
      
      // Click again to restore original state
      button.click();
    }
    
    // Verify content visibility
    const content = accordion.querySelector('.accordion-content');
    console.log(`Accordion ${index + 1} content visible: ${content?.classList.contains('open')}`);
  });

  // Test search functionality in ResourceFinderSection
  const searchInput = document.querySelector('#resource-search');
  if (searchInput) {
    console.log('Testing resource search functionality...');
    (searchInput as HTMLInputElement).value = 'PTSD';
    searchInput.dispatchEvent(new Event('input'));
    console.log('Resource search test triggered with query: PTSD');
    
    // Reset the search
    setTimeout(() => {
      (searchInput as HTMLInputElement).value = '';
      searchInput.dispatchEvent(new Event('input'));
      console.log('Search reset');
    }, 2000);
  } else {
    console.log('Resource search input not found');
  }
  
  // Test filter functionality
  const filterSelects = document.querySelectorAll('select[id$="-filter"]');
  console.log(`Found ${filterSelects.length} filter selects`);
  
  filterSelects.forEach((select, index) => {
    const options = select.querySelectorAll('option');
    if (options.length > 1) {
      const currentValue = (select as HTMLSelectElement).value;
      console.log(`Filter ${index + 1} current value: ${currentValue}`);
      
      // Change to a different option
      const newOption = Array.from(options).find(opt => (opt as HTMLOptionElement).value !== currentValue);
      if (newOption) {
        (select as HTMLSelectElement).value = (newOption as HTMLOptionElement).value;
        select.dispatchEvent(new Event('change'));
        console.log(`Filter ${index + 1} changed to: ${(newOption as HTMLOptionElement).value}`);
        
        // Reset back to original value
        setTimeout(() => {
          (select as HTMLSelectElement).value = currentValue;
          select.dispatchEvent(new Event('change'));
          console.log(`Filter ${index + 1} reset to: ${currentValue}`);
        }, 2000);
      }
    }
  });
  
  // Test responsive layout
  const checkResponsiveness = () => {
    const width = window.innerWidth;
    console.log(`Testing responsiveness at width: ${width}px`);
    
    // Mobile breakpoint check
    if (width < 768) {
      console.log('Mobile layout detected - checking mobile-specific elements');
      const mobileMenus = document.querySelectorAll('.mobile-menu');
      console.log(`Mobile menus found: ${mobileMenus.length}`);
    }
    
    // Check grid layouts
    const grids = document.querySelectorAll('.grid');
    grids.forEach((grid, index) => {
      const columns = window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      console.log(`Grid ${index + 1} has ${columns} columns at ${width}px width`);
    });
  };
  
  checkResponsiveness();
  console.log('UI validation tests completed');
  
  return {
    runAllTests: validateHealthPageUI,
    testAccordions: () => accordions.forEach(acc => acc.querySelector('button')?.click()),
    testResponsiveness: checkResponsiveness
  };
};

// Function to be called from the browser console to run tests
(window as any).validateHealthUI = validateHealthPageUI;
