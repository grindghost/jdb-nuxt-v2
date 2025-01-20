/*
export default defineNuxtPlugin(() => {
  
  function Scaler() {
    const _width = 800;  // Width of the container (target width)
    const _height = 449; // Height of the container (target height)

    try {
      const container = document.getElementsByTagName('*')[0];

      // Remove previous styles related to transformations
      container.style.removeProperty('transform-origin');
      container.style.removeProperty('transform');
      container.style.removeProperty('height'); // Clear previous height settings if any

      // Get the actual window dimensions
      let childWidth = window.innerWidth;
      let childHeight = window.innerHeight;

      // Calculate scale for both width and height
      let wScale = childWidth / _width;
      let hScale = childHeight / _height;
      let scale = Math.min(wScale, hScale);  // Choose the smaller scale to ensure both fit

      // Apply the scale
      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'left top';

      // Ensure the container's height is correctly set to prevent scrolling
      const adjustedHeight = _height * scale;
      container.style.height = `${adjustedHeight}px`;

      // Prevent the content from overflowing the iframe
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Scaler error:', error);
    }
  }

  // Apply Scaler on initial load and when resizing the window
  window.addEventListener('DOMContentLoaded', Scaler, false);
  window.addEventListener('resize', Scaler, false);

  // Apply Scaler after everything (including iframes) has fully loaded
  window.addEventListener('load', () => {
    Scaler();  // Initial call once everything is loaded
  });

  // Trigger Scaler after a brief delay to ensure any iframe-related layout adjustments are accounted for
  setTimeout(() => {
    Scaler();
  }, 100);  // Adjust this delay if necessary

});
*/

