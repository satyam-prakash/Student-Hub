/**
 * Utility to prevent scroll wheel from changing number input values
 * across the entire application
 */

/**
 * Prevents scroll wheel from changing number input values
 * Call this once on app initialization
 */
export function preventNumberInputScroll() {
  // Add event listener to document to prevent scroll on focused number inputs
  document.addEventListener('wheel', function(e) {
    // Check if the focused/active element is a number input
    const activeElement = document.activeElement;
    if (activeElement && activeElement.type === 'number') {
      // Prevent the scroll from changing the value
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false });

  // Alternative: Add listener when number input gets focus
  document.addEventListener('focus', function(e) {
    if (e.target && e.target.type === 'number') {
      const input = e.target;
      
      // Add wheel listener specific to this input
      const wheelHandler = function(event) {
        event.preventDefault();
        event.stopPropagation();
      };
      
      input.addEventListener('wheel', wheelHandler, { passive: false });
      
      // Remove listener when input loses focus
      input.addEventListener('blur', function() {
        input.removeEventListener('wheel', wheelHandler);
      }, { once: true });
    }
  }, true);
}

/**
 * Alternative approach: Add onWheel handler to blur the input
 * This can be used as a prop on individual number inputs
 */
export const numberInputProps = {
  onWheel: (e) => {
    e.preventDefault();
    e.stopPropagation();
  }
};
