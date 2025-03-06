/**
 * Main Game class
 * Manages the game state and coordinates between components
 */
class Game {
  constructor() {
    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameStarted = false;
    
    // Game objects
    this.player = null;
    this.players = new Map(); // Other players
    this.monsters = new Map();
    this.bosses = new Map();
    this.items = new Map();
    this.world = null;
    
    // Game systems
    this.renderer = null;
    this.network = null;
    this.input = null;
    this.ui = null;
    
    // Game time tracking
    this.lastUpdateTime = 0;
    this.deltaTime = 0;
    
    // Debug mode
    this.debugMode = false; // Disable debug mode by default to reduce console spam
    
    // Bind methods
    this.update = this.update.bind(this);
    this.handleGameState = this.handleGameState.bind(this);
    this.handlePlayerJoined = this.handlePlayerJoined.bind(this);
    this.handlePlayerLeft = this.handlePlayerLeft.bind(this);
    this.handleCombatEvent = this.handleCombatEvent.bind(this);
    this.handleItemPickup = this.handleItemPickup.bind(this);
    this.handlePlayerDeath = this.handlePlayerDeath.bind(this);
    this.handleBossSpawn = this.handleBossSpawn.bind(this);
    this.handleBossKill = this.handleBossKill.bind(this);
  }
  
  /**
   * Initialize the game
   */
  init() {
    try {
      console.log("Initializing game...");
      
      // Create game systems
      this.renderer = new Renderer(this);
      this.network = new Network(this);
      this.input = new Input(this);
      this.ui = new UI(this);
      
      // Try to initialize systems
      try {
        console.log("Initializing renderer...");
        this.renderer.init();
        console.log("Renderer initialized successfully");
      } catch (renderError) {
        console.error("Failed to initialize normal renderer:", renderError);
        console.log("Activating fallback renderer");
        this.forceFallbackRendering();
      }
      
      // Initialize other systems
      this.network.init();
      this.input.init();
      this.ui.init();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start loading assets
      this.loadAssets();
      
      console.log("Game initialization complete");
    } catch (error) {
      console.error("Critical error during game initialization:", error);
      alert("Failed to initialize game. Check console for details.");
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Network events
    this.network.on('gameState', this.handleGameState);
    this.network.on('playerJoined', this.handlePlayerJoined);
    this.network.on('playerLeft', this.handlePlayerLeft);
    this.network.on('combatEvent', this.handleCombatEvent);
    this.network.on('itemPickup', this.handleItemPickup);
    this.network.on('youDied', this.handlePlayerDeath);
    this.network.on('bossSpawn', this.handleBossSpawn);
    this.network.on('bossKill', this.handleBossKill);
    
    // UI events
    document.getElementById('start-game').addEventListener('click', () => {
      this.startGame();
    });
    
    document.getElementById('respawn-button').addEventListener('click', () => {
      this.respawn();
    });
    
    // Character selection
    const characterOptions = document.querySelectorAll('.character-option');
    characterOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        characterOptions.forEach(opt => opt.classList.remove('selected'));
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Enable start button if name is also entered
        this.checkStartButtonState();
      });
    });
    
    // Player name input
    document.getElementById('player-name').addEventListener('input', () => {
      this.checkStartButtonState();
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }
  
  /**
   * Check if start button should be enabled
   */
  checkStartButtonState() {
    const nameInput = document.getElementById('player-name');
    const selectedClass = document.querySelector('.character-option.selected');
    const startButton = document.getElementById('start-game');
    
    startButton.disabled = !nameInput.value || !selectedClass;
  }
  
  /**
   * Load game assets
   */
  loadAssets() {
    // Show loading screen
    document.getElementById('loading-screen').classList.remove('hidden');
    
    // Simulate asset loading (would use actual asset loader in production)
    let progress = 0;
    const loadingBar = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-text');
    
    const loadingInterval = setInterval(() => {
      progress += 5;
      loadingBar.style.width = `${progress}%`;
      loadingText.textContent = `Loading... ${progress}%`;
      
      if (progress >= 100) {
        clearInterval(loadingInterval);
        this.onAssetsLoaded();
      }
    }, 100);
  }
  
  /**
   * Called when assets are loaded
   */
  onAssetsLoaded() {
    // Hide loading screen
    document.getElementById('loading-screen').classList.add('hidden');
    
    // Show character selection
    document.getElementById('character-select').classList.remove('hidden');
  }
  
  /**
   * Start the game
   */
  startGame() {
    const playerName = document.getElementById('player-name').value;
    const selectedClass = document.querySelector('.character-option.selected');
    
    if (!playerName || !selectedClass) {
      return;
    }
    
    const characterClass = selectedClass.getAttribute('data-class');
    
    // Set debug mode based on checkbox
    const debugCheckbox = document.getElementById('debug-mode');
    this.debugMode = debugCheckbox ? debugCheckbox.checked : false;
    
    // Hide character selection
    document.getElementById('character-select').classList.add('hidden');
    
    // Show game UI
    document.getElementById('game-ui').classList.remove('hidden');
    
    // Join the game
    this.network.joinGame(playerName, characterClass);
    
    // Start game loop
    this.isRunning = true;
    this.gameStarted = true;
    this.lastUpdateTime = performance.now();
    requestAnimationFrame(this.update);
  }
  
  /**
   * Main game update loop
   */
  update(timestamp) {
    if (!this.isRunning) return;
    
    // Calculate delta time
    this.deltaTime = timestamp - this.lastUpdateTime;
    this.lastUpdateTime = timestamp;
    
    // Skip update if game is paused
    if (this.isPaused) {
      requestAnimationFrame(this.update);
      return;
    }
    
    // Extra debugging to diagnose issues
    if (this.debugMode) {
      // Limit debug logging to once per second
      const now = Date.now();
      if (!this.lastDebugTime || now - this.lastDebugTime > 1000) {
        this.lastDebugTime = now;
        
        // Log player state
        console.log("Game update - Player exists:", !!this.player);
        if (this.player) {
          console.log("Player position:", this.player.position.x, this.player.position.y);
          console.log("Socket ID:", this.network.socket.id);
        } else {
          console.log("Waiting for player initialization...");
          console.log("Network connected:", this.network.connected);
          console.log("Socket ID:", this.network.socket ? this.network.socket.id : "No socket");
        }
        
        // Log game state
        console.log("Players in game:", this.players.size);
        console.log("Monsters in game:", this.monsters.size);
        
        // Check renderer status
        if (this.renderer) {
          console.log("Renderer initialized!");
          console.log("PIXI version:", PIXI.VERSION);
        } else {
          console.error("Renderer not initialized!");
        }
      }
    }
    
    // Update game objects
    this.updateGameObjects();
    
    // Render the game
    if (this.renderer) {
      this.renderer.render();
    }
    
    // Request next frame
    requestAnimationFrame(this.update);
  }
  
  /**
   * Update all game objects
   */
  updateGameObjects() {
    // Update player
    if (this.player) {
      this.player.update(this.deltaTime);
    }
    
    // Update other players
    for (const player of this.players.values()) {
      player.update(this.deltaTime);
    }
    
    // Update monsters
    for (const monster of this.monsters.values()) {
      monster.update(this.deltaTime);
    }
    
    // Update bosses
    for (const boss of this.bosses.values()) {
      boss.update(this.deltaTime);
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    CONFIG.GAME_WIDTH = window.innerWidth;
    CONFIG.GAME_HEIGHT = window.innerHeight;
    
    if (this.renderer) {
      this.renderer.resize();
    }
  }
  
  /**
   * Handle game state update from server
   * @param {Object} data - Game state data
   */
  handleGameState(data) {
    // Remove the frequent game state logging to prevent console spam
    // Only log player position updates when in debug mode, and only if player exists
    
    // Process players
    for (const id in data.players) {
      const playerData = data.players[id];
      
      // Check if this is the local player
      const isLocalPlayer = id === this.network.socket.id;
      
      if (isLocalPlayer) {
        // Update or create local player
        if (!this.player) {
          this.player = new Player(playerData);
          this.player.isLocalPlayer = true;
          
          // Also add the player to the players map - this ensures it shows in "Players in game" count
          this.players.set(id, this.player);
          
          // Debug info
          console.log("Local player created:", this.player);
          console.log("Starting position:", this.player.position.x, this.player.position.y);
          
          // Center camera on player
          if (this.renderer) {
            this.renderer.camera.x = this.player.position.x;
            this.renderer.camera.y = this.player.position.y;
            console.log("Camera centered on player at:", this.player.position.x, this.player.position.y);
          } else {
            console.error("Renderer not initialized when player was created!");
          }
        } else {
          // Update existing player (preserve isLocalPlayer flag)
          const wasLocalPlayer = this.player.isLocalPlayer;
          Object.assign(this.player, playerData);
          this.player.isLocalPlayer = wasLocalPlayer;
          
          // Make sure the player is still in the players map
          this.players.set(id, this.player);
        }
        
        // Update UI with player stats
        if (this.ui) {
          this.ui.updatePlayerStats();
        } else {
          console.warn("UI not initialized when updating player stats");
        }
      } else {
        // Handle other players
        if (this.players.has(id)) {
          // Update existing player
          const player = this.players.get(id);
          Object.assign(player, playerData);
          player.targetPosition = { ...player.position };
        } else {
          // Create new player
          const player = new Player(playerData);
          this.players.set(id, player);
          
          if (this.debugMode) {
            console.log(`Other player joined: ${player.name} (${id})`);
          }
        }
      }
    }
    
    // Process monsters
    for (const id in data.monsters) {
      const monsterData = data.monsters[id];
      
      if (this.monsters.has(id)) {
        // Update existing monster
        const monster = this.monsters.get(id);
        Object.assign(monster, monsterData);
        monster.targetPosition = { ...monster.position };
      } else {
        // Create new monster
        const monster = new Monster(monsterData);
        this.monsters.set(id, monster);
        
        if (this.debugMode) {
          console.log(`Monster added: ${monster.type} (${id})`);
        }
      }
    }
    
    // Process items
    for (const id in data.items) {
      const itemData = data.items[id];
      
      if (!this.items.has(id)) {
        // Create new item
        const item = new Item(itemData);
        this.items.set(id, item);
        
        if (this.debugMode) {
          console.log(`Item added: ${item.name} (${id})`);
        }
      }
    }
    
    // Remove players, monsters, and items that no longer exist
    this.cleanupEntities(data);
    
    // Log player position only occasionally (every 3 seconds) to reduce spam
    if (this.debugMode && this.player) {
      // Store the last time we logged position
      this.lastPositionLog = this.lastPositionLog || 0;
      const now = Date.now();
      
      // Only log every 3 seconds
      if (now - this.lastPositionLog > 3000) {
        console.log(`Player position: (${this.player.position.x.toFixed(1)}, ${this.player.position.y.toFixed(1)})`);
        this.lastPositionLog = now;
      }
    }
  }
  
  /**
   * Handle player joined event
   */
  handlePlayerJoined(data) {
    // If this is the local player
    if (!this.player) {
      this.player = new Player(data.player);
      this.player.isLocalPlayer = true;
      this.renderer.setPlayer(this.player);
      
      // Request world data
      this.network.requestWorldData();
    } else {
      // Add other player
      const newPlayer = new Player(data.player);
      this.players.set(data.playerId, newPlayer);
      this.renderer.addPlayer(newPlayer);
      
      // Show notification
      this.ui.showNotification(`${newPlayer.name} joined the game`);
    }
  }
  
  /**
   * Handle player left event
   */
  handlePlayerLeft(data) {
    if (this.players.has(data.playerId)) {
      const player = this.players.get(data.playerId);
      this.renderer.removePlayer(player);
      this.players.delete(data.playerId);
      
      // Show notification
      this.ui.showNotification(`${player.name} left the game`);
    }
  }
  
  /**
   * Handle combat event
   */
  handleCombatEvent(data) {
    // Find attacker and target
    let attacker = null;
    let target = null;
    
    // Check if attacker is player
    if (this.player && this.player.id === data.attackerId) {
      attacker = this.player;
    } else if (this.players.has(data.attackerId)) {
      attacker = this.players.get(data.attackerId);
    } else if (this.monsters.has(data.attackerId)) {
      attacker = this.monsters.get(data.attackerId);
    } else if (this.bosses.has(data.attackerId)) {
      attacker = this.bosses.get(data.attackerId);
    }
    
    // Check if target is player
    if (this.player && this.player.id === data.targetId) {
      target = this.player;
    } else if (this.players.has(data.targetId)) {
      target = this.players.get(data.targetId);
    } else if (this.monsters.has(data.targetId)) {
      target = this.monsters.get(data.targetId);
    } else if (this.bosses.has(data.targetId)) {
      target = this.bosses.get(data.targetId);
    }
    
    // If we found both attacker and target
    if (attacker && target) {
      // Update target health
      target.health = data.targetHealth;
      
      // Show damage text
      this.renderer.showDamageText(target.position.x, target.position.y, data.damage);
      
      // Play hit animation
      this.renderer.playHitAnimation(target);
    }
  }
  
  /**
   * Handle item pickup event
   */
  handleItemPickup(data) {
    // Add item to inventory
    if (this.player) {
      this.player.addItemToInventory(data);
      
      // Show notification
      this.ui.showNotification(`Picked up ${data.name}`);
      
      // Update inventory UI
      this.ui.updateInventory();
    }
  }
  
  /**
   * Handle player death event
   */
  handlePlayerDeath(data) {
    // Show death screen
    document.getElementById('death-screen').classList.remove('hidden');
    
    // Hide inventory if open
    document.getElementById('inventory-panel').classList.add('hidden');
    
    // Clear inventory
    if (this.player) {
      this.player.inventory = [];
      this.player.equipment = {
        weapon: null,
        head: null,
        body: null,
        legs: null,
        feet: null,
        hands: null,
        ring1: null,
        ring2: null,
        amulet: null
      };
    }
  }
  
  /**
   * Handle respawn button click
   */
  respawn() {
    // Hide death screen
    document.getElementById('death-screen').classList.add('hidden');
    
    // Update player position
    if (this.player) {
      this.player.position = { x: 0, y: 0 }; // Will be updated by server
    }
  }
  
  /**
   * Handle boss spawn event
   */
  handleBossSpawn(data) {
    // Show notification
    this.ui.showNotification(`${data.type} has appeared at ${data.landmarkName}!`, 'boss');
    
    // Play boss spawn sound
    // this.audio.playSound('boss-spawn');
  }
  
  /**
   * Handle boss kill event
   */
  handleBossKill(data) {
    // Show notification
    this.ui.showNotification(`${data.killerName} has defeated ${data.bossType}!`, 'boss-kill');
    
    // Play boss death sound
    // this.audio.playSound('boss-death');
  }
  
  /**
   * Toggle inventory panel
   */
  toggleInventory() {
    const inventoryPanel = document.getElementById('inventory-panel');
    
    if (inventoryPanel.classList.contains('hidden')) {
      inventoryPanel.classList.remove('hidden');
      this.ui.updateInventory();
    } else {
      inventoryPanel.classList.add('hidden');
    }
  }
  
  /**
   * Toggle pause state
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // Show pause menu
      this.ui.showPauseMenu();
    } else {
      // Hide pause menu
      this.ui.hidePauseMenu();
    }
  }
  
  /**
   * Remove entities that no longer exist in the game state
   * @param {Object} data - Game state data
   */
  cleanupEntities(data) {
    // Clean up players
    for (const playerId of this.players.keys()) {
      if (!data.players[playerId]) {
        if (this.debugMode) {
          console.log(`Removing player: ${playerId}`);
        }
        this.players.delete(playerId);
      }
    }
    
    // Clean up monsters
    for (const monsterId of this.monsters.keys()) {
      if (!data.monsters[monsterId]) {
        if (this.debugMode) {
          console.log(`Removing monster: ${monsterId}`);
        }
        this.monsters.delete(monsterId);
      }
    }
    
    // Clean up items
    for (const itemId of this.items.keys()) {
      if (!data.items[itemId]) {
        if (this.debugMode) {
          console.log(`Removing item: ${itemId}`);
        }
        this.items.delete(itemId);
      }
    }
  }
  
  /**
   * Force fallback rendering if PIXI fails
   * Creates a simple canvas renderer to show player position
   */
  forceFallbackRendering() {
    try {
      console.log("Attempting fallback rendering...");
      
      // Get the game container
      const container = document.getElementById('game-container');
      if (!container) {
        console.error("Game container not found for fallback rendering");
        return;
      }
      
      // Check if we already have a fallback canvas
      let canvas = container.querySelector('#fallback-canvas');
      if (!canvas) {
        // Create a new canvas
        canvas = document.createElement('canvas');
        canvas.id = 'fallback-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '100';
        container.appendChild(canvas);
      }
      
      // Get 2D context
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Failed to get 2D context for fallback rendering");
        return;
      }
      
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw coordinate grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      
      // Draw player if exists
      if (this.player) {
        // Calculate screen position (center player on screen)
        const screenX = canvas.width / 2;
        const screenY = canvas.height / 2;
        
        // Draw player as red square
        ctx.fillStyle = 'red';
        ctx.fillRect(screenX - 25, screenY - 25, 50, 50);
        
        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX - 25, screenY - 25, 50, 50);
        
        // Draw player coordinates
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Player (${Math.round(this.player.position.x)}, ${Math.round(this.player.position.y)})`, screenX, screenY - 35);
        
        // Draw world origin
        const originX = screenX - this.player.position.x;
        const originY = screenY - this.player.position.y;
        
        // Draw monsters if any
        this.monsters.forEach((monster) => {
          const monsterScreenX = originX + monster.position.x;
          const monsterScreenY = originY + monster.position.y;
          
          // Only draw if on screen
          if (monsterScreenX > -50 && monsterScreenX < canvas.width + 50 &&
              monsterScreenY > -50 && monsterScreenY < canvas.height + 50) {
            // Draw monster as green triangle
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.moveTo(monsterScreenX, monsterScreenY - 25);
            ctx.lineTo(monsterScreenX + 25, monsterScreenY + 25);
            ctx.lineTo(monsterScreenX - 25, monsterScreenY + 25);
            ctx.closePath();
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw monster label
            ctx.fillStyle = 'white';
            ctx.fillText(`Monster (${Math.round(monster.position.x)}, ${Math.round(monster.position.y)})`, monsterScreenX, monsterScreenY - 35);
          }
        });
      } else {
        // No player, draw message
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NO PLAYER FOUND!', canvas.width / 2, canvas.height / 2);
      }
      
      // Draw help text
      ctx.fillStyle = 'yellow';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('FALLBACK RENDERING ACTIVE - PIXI.js failed', 10, 20);
      ctx.fillText('Use WASD to move', 10, 50);
      
      console.log("Fallback rendering complete");
      
      // Schedule next render
      setTimeout(() => this.forceFallbackRendering(), 50);
    } catch (error) {
      console.error("Error in fallback rendering:", error);
    }
  }
} 