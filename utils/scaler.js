export default function Scaler() {
    const _width = 800; // Target container width
    const _height = 449; // Target container height
  
    try {
      const container = document.getElementsByTagName('*')[0];
  
      // Remove previous styles related to transformations
      container.style.removeProperty('transform-origin');
      container.style.removeProperty('transform');
      container.style.removeProperty('height');
  
      // Get actual window dimensions
      const childWidth = window.innerWidth;
      const childHeight = window.innerHeight;
  
      // Calculate scaling factors
      const wScale = childWidth / _width;
      const hScale = childHeight / _height;
      const scale = Math.min(wScale, hScale); // Choose the smaller scale to ensure it fits
  
      // Apply the scale
      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'left top';
  
      // Ensure container height matches scaled height
      const adjustedHeight = _height * scale;
      container.style.height = `${adjustedHeight}px`;
  
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Scaler error:', error);
    }
  }
  
  // Add event listeners
  export function initializeScaler() {
    // Apply Scaler on initial load and window resize
    window.addEventListener('DOMContentLoaded', Scaler, false);
    window.addEventListener('resize', Scaler, false);
  
    // Apply Scaler after everything (including iframes) has fully loaded
    window.addEventListener('load', Scaler);
  
    // Trigger Scaler after a brief delay for any layout adjustments
    setTimeout(() => {
      Scaler();
    }, 100);
  }
  