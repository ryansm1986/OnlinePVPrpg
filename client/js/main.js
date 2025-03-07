/**
 * Main entry point for the game
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("DOM content loaded, initializing game...");
    
    // Get loading indicator reference
    const loadingElement = document.getElementById('loading-indicator');
    
    // Function to show loading indicator
    const showLoading = () => {
      if (loadingElement) {
        loadingElement.style.display = 'flex';
        console.log("Loading indicator displayed");
      }
    };
    
    // Function to hide loading indicator
    const hideLoading = () => {
      if (loadingElement) {
        loadingElement.style.display = 'none';
        console.log("Loading indicator hidden");
      }
    };
    
    // Show loading indicator
    showLoading();
    
    // Safety timeout to hide loading indicator if something goes wrong
    const loadingTimeout = setTimeout(() => {
      console.warn("Loading timeout reached (15s), hiding loading indicator");
      hideLoading();
    }, 15000);
    
    // Create and initialize the game
    window.game = new Game();
    
    // Initialize the game with a callback for when it's ready
    window.game.init((error) => {
      // Clear the safety timeout
      clearTimeout(loadingTimeout);
      
      // Hide loading indicator
      hideLoading();
      
      if (error) {
        console.error("Game initialization error:", error);
        alert("Error loading game resources. Please check console for details.");
        return;
      }
      
      console.log("Game initialization complete!");
      
      // Set up compatibility layer if we're using the modular renderer alongside old renderer
      if (window.setupRendererCompatibility && window.game.renderer) {
        window.setupRendererCompatibility(window.game.renderer);
        console.log("Renderer compatibility layer initialized");
      }
      
      // Fallback for character selection
      setTimeout(() => {
        // Add emergency click listeners directly to character options
        const characterOptions = document.querySelectorAll('.character-option');
        if (characterOptions.length > 0) {
          console.log("Setting up fallback character selection handlers");
          
          // Function to select character
          const selectCharacter = (option) => {
            // Remove selected class from all options
            characterOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Check if start button should be enabled
            if (window.game && typeof window.game.checkStartButtonState === 'function') {
              window.game.checkStartButtonState();
            }
          };
          
          // Add click handlers to each option
          characterOptions.forEach(option => {
            option.addEventListener('click', () => selectCharacter(option));
          });
          
          // Set up start button handler
          const startButton = document.getElementById('start-game');
          if (startButton) {
            startButton.addEventListener('click', () => {
              if (window.game && typeof window.game.startGame === 'function') {
                window.game.startGame();
              } else {
                console.error("Game object or startGame method not available");
                alert("Unable to start game. Please refresh the page and try again.");
              }
            });
          }
        }
      }, 1000); // Wait 1 second to ensure everything is loaded
      
      // Explicitly load assets to show character select screen
      setTimeout(() => {
        console.log("Triggering asset loading and character selection screen...");
        if (document.getElementById('character-select').classList.contains('hidden')) {
          console.log("Character select still hidden, forcing display");
          
          // Hide loading screen
          document.getElementById('loading-screen').classList.add('hidden');
          
          // Show character selection
          document.getElementById('character-select').classList.remove('hidden');
        }
      }, 2000);
      
      // Expose game to window for debugging
      window.game = game;
    });
  } catch (error) {
    console.error("Critical error during game startup:", error);
    
    // Try to show error in UI
    const errorMessage = document.getElementById('error-message');
    const errorOverlay = document.getElementById('error-overlay');
    
    if (errorMessage && errorOverlay) {
      errorMessage.textContent = error.message || "Failed to start game";
      errorOverlay.classList.remove('hidden');
    } else {
      // Fallback to alert
      alert("Critical error: " + (error.message || "Failed to start game"));
    }
  }
}); 