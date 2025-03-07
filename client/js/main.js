/**
 * Main entry point for the game
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("DOM content loaded, initializing game...");
    
    // Create and initialize the game
    const game = new Game();
    game.init();
    
    // Fallback for character selection
    setTimeout(() => {
      // Add emergency click listeners directly to character options
      const characterOptions = document.querySelectorAll('.character-option');
      if (characterOptions.length > 0) {
        console.log("Setting up fallback character selection handlers");
        
        // Function to select character
        const selectCharacter = (option) => {
          console.log("Fallback character selection activated");
          // Remove selected class from all options
          characterOptions.forEach(opt => opt.classList.remove('selected'));
          // Add selected class to clicked option
          option.classList.add('selected');
          
          // Check start button state
          const nameInput = document.getElementById('player-name');
          const startButton = document.getElementById('start-game');
          
          if (startButton && nameInput && nameInput.value) {
            startButton.disabled = false;
            console.log("Start button enabled by fallback mechanism");
          }
        };
        
        // Add direct click handlers
        characterOptions.forEach(option => {
          option.onclick = function() {
            selectCharacter(option);
          };
        });
        
        // Set up manual start game button handler
        const startButton = document.getElementById('start-game');
        if (startButton) {
          startButton.onclick = function() {
            const selectedClass = document.querySelector('.character-option.selected');
            const playerName = document.getElementById('player-name').value;
            
            if (selectedClass && playerName) {
              console.log("Manual game start triggered");
              if (game && typeof game.startGame === 'function') {
                game.startGame();
              }
            } else {
              console.warn("Cannot start game: missing player name or character selection");
            }
          };
        }
      }
    }, 3000); // Wait for everything to be fully loaded
    
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
    
    console.log("Game initialization complete");
  } catch (error) {
    console.error("Critical error during game startup:", error);
  }
}); 