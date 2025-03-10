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
    this.debugMode = true; // Enable debug mode to monitor memory usage
    
    // Memory monitoring
    this.memoryMonitoring = {
      enabled: true,
      interval: null,
      intervalTime: 10000, // Check every 10 seconds
      lastMemory: 0,
      memoryHistory: [],
      maxHistorySize: 10
    };
    
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
    this.handleProjectileCreated = this.handleProjectileCreated.bind(this);
    this.handleEffectEvent = this.handleEffectEvent.bind(this);
    this.handleWorldData = this.handleWorldData.bind(this);
    this.monitorMemory = this.monitorMemory.bind(this);
  }
  
  /**
   * Monitor memory usage for debugging
   */
  monitorMemory() {
    if (!this.memoryMonitoring.enabled) return;
    
    try {
      // Get current memory info if available
      if (window.performance && window.performance.memory) {
        const memoryInfo = window.performance.memory;
        const usedHeapSize = Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024));
        const totalHeapSize = Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024));
        const heapLimit = Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024));
        
        // Calculate memory change since last check
        const change = usedHeapSize - this.memoryMonitoring.lastMemory;
        this.memoryMonitoring.lastMemory = usedHeapSize;
        
        // Add to history
        this.memoryMonitoring.memoryHistory.push({
          timestamp: Date.now(),
          used: usedHeapSize,
          change: change
        });
        
        // Trim history to max size
        if (this.memoryMonitoring.memoryHistory.length > this.memoryMonitoring.maxHistorySize) {
          this.memoryMonitoring.memoryHistory.shift();
        }
        
        // Check for significant memory increase
        if (Math.abs(change) > 5) { // More than 5MB change
          console.warn(`Memory change detected: ${change > 0 ? '+' : ''}${change}MB (${usedHeapSize}MB / ${totalHeapSize}MB, limit: ${heapLimit}MB)`);
        } else {
          console.log(`Memory usage: ${usedHeapSize}MB / ${totalHeapSize}MB (limit: ${heapLimit}MB)`);
        }
        
        // Check if memory is approaching limit
        if (usedHeapSize > heapLimit * 0.8) {
          console.error(`WARNING: Memory usage is high (${usedHeapSize}MB / ${heapLimit}MB limit)!`);
          
          // Try to force garbage collection if possible
          if (window.gc) {
            console.log("Attempting to force garbage collection");
            window.gc();
          }
        }
      } else {
        console.log("Memory monitoring not available in this browser");
      }
    } catch (error) {
      console.error("Error monitoring memory:", error);
    }
  }
  
  /**
   * Initialize the game
   */
  async init() {
    try {
      // Create game systems with proper error handling
      try {
        this.renderer = new Renderer(this);
        console.log("Renderer created successfully");
      } catch (rendererError) {
        console.error("Failed to create Renderer:", rendererError);
        // Create a minimal renderer stub to prevent null references
        this.renderer = {
          init: function() { console.log("Stub renderer init called"); },
          render: function() { console.log("Stub renderer render called"); }
        };
      }
      
      // Create other systems
      this.network = new Network(this);
      this.input = new Input(this);
      this.ui = new UI(this);
      
      // Try to initialize systems
      try {
        await this.renderer.init();
        this.network.init();
        this.input.init();
        this.ui.init();
        
        // Set up event listeners
        console.log("Setting up event listeners...");
        this.setupEventListeners();
        
        // Start the game loop
        this.lastUpdateTime = performance.now();
        requestAnimationFrame(this.update);
        
        // Mark game as running
        this.isRunning = true;
        
        // Start memory monitoring
        if (this.memoryMonitoring.enabled) {
          // Initial memory check
          this.monitorMemory();
          
          // Set up periodic memory monitoring
          this.memoryMonitoring.interval = setInterval(this.monitorMemory, this.memoryMonitoring.intervalTime);
          console.log(`Memory monitoring started (interval: ${this.memoryMonitoring.intervalTime}ms)`);
        }
        
        // Load assets and show character selection screen
        console.log("Starting asset loading...");
        this.loadAssets();
        
        // Debug message
        console.log("Game initialized successfully!");
      } catch (initError) {
        console.error("Error during initialization:", initError);
        throw new Error("Failed to initialize game systems");
      }
    } catch (error) {
      console.error("Critical error during game initialization:", error);
      
      // Safely show error to user, using multiple fallbacks
      try {
        // Try UI error first
        if (this.ui && typeof this.ui.showError === 'function') {
          this.ui.showError(error.message || "Game initialization failed");
        } else {
          // Try direct DOM manipulation
          const errorMessage = document.getElementById('error-message');
          const errorOverlay = document.getElementById('error-overlay');
          
          if (errorMessage && errorOverlay) {
            errorMessage.textContent = error.message || "Game initialization failed";
            errorOverlay.classList.remove('hidden');
          } else {
            // Last resort: alert
            alert("Game initialization failed: " + (error.message || "Unknown error"));
          }
        }
      } catch (displayError) {
        // Absolutely last resort
        console.error("Failed to display error:", displayError);
        alert("Critical error occurred. Please check console for details.");
      }
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
    this.network.on('projectileCreated', this.handleProjectileCreated);
    this.network.on('effectEvent', this.handleEffectEvent);
    this.network.on('worldData', this.handleWorldData);
    
    // UI events
    document.getElementById('start-game').addEventListener('click', () => {
      this.startGame();
    });
    
    document.getElementById('respawn-button').addEventListener('click', () => {
      this.respawn();
    });
    
    // Character selection
    const characterOptions = document.querySelectorAll('.character-option');
    console.log(`Found ${characterOptions.length} character options for selection`);
    
    // Function to handle character selection
    const handleCharacterSelection = (option) => {
      console.log(`Character option selected: ${option.getAttribute('data-class')}`);
      // Remove selected class from all options
      characterOptions.forEach(opt => opt.classList.remove('selected'));
      // Add selected class to clicked option
      option.classList.add('selected');
      
      // Enable start button if name is also entered
      this.checkStartButtonState();
    };
    
    // Add click event to the entire character option card
    characterOptions.forEach(option => {
      option.addEventListener('click', () => {
        handleCharacterSelection(option);
      });
    });
    
    // Also add click events to the character previews for redundancy
    const characterPreviews = document.querySelectorAll('.character-preview');
    characterPreviews.forEach(preview => {
      preview.addEventListener('click', (e) => {
        // Find the parent character option
        const parentOption = preview.closest('.character-option');
        if (parentOption) {
          handleCharacterSelection(parentOption);
        }
        
        // Stop event propagation to prevent double-handling
        e.stopPropagation();
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
    
    const nameEntered = nameInput && nameInput.value && nameInput.value.trim().length > 0;
    const classSelected = selectedClass !== null;
    
    console.log(`Start button state check - Name entered: ${nameEntered}, Class selected: ${classSelected}`);
    
    if (startButton) {
      startButton.disabled = !nameEntered || !classSelected;
      console.log(`Start button is now ${startButton.disabled ? 'disabled' : 'enabled'}`);
    } else {
      console.error("Start button element not found!");
    }
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
    try {
      console.log("Assets loaded, showing character select screen");
      
      // Hide loading screen
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
      } else {
        console.error("Loading screen element not found");
      }
      
      // Show character selection
      const characterSelect = document.getElementById('character-select');
      if (characterSelect) {
        characterSelect.classList.remove('hidden');
        console.log("Character select screen shown");
      } else {
        console.error("Character select element not found");
      }
    } catch (error) {
      console.error("Error in onAssetsLoaded:", error);
    }
  }
  
  /**
   * Start the game with selected character
   */
  startGame() {
    // Get selected character class and player name
    const selectedOption = document.querySelector('.character-option.selected');
    const playerName = document.getElementById('player-name').value.trim();
    
    if (!selectedOption || !playerName) {
      console.warn("Cannot start game: missing player selection or name");
      this.ui.showError("Please select a character and enter your name.");
      return;
    }
    
    // Get the character class from the selected option
    const characterClass = selectedOption.getAttribute('data-class');
    
    // Check for debug mode
    this.debugMode = document.getElementById('debug-mode').checked;
    if (this.debugMode) {
      console.log("Debug mode enabled");
    }
    
    // Show loading state
    const startButton = document.getElementById('start-game');
    const originalText = startButton.textContent;
    startButton.disabled = true;
    startButton.textContent = "Connecting...";
    
    // Ensure network is connected
    if (!this.network.connected) {
      console.log("Network not connected, attempting to connect...");
      
      // Set up one-time event handlers for connection attempt
      const handleConnectionSuccess = () => {
        this.network.off('connected', handleConnectionSuccess);
        this.network.off('connectionFailed', handleConnectionFailure);
        
        startButton.disabled = false;
        startButton.textContent = originalText;
        
        // Proceed with game start
        this.completeGameStart(playerName, characterClass);
      };
      
      const handleConnectionFailure = () => {
        this.network.off('connected', handleConnectionSuccess);
        this.network.off('connectionFailed', handleConnectionFailure);
        
        startButton.disabled = false;
        startButton.textContent = originalText;
        
        this.ui.showError("Unable to connect to the game server. Please check your internet connection and try again.");
      };
      
      // Register event handlers
      this.network.on('connected', handleConnectionSuccess);
      this.network.on('connectionFailed', handleConnectionFailure);
      
      // Attempt to connect
      this.network.init();
    } else {
      // Already connected, proceed with game start
      this.completeGameStart(playerName, characterClass);
    }
  }
  
  /**
   * Complete the game start process after ensuring network connectivity
   * @param {string} playerName - The player's name
   * @param {string} characterClass - The character's class
   */
  completeGameStart(playerName, characterClass) {
    // Hide character selection
    document.getElementById('character-select').classList.add('hidden');
    
    // Show game UI with loading state
    const gameUI = document.getElementById('game-ui');
    gameUI.classList.remove('hidden');
    this.ui.showLoading("Joining game...");
    
    // Attempt to join the game
    console.log("Attempting to join game...");
    this.network.joinGame(playerName, characterClass)
      .then(() => {
        // Successfully joined
        this.ui.hideLoading();
        
        // Start game loop
        this.isRunning = true;
        this.gameStarted = true;
        this.lastUpdateTime = performance.now();
        requestAnimationFrame(this.update);
        
        console.log("Game started successfully");
      })
      .catch(error => {
        console.error("Failed to join game:", error);
        
        // Show error and return to character selection
        this.ui.hideLoading();
        this.ui.showError(error.message);
        
        document.getElementById('character-select').classList.remove('hidden');
        gameUI.classList.add('hidden');
      });
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
      // Store previous position to restore if collision occurs
      const prevPosition = { 
        x: this.player.position.x, 
        y: this.player.position.y 
      };
      
      this.player.update(this.deltaTime);
      
      // Check for collision with terrain features after movement
      this.checkTerrainCollisions(this.player, prevPosition);
      
      // Initialize projectiles array if it doesn't exist
      if (!this.player.projectiles) {
        this.player.projectiles = [];
      }
      
      // Update player projectiles
      this.updateProjectiles(this.player);
    }
    
    // Update other players
    this.players.forEach(player => {
      // Only apply terrain collision for the current player (server handles other players)
      if (player === this.player) return;
      
      player.update(this.deltaTime);
      
      // Initialize projectiles array if it doesn't exist
      if (!player.projectiles) {
        player.projectiles = [];
      }
      
      // Update projectiles for other players
      this.updateProjectiles(player);
    });
    
    // Update monsters
    this.monsters.forEach(monster => {
      if (monster.update) {
        // Store previous position to restore if collision occurs
        const prevPosition = { 
          x: monster.position.x, 
          y: monster.position.y 
        };
        
        // Update base monster properties
        monster.update(this.deltaTime);
        
        // AI: Make monsters move toward nearby players
        this.updateMonsterAI(monster);
        
        // Collision detection to prevent overlapping
        this.checkMonsterCollisions(monster, prevPosition);
      }
    });
    
    // Clean up inactive projectiles to prevent memory buildup
    this.cleanupProjectiles();
  }
  
  /**
   * Update monster AI to move toward nearby players
   * @param {Object} monster - The monster to update
   */
  updateMonsterAI(monster) {
    // Skip if monster is dead
    if (monster.isDead) return;
    
    // Find closest player
    let closestPlayer = null;
    let closestDistance = Infinity;
    
    // Check local player first
    if (this.player && !this.player.isDead) {
      const dx = this.player.position.x - monster.position.x;
      const dy = this.player.position.y - monster.position.y;
      const distSq = dx * dx + dy * dy;
      
      closestPlayer = this.player;
      closestDistance = distSq;
    }
    
    // Check other players
    this.players.forEach(player => {
      if (player === this.player || player.isDead) return;
      
      const dx = player.position.x - monster.position.x;
      const dy = player.position.y - monster.position.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < closestDistance) {
        closestPlayer = player;
        closestDistance = distSq;
      }
    });
    
    // Only follow players within detection radius
    const DETECTION_RADIUS = 200;
    const ATTACK_RADIUS = 60; // Radius within which monsters will attack
    const FOLLOW_SPEED = 0.3; // Slow movement speed
    
    if (closestPlayer && closestDistance < DETECTION_RADIUS * DETECTION_RADIUS) {
      // Determine if we should attack based on distance
      const dist = Math.sqrt(closestDistance);
      
      // Attack if close enough and not already attacking
      if (dist < ATTACK_RADIUS && !monster.isAttacking) {
        monster.isAttacking = true;
        monster.attackDirection = monster.facingDirection;
        
        // Set attack duration - simulate server behavior
        const ATTACK_DURATION = 1000; // 1 second attack animation
        
        // Reset attack state after duration
        setTimeout(() => {
          monster.isAttacking = false;
        }, ATTACK_DURATION);
        
        // Only move if not attacking
        return;
      }
      
      // If attacking, don't move
      if (monster.isAttacking) return;
      
      // Calculate direction to player
      const dx = closestPlayer.position.x - monster.position.x;
      const dy = closestPlayer.position.y - monster.position.y;
      
      // Normalize direction and apply speed
      const moveX = (dx / dist) * FOLLOW_SPEED * this.deltaTime / 16;
      const moveY = (dy / dist) * FOLLOW_SPEED * this.deltaTime / 16;
      
      // Update monster's target position for smooth movement
      monster.targetPosition.x = monster.position.x + moveX;
      monster.targetPosition.y = monster.position.y + moveY;
      
      // Update facing direction
      if (Math.abs(dx) > Math.abs(dy)) {
        monster.facingDirection = dx > 0 ? 'right' : 'left';
      } else {
        monster.facingDirection = dy > 0 ? 'down' : 'up';
      }
    }
  }
  
  /**
   * Check for collisions between monsters and other entities
   * @param {Object} monster - The monster to check
   * @param {Object} prevPosition - The monster's previous position
   */
  checkMonsterCollisions(monster, prevPosition) {
    // Skip if monster is dead
    if (monster.isDead) return;
    
    // Monster collision radius
    const monsterRadius = monster.width / 2 || 16;
    
    // Check collision with terrain
    this.checkTerrainCollisions(monster, prevPosition);
    
    // Check collision with player
    if (this.player && !this.player.isDead) {
      const playerRadius = CONFIG.PLAYER_SIZE / 2;
      const dx = monster.position.x - this.player.position.x;
      const dy = monster.position.y - this.player.position.y;
      const distSq = dx * dx + dy * dy;
      const minDist = monsterRadius + playerRadius;
      
      if (distSq < minDist * minDist) {
        // Collision detected, move back to previous position
        monster.position.x = prevPosition.x;
        monster.position.y = prevPosition.y;
        return;
      }
    }
    
    // Check collision with other monsters
    this.monsters.forEach(otherMonster => {
      if (monster === otherMonster || otherMonster.isDead) return;
      
      const otherRadius = otherMonster.width / 2 || 16;
      const dx = monster.position.x - otherMonster.position.x;
      const dy = monster.position.y - otherMonster.position.y;
      const distSq = dx * dx + dy * dy;
      const minDist = monsterRadius + otherRadius;
      
      if (distSq < minDist * minDist) {
        // Collision detected, move back to previous position
        monster.position.x = prevPosition.x;
        monster.position.y = prevPosition.y;
        return;
      }
    });
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
          
          // Center camera on player
          if (this.renderer) {
            this.renderer.camera.x = this.player.position.x;
            this.renderer.camera.y = this.player.position.y;
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
        }
      } else {
        // Handle other players
        if (this.players.has(id)) {
          // Update existing player
          const player = this.players.get(id);
          
          // Store current position before updating
          const prevPosition = { ...player.position };
          
          // Update player data
          Object.assign(player, playerData);
          
          // Set target position to the new position for interpolation
          player.targetPosition = { ...player.position };
          
          // Set current position back to previous position for smooth interpolation
          player.position = prevPosition;
        } else {
          // Create new player
          const player = new Player(playerData);
          // Initialize targetPosition for newly created players
          player.targetPosition = { ...player.position };
          this.players.set(id, player);
        }
      }
    }
    
    // Process monsters
    for (const id in data.monsters) {
      const monsterData = data.monsters[id];
      
      if (this.monsters.has(id)) {
        // Update existing monster
        const monster = this.monsters.get(id);
        
        // Store current position before updating
        const prevPosition = { ...monster.position };
        
        // Update monster data
        Object.assign(monster, monsterData);
        
        // Set target position to the new position for interpolation
        monster.targetPosition = { ...monster.position };
        
        // Set current position back to previous position for smooth interpolation
        monster.position = prevPosition;
      } else {
        // Create new monster
        const monster = new Monster(monsterData);
        // Initialize targetPosition for newly created monsters
        monster.targetPosition = { ...monster.position };
        this.monsters.set(id, monster);
      }
    }
    
    // Process items
    for (const id in data.items) {
      const itemData = data.items[id];
      
      if (!this.items.has(id)) {
        // Create new item
        const item = new Item(itemData);
        this.items.set(id, item);
      }
    }
    
    // Add projectiles to players if they exist
    if (data.projectiles) {
      // Process player projectiles
      data.projectiles.forEach(projectileData => {
        // Find the owner player
        if (this.player && projectileData.ownerId === this.player.id) {
          if (!this.player.projectiles) {
            this.player.projectiles = [];
          }
          
          // Check if projectile already exists locally
          const existingIdx = this.player.projectiles.findIndex(p => p.id === projectileData.id);
          
          if (existingIdx === -1) {
            // Add new projectile
            this.player.projectiles.push(projectileData);
          } else {
            // Update existing projectile
            this.player.projectiles[existingIdx] = {
              ...this.player.projectiles[existingIdx],
              ...projectileData
            };
          }
        } 
        else if (this.players.has(projectileData.ownerId)) {
          const player = this.players.get(projectileData.ownerId);
          
          if (!player.projectiles) {
            player.projectiles = [];
          }
          
          // Check if projectile already exists locally
          const existingIdx = player.projectiles.findIndex(p => p.id === projectileData.id);
          
          if (existingIdx === -1) {
            // Add new projectile
            player.projectiles.push(projectileData);
          } else {
            // Update existing projectile
            player.projectiles[existingIdx] = {
              ...player.projectiles[existingIdx],
              ...projectileData
            };
          }
        }
      });
    }
    
    // Clean up expired projectiles
    this.cleanupProjectiles();
    
    // Remove players, monsters, and items that no longer exist
    this.cleanupEntities(data);
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
    try {
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
        
        // Show damage text if renderer has the method
        if (this.renderer && typeof this.renderer.showDamageText === 'function') {
          this.renderer.showDamageText(target.position.x, target.position.y, data.damage);
        } else {
          console.warn("Could not show damage text: method not available");
        }
        
        // Play hit animation if renderer has the method
        if (this.renderer && typeof this.renderer.playHitAnimation === 'function') {
          this.renderer.playHitAnimation(target);
        } else {
          console.warn("Could not play hit animation: method not available");
        }
      }
    } catch (error) {
      console.error("Error handling combat event:", error);
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
        this.players.delete(playerId);
      }
    }
    
    // Clean up monsters
    for (const monsterId of this.monsters.keys()) {
      if (!data.monsters[monsterId]) {
        this.monsters.delete(monsterId);
      }
    }
    
    // Clean up items
    for (const itemId of this.items.keys()) {
      if (!data.items[itemId]) {
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
      
      // Schedule next render
      setTimeout(() => this.forceFallbackRendering(), 50);
    } catch (error) {
      console.error("Error in fallback rendering:", error);
    }
  }
  
  /**
   * Handle projectile creation event
   * @param {Object} data - Projectile data
   */
  handleProjectileCreated(data) {
    // Safety check for required data
    if (!data || !data.id || !data.ownerId) {
      console.error("Invalid projectile data received:", data);
      return;
    }

    // Find the owner player
    let owner = null;
    
    if (this.player && data.ownerId === this.player.id) {
      owner = this.player;
    } else if (this.players.has(data.ownerId)) {
      owner = this.players.get(data.ownerId);
    }
    
    if (owner) {
      // Initialize projectiles array if it doesn't exist
      if (!owner.projectiles) {
        owner.projectiles = [];
      }
      
      // Add the new projectile with safe defaults for any missing properties
      owner.projectiles.push({
        id: data.id,
        ownerId: data.ownerId,
        type: data.type || 'default',
        position: data.position || { x: owner.position.x, y: owner.position.y },
        velocity: data.velocity || { x: 0, y: 0 },
        angle: data.angle || 0,
        width: data.width || (data.type === 'fireball' ? 24 : 16),
        height: data.height || (data.type === 'fireball' ? 24 : 8),
        active: true,
        createdAt: Date.now(),
        isSkill: data.isSkill || false
      });
    }
  }
  
  /**
   * Handle special effects like explosions
   * @param {Object} data - Effect data
   */
  handleEffectEvent(data) {
    if (data.type === 'explosion') {
      // Show explosion effect
      this.renderer.showExplosionEffect(data.position, data.radius);
    }
  }
  
  /**
   * Update projectiles for a player
   * @param {Object} player - Player object
   */
  updateProjectiles(player) {
    // Skip if no projectiles
    if (!player.projectiles || player.projectiles.length === 0) {
      return;
    }
    
    // Always use CONFIG for world bounds instead of default 1000
    const worldWidth = CONFIG.WORLD_WIDTH;
    const worldHeight = CONFIG.WORLD_HEIGHT;
    
    // Update projectile positions
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const projectile = player.projectiles[i];
      
      // Skip inactive projectiles
      if (!projectile.active) {
        continue;
      }
      
      // Update position based on velocity
      projectile.position.x += projectile.velocity.x * this.deltaTime;
      projectile.position.y += projectile.velocity.y * this.deltaTime;
      
      // Check if projectile is out of bounds (world size)
      if (projectile.position.x < 0 || 
          projectile.position.x > worldWidth ||
          projectile.position.y < 0 || 
          projectile.position.y > worldHeight) {
        projectile.active = false;
      }
      
      // Check lifespan
      const age = Date.now() - projectile.createdAt;
      if (age > 2000) { // 2 second lifespan
        projectile.active = false;
        
        // Check for explosion effect
        if (projectile.type === 'fireball') {
          this.renderer.showExplosionEffect(projectile.position, 50);
        }
      }
    }
  }
  
  /**
   * Clean up expired projectiles
   */
  cleanupProjectiles() {
    // Clean up local player projectiles
    if (this.player && this.player.projectiles) {
      this.player.projectiles = this.player.projectiles.filter(p => p.active);
    }
    
    // Clean up other players' projectiles
    this.players.forEach(player => {
      if (player.projectiles) {
        player.projectiles = player.projectiles.filter(p => p.active);
      }
    });
  }
  
  /**
   * Handle world data received from server
   * @param {Object} data - World data
   */
  handleWorldData(data) {
    // Initialize or update world properties
    if (!this.world) {
      this.world = {};
    }
    
    // Update world properties - use CONFIG values as the source of truth, but consider server values
    this.world.width = CONFIG.WORLD_WIDTH;
    this.world.height = CONFIG.WORLD_HEIGHT;
    this.world.biomes = data.biomes || [];
    this.world.exits = data.exits || [];
    this.world.landmarks = data.landmarks || [];
    
    // Ensure the world width/height matches the CONFIG
    if (data.width !== CONFIG.WORLD_WIDTH || data.height !== CONFIG.WORLD_HEIGHT) {
      console.warn("Server world size differs from client CONFIG. Using client CONFIG values:", 
                  CONFIG.WORLD_WIDTH + "x" + CONFIG.WORLD_HEIGHT);
    }
    
    // Log world initialization
    console.log("World data initialized - Width:", this.world.width, "Height:", this.world.height);
    
    // Set a timeout to ensure the terrain features are generated before spawning skeletons
    setTimeout(() => {
      // Spawn some skeleton monsters around the map
      this.spawnSkeletons(10); // Spawn 10 skeletons
    }, 1000);
  }
  
  /**
   * Properly shutdown the game and clean up resources
   */
  shutdown() {
    try {
      console.log("Game shutting down - cleaning up resources");
      
      // Set flag to stop the game loop
      this.isRunning = false;
      
      // Stop memory monitoring
      if (this.memoryMonitoring.interval) {
        clearInterval(this.memoryMonitoring.interval);
        this.memoryMonitoring.interval = null;
        console.log("Memory monitoring stopped");
      }
      
      // Final memory monitoring report
      if (this.memoryMonitoring.enabled) {
        console.log("Memory history during gameplay:");
        this.memoryMonitoring.memoryHistory.forEach(entry => {
          const date = new Date(entry.timestamp);
          const timeStr = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
          console.log(`[${timeStr}] Used: ${entry.used}MB, Change: ${entry.change > 0 ? '+' : ''}${entry.change}MB`);
        });
      }
      
      // Clean up renderer resources
      if (this.renderer && typeof this.renderer.destroy === 'function') {
        this.renderer.destroy();
      }
      
      // Clean up network connections
      if (this.network && typeof this.network.disconnect === 'function') {
        this.network.disconnect();
      }
      
      // Remove event listeners
      window.removeEventListener('resize', this.handleResize);
      
      // Try to force garbage collection if available
      if (window.gc) {
        console.log("Forcing garbage collection");
        window.gc();
      }
      
      console.log("Game resources cleaned up successfully");
    } catch (error) {
      console.error("Error during game shutdown:", error);
    }
  }
  
  /**
   * Check for collisions between an entity and terrain features
   * @param {Object} entity - The entity to check (player or monster)
   * @param {Object} prevPosition - The entity's previous position
   */
  checkTerrainCollisions(entity, prevPosition) {
    // Skip if renderer doesn't exist or no terrain features
    if (!this.renderer || !this.renderer.terrainFeatures) return;
    
    // Entity collision radius (half their size)
    const entityRadius = entity.width / 2 || CONFIG.PLAYER_SIZE / 2;
    
    // Check each terrain feature
    let hasCollision = false;
    
    // Only check terrain features that are close to the entity for efficiency
    for (const feature of this.renderer.terrainFeatures) {
      // Calculate distance between entity and feature
      const dx = entity.position.x - feature.position.x;
      const dy = entity.position.y - feature.position.y;
      const distanceSquared = dx * dx + dy * dy;
      
      // Different collision handling based on feature type
      if (feature.type === 'tree') {
        // Use a much larger collision radius for trees
        const treeCollisionRadius = feature.radius * 1.5;
        const collisionThresholdSquared = Math.pow(entityRadius + treeCollisionRadius, 2);
        
        // Check for tree collision with squared distance (more efficient)
        if (distanceSquared < collisionThresholdSquared) {
          hasCollision = true;
          break;
        }
      } else {
        // For non-tree objects, use standard collision detection
        const maxDistance = entityRadius + feature.radius;
        
        // Skip if obviously too far
        if (distanceSquared > maxDistance * maxDistance * 1.5) {
          continue;
        }
        
        // More precise check
        const distance = Math.sqrt(distanceSquared);
        if (distance < (entityRadius + feature.radius - 2)) { // Small forgiveness for rocks
          hasCollision = true;
          break;
        }
      }
    }
    
    // If collision detected, revert to previous position
    if (hasCollision) {
      entity.position.x = prevPosition.x;
      entity.position.y = prevPosition.y;
    }
  }
  
  /**
   * Spawn skeleton monsters at random positions on the map
   * @param {number} count - Number of skeletons to spawn
   */
  spawnSkeletons(count = 5) {
    // Skip if renderer doesn't have terrain features (world may not be initialized)
    if (!this.renderer || !this.renderer.terrainFeatures) {
      console.warn("Cannot spawn skeletons - world not fully initialized");
      return;
    }
    
    const worldWidth = CONFIG.WORLD_WIDTH;
    const worldHeight = CONFIG.WORLD_HEIGHT;
    
    // Create unique IDs for the skeletons
    const baseId = Date.now().toString();
    
    for (let i = 0; i < count; i++) {
      // Create a unique ID
      const skeletonId = `skeleton_${baseId}_${i}`;
      
      // Find a valid spawn position
      let validPosition = false;
      let x, y;
      let attempts = 0;
      
      // Try up to 20 times to find a valid position
      while (!validPosition && attempts < 20) {
        attempts++;
        
        // Generate random position, keeping away from edges
        x = 100 + Math.random() * (worldWidth - 200);
        y = 100 + Math.random() * (worldHeight - 200);
        
        // Check distance from player to avoid spawning too close
        let tooCloseToPlayer = false;
        if (this.player) {
          const dx = this.player.position.x - x;
          const dy = this.player.position.y - y;
          const distSq = dx * dx + dy * dy;
          
          // Don't spawn within 300 pixels of player
          if (distSq < 300 * 300) {
            tooCloseToPlayer = true;
          }
        }
        
        // Check collision with terrain
        let collides = false;
        for (const feature of this.renderer.terrainFeatures) {
          const dx = feature.position.x - x;
          const dy = feature.position.y - y;
          const distSq = dx * dx + dy * dy;
          
          // Use a larger collision radius to avoid spawning too close to terrain
          const collisionRadius = feature.radius * 2;
          if (distSq < collisionRadius * collisionRadius) {
            collides = true;
            break;
          }
        }
        
        validPosition = !tooCloseToPlayer && !collides;
      }
      
      // If we couldn't find a valid position after 20 attempts, skip this skeleton
      if (!validPosition) {
        console.warn(`Could not find valid position for skeleton ${i+1} after 20 attempts`);
        continue;
      }
      
      // Create the skeleton monster
      const skeleton = {
        id: skeletonId,
        type: 'Skeleton',
        position: { x, y },
        facingDirection: ['down', 'up', 'left', 'right'][Math.floor(Math.random() * 4)],
        health: 50,
        maxHealth: 50,
        isAttacking: false,
        width: 48,
        height: 48,
        state: 'idle'
      };
      
      // Create a Monster instance and add it to the monsters map
      const monsterInstance = new Monster(skeleton);
      this.monsters.set(skeletonId, monsterInstance);
      
      console.log(`Spawned skeleton at (${Math.round(x)}, ${Math.round(y)})`);
    }
    
    console.log(`Spawned ${count} skeletons on the map`);
  }
} 