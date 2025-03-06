/**
 * Main entry point for the game
 */
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the game
  const game = new Game();
  game.init();
  
  // Expose game to window for debugging
  window.game = game;
}); 