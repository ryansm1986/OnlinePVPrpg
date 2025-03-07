const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Game logic imports
// Replace GameWorld with TestWorld for debugging
const TestWorld = require('./gameLogic/TestWorld');
const { handlePlayerInput, handlePlayerConnection } = require('./gameLogic/playerHandlers');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../client')));

// Game state
const games = new Map(); // Map of game worlds by ID
const MAX_PLAYERS_PER_GAME = 30;

// Find or create a game for a player to join
function findOrCreateGame() {
  // Try to find a game with space
  for (const [id, game] of games.entries()) {
    if (game.players.size < MAX_PLAYERS_PER_GAME) {
      return game;
    }
  }
  
  // Create a new game if all are full
  const gameId = uuidv4();
  // Use TestWorld instead of GameWorld
  const newGame = new TestWorld(gameId);
  games.set(gameId, newGame);
  
  console.log(`Created new test game world with ID: ${gameId}`);
  return newGame;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Find a game for the player to join
  const game = findOrCreateGame();
  
  // Socket.IO room for game
  socket.join(game.id);
  
  // Enhanced broadcast messages for TestWorld
  // Add these functions to work with TestWorld
  game.broadcastMessage = function(event, data) {
    io.to(game.id).emit(event, data);
  };
  
  game.sendToPlayer = function(playerId, event, data) {
    io.to(playerId).emit(event, data);
  };
  
  // Handle player connection
  handlePlayerConnection(socket, game);
  
  // Handle player inputs
  socket.on('playerInput', (data) => {
    handlePlayerInput(socket, game, data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    if (game.players.has(socket.id)) {
      game.removePlayer(socket.id);
      
      // Clean up empty games
      if (game.players.size === 0) {
        games.delete(game.id);
        console.log(`Removed empty game: ${game.id}`);
      }
    }
  });
});

// Game update loop - runs every 50ms (20 updates per second)
setInterval(() => {
  for (const game of games.values()) {
    game.update();
    game.broadcastState(io);
  }
}, 50);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test game available at http://localhost:${PORT}`);
}); 