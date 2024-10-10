export default defineNuxtPlugin(() => {
    // New scaler (9 Oct 2024)
    function Scaler() {

      // Width of the container
      const _width = 788;

      try {
        const container = document.getElementsByTagName('*')[0];
        if (window.innerWidth <= 801) {
          // Remove previous styles related to the transformations
          container.style.removeProperty('transform-origin');
          container.style.removeProperty('transform');
  
          let wrapWidth = `${_width}`;
          let wrapHeight = 446;
          let childWidth = window.innerWidth;
          let childHeight = window.innerHeight;
          let wScale = childWidth / wrapWidth;
          let hScale = childHeight / wrapHeight;
          let scale = Math.min(wScale, hScale);
  
          container.style.transform = `scale(${scale})`;
          container.style.transformOrigin = 'left top';
          container.style.maxWidth = `${_width}px`;
        }
      } catch (error) {
        console.error(error);
      }
    }
  
    window.addEventListener('DOMContentLoaded', Scaler, false);
    window.addEventListener('resize', Scaler, false);
    document.addEventListener('ready', Scaler, false);
  });
  