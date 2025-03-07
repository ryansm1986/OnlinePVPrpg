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
    this.handleProjectileCreated = this.handleProjectileCreated.bind(this);
    this.handleEffectEvent = this.handleEffectEvent.bind(this);
    this.handleWorldData = this.handleWorldData.bind(this);
  }
  
  /**
   * Initialize the game
   */
  init() {
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
        this.renderer.init();
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
      document.getElementById('error-message').textContent = error.message;
      document.getElementById('error-overlay').classList.remove('hidden');
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
   * Start the game
   */
  startGame() {
    console.log("Start game button clicked");
    const playerName = document.getElementById('player-name').value;
    const selectedClass = document.querySelector('.character-option.selected');
    
    if (!playerName || !selectedClass) {
      console.warn("Cannot start game: missing player name or character class");
      return;
    }
    
    const characterClass = selectedClass.getAttribute('data-class');
    console.log(`Starting game with name: ${playerName}, class: ${characterClass}`);
    
    // Set debug mode based on checkbox
    const debugCheckbox = document.getElementById('debug-mode');
    this.debugMode = debugCheckbox ? debugCheckbox.checked : false;
    console.log(`Debug mode: ${this.debugMode}`);
    
    try {
      // Hide character selection
      document.getElementById('character-select').classList.add('hidden');
      
      // Show game UI
      document.getElementById('game-ui').classList.remove('hidden');
      
      // Join the game
      console.log("Joining game via network...");
      this.network.joinGame(playerName, characterClass);
      
      // Start game loop
      this.isRunning = true;
      this.gameStarted = true;
      this.lastUpdateTime = performance.now();
      requestAnimationFrame(this.update);
      console.log("Game started successfully");
    } catch (error) {
      console.error("Error starting game:", error);
    }
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
        monster.update(this.deltaTime);
      }
    });
  }
  
  /**
   * Check for collisions between a player and terrain features
   * @param {Object} player - The player to check
   * @param {Object} prevPosition - The player's previous position
   */
  checkTerrainCollisions(player, prevPosition) {
    // Skip if renderer doesn't exist or no terrain features
    if (!this.renderer || !this.renderer.terrainFeatures) return;
    
    // Player collision radius (half their size)
    const playerRadius = CONFIG.PLAYER_SIZE / 2;
    
    // Check each terrain feature
    let hasCollision = false;
    
    // Only check terrain features that are close to the player for efficiency
    // This is much more efficient than checking all features, especially with a large world
    for (const feature of this.renderer.terrainFeatures) {
      // Skip checking features that are too far away
      const maxDistance = playerRadius + Math.max(feature.radius, 20);
      const dx = player.position.x - feature.position.x;
      const dy = player.position.y - feature.position.y;
      
      // Quick check with squared distance (avoids expensive sqrt)
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared > maxDistance * maxDistance) {
        continue;
      }
      
      // More precise distance calculation
      const distance = Math.sqrt(distanceSquared);
      
      // Check if collision occurs
      if (distance < (playerRadius + feature.radius)) {
        hasCollision = true;
        break;
      }
    }
    
    // If collision detected, revert to previous position
    if (hasCollision) {
      player.position.x = prevPosition.x;
      player.position.y = prevPosition.y;
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
          Object.assign(player, playerData);
          player.targetPosition = { ...player.position };
        } else {
          // Create new player
          const player = new Player(playerData);
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
        Object.assign(monster, monsterData);
        monster.targetPosition = { ...monster.position };
      } else {
        // Create new monster
        const monster = new Monster(monsterData);
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
  }
} 