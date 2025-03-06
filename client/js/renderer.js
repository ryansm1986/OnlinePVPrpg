/**
 * Renderer class
 * Handles rendering the game using PixiJS
 */
class Renderer {
  /**
   * Create a new Renderer instance
   * @param {Game} game - Reference to the game
   */
  constructor(game) {
    this.game = game;
    
    // PixiJS application
    this.app = null;
    
    // Camera
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    };
    
    // Containers
    this.worldContainer = null;
    this.uiContainer = null;
    this.minimapContainer = null;
    
    // Layers
    this.groundLayer = null;
    this.itemLayer = null;
    this.entityLayer = null;
    this.effectLayer = null;
    
    // Sprite maps
    this.playerSprites = new Map();
    this.monsterSprites = new Map();
    this.bossSprites = new Map();
    this.itemSprites = new Map();
    
    // Textures
    this.textures = {
      player: {},
      monster: {},
      boss: {},
      item: {},
      tile: {},
      effect: {}
    };
    
    // Bind methods
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
  }
  
  /**
   * Initialize the renderer
   */
  init() {
    try {
      console.log("Initializing renderer...");
      
      // Make sure PIXI is loaded
      if (typeof PIXI === 'undefined') {
        console.error("CRITICAL: PIXI.js is not loaded!");
        return;
      }
      
      // Create PixiJS application
      this.app = new PIXI.Application({
        width: CONFIG.GAME_WIDTH,
        height: CONFIG.GAME_HEIGHT,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
      
      console.log("PIXI Application created, adding to DOM...");
      
      // Get the game container
      const gameContainer = document.getElementById('game-container');
      if (!gameContainer) {
        console.error("CRITICAL: Game container element not found!");
        return;
      }
      
      // Add canvas to DOM
      gameContainer.prepend(this.app.view);
      
      console.log("Canvas added to DOM, creating containers...");
      
      // Create containers
      this.createContainers();
      
      // Load textures
      this.loadTextures();
      
      // Set up resize handler
      window.addEventListener('resize', this.resize);
      
      console.log("Renderer initialization complete!");
    } catch (error) {
      console.error("CRITICAL: Error initializing renderer:", error);
    }
  }
  
  /**
   * Create containers for organizing sprites
   */
  createContainers() {
    try {
      console.log("Creating rendering containers...");
      
      // World container (affected by camera)
      this.worldContainer = new PIXI.Container();
      this.app.stage.addChild(this.worldContainer);
      
      // Create layers
      this.groundLayer = new PIXI.Container();
      this.itemLayer = new PIXI.Container();
      this.entityLayer = new PIXI.Container();
      this.effectLayer = new PIXI.Container();
      
      // Add layers to world container
      this.worldContainer.addChild(this.groundLayer);
      this.worldContainer.addChild(this.itemLayer);
      this.worldContainer.addChild(this.entityLayer);
      this.worldContainer.addChild(this.effectLayer);
      
      // UI container (not affected by camera)
      this.uiContainer = new PIXI.Container();
      this.app.stage.addChild(this.uiContainer);
      
      // Minimap container
      this.minimapContainer = new PIXI.Container();
      this.uiContainer.addChild(this.minimapContainer);
      
      // Debug container for diagnostic visuals
      this.debugContainer = new PIXI.Container();
      this.app.stage.addChild(this.debugContainer);
      
      console.log("Containers created successfully!");
    } catch (error) {
      console.error("CRITICAL: Error creating containers:", error);
    }
  }
  
  /**
   * Load textures
   */
  loadTextures() {
    // Create placeholder textures for now
    // In a real implementation, we would load actual textures
    
    // Player textures
    this.textures.player.warrior = this.createColoredRectTexture(0xff0000, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
    this.textures.player.mage = this.createColoredRectTexture(0x0000ff, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
    this.textures.player.ranger = this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
    
    // Monster textures
    this.textures.monster.wolf = this.createColoredRectTexture(0x888888, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    this.textures.monster.bear = this.createColoredRectTexture(0x8B4513, 48, 48);
    this.textures.monster.bandit = this.createColoredRectTexture(0x555555, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    this.textures.monster.slime = this.createColoredRectTexture(0x00FFFF, 28, 28);
    this.textures.monster.troll = this.createColoredRectTexture(0x008800, 56, 56);
    this.textures.monster.snake = this.createColoredRectTexture(0x00FF88, 24, 24);
    this.textures.monster.skeleton = this.createColoredRectTexture(0xCCCCCC, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    this.textures.monster.ghost = this.createColoredRectTexture(0xFFFFFF, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    this.textures.monster.cultist = this.createColoredRectTexture(0x880000, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    this.textures.monster.golem = this.createColoredRectTexture(0x777777, 64, 64);
    this.textures.monster.griffon = this.createColoredRectTexture(0xFFAA00, 48, 48);
    this.textures.monster.harpy = this.createColoredRectTexture(0xFF00FF, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    
    // Boss textures
    this.textures.boss.dragon = this.createColoredRectTexture(0xFF0000, 96, 96);
    this.textures.boss.lich = this.createColoredRectTexture(0x8800FF, 64, 64);
    this.textures.boss.giant = this.createColoredRectTexture(0x888800, 112, 112);
    this.textures.boss.demon = this.createColoredRectTexture(0xFF0088, 80, 80);
    this.textures.boss.treant = this.createColoredRectTexture(0x008800, 88, 88);
    this.textures.boss['ghost king'] = this.createColoredRectTexture(0xCCCCFF, 64, 64);
    this.textures.boss['slime king'] = this.createColoredRectTexture(0x00FFFF, 96, 96);
    
    // Item textures
    this.textures.item.weapon = this.createColoredRectTexture(0xFFFF00, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.helmet = this.createColoredRectTexture(0xFFAA00, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.chest = this.createColoredRectTexture(0xFF8800, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.legs = this.createColoredRectTexture(0xFF6600, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.boots = this.createColoredRectTexture(0xFF4400, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.gloves = this.createColoredRectTexture(0xFF2200, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.ring = this.createColoredRectTexture(0xFFDD00, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.amulet = this.createColoredRectTexture(0xFFBB00, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    this.textures.item.potion = this.createColoredRectTexture(0xFF00FF, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE);
    
    // Tile textures
    this.textures.tile.grass = this.createColoredRectTexture(0x228B22, 32, 32);
    this.textures.tile.water = this.createColoredRectTexture(0x1E90FF, 32, 32);
    this.textures.tile.stone = this.createColoredRectTexture(0x808080, 32, 32);
    this.textures.tile.sand = this.createColoredRectTexture(0xF4A460, 32, 32);
    
    // Effect textures
    this.textures.effect.hit = this.createColoredRectTexture(0xFF0000, 32, 32);
  }
  
  /**
   * Create a colored rectangle texture
   * @param {number} color - Color in hex format
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @returns {PIXI.Texture} The created texture
   */
  createColoredRectTexture(color, width, height) {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    return this.app.renderer.generateTexture(graphics);
  }
  
  /**
   * Main render method
   */
  render() {
    try {
      // Check if app is initialized
      if (!this.app) {
        console.error("CRITICAL: PixiJS application is not initialized!");
        return;
      }

      // Skip if game is not running
      if (!this.game.isRunning) {
        console.log("Game is not running, skipping render");
        return;
      }
      
      // Check if containers are initialized
      if (!this.worldContainer || !this.groundLayer || !this.entityLayer) {
        console.error("CRITICAL: Containers are not initialized!");
        this.logRenderState();
        return;
      }
      
      // Clear all containers
      this.groundLayer.removeChildren();
      this.entityLayer.removeChildren();
      this.itemLayer.removeChildren();
      
      // Force debug mode on to help diagnose the issue
      this.game.debugMode = true;
      
      // Emergency direct rendering approach
      this.drawEmergencyWorld();
      
      // Directly draw the player if it exists
      if (this.game.player) {
        this.drawEmergencyPlayer();
      }
      
      // Directly draw monsters
      if (this.game.monsters.size > 0) {
        this.drawEmergencyMonsters();
      }
      
      // Update camera - direct method
      this.updateCameraEmergency();
      
      // Add diagnostic text to screen
      this.addDiagnosticOverlay();
    } catch (error) {
      console.error("CRITICAL: Error in render method:", error);
    }
  }
  
  /**
   * Simple emergency world rendering for debugging
   */
  drawEmergencyWorld() {
    try {
      // Create a graphics object for the world
      const graphics = new PIXI.Graphics();
      
      // Draw a solid blue background
      graphics.beginFill(0x0000AA);
      graphics.drawRect(0, 0, 1000, 1000);
      graphics.endFill();
      
      // Draw a grid
      graphics.lineStyle(2, 0xFFFFFF, 0.3);
      for (let i = 0; i <= 1000; i += 100) {
        // Vertical line
        graphics.moveTo(i, 0);
        graphics.lineTo(i, 1000);
        
        // Horizontal line
        graphics.moveTo(0, i);
        graphics.lineTo(1000, i);
        
        // Add coordinate text
        const text = new PIXI.Text(`${i}`, {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: 0xFFFFFF
        });
        text.position.set(i + 5, 5);
        this.groundLayer.addChild(text);
      }
      
      // Add to ground layer
      this.groundLayer.addChild(graphics);
      
      console.log("Emergency world drawn successfully");
    } catch (error) {
      console.error("Failed to draw emergency world:", error);
    }
  }
  
  /**
   * Draw player directly for debugging
   */
  drawEmergencyPlayer() {
    try {
      if (!this.game.player) {
        console.error("No player to draw!");
        return;
      }
      
      console.log(`Drawing emergency player at (${this.game.player.position.x}, ${this.game.player.position.y})`);
      
      // Create a graphics object for the player
      const graphics = new PIXI.Graphics();
      
      // Draw a large blue square for the player
      graphics.beginFill(0x00FF00);
      graphics.lineStyle(3, 0xFFFFFF);
      graphics.drawRect(
        this.game.player.position.x - 20, 
        this.game.player.position.y - 20, 
        40, 40
      );
      graphics.endFill();
      
      // Draw attack effect if player is attacking
      if (this.game.player.isAttacking) {
        // Draw attack effect based on facing direction
        const attackRange = 60;
        
        // Set attack color based on class
        let attackColor = 0xFFFFFF; // Default white
        if (this.game.player.characterClass === 'warrior') {
          attackColor = 0xFF8800; // Orange for warrior
        } else if (this.game.player.characterClass === 'mage') {
          attackColor = 0x00AAFF; // Blue for mage
        } else if (this.game.player.characterClass === 'archer') {
          attackColor = 0x88FF00; // Green for archer
        }
        
        // Draw attack effect
        graphics.lineStyle(5, attackColor);
        
        // Direction-based attack visualization
        switch (this.game.player.facingDirection) {
          case 'up':
            graphics.moveTo(this.game.player.position.x - 30, this.game.player.position.y - 30);
            graphics.lineTo(this.game.player.position.x + 30, this.game.player.position.y - 30);
            break;
          case 'right':
            graphics.moveTo(this.game.player.position.x + 30, this.game.player.position.y - 30);
            graphics.lineTo(this.game.player.position.x + 30, this.game.player.position.y + 30);
            break;
          case 'down':
            graphics.moveTo(this.game.player.position.x - 30, this.game.player.position.y + 30);
            graphics.lineTo(this.game.player.position.x + 30, this.game.player.position.y + 30);
            break;
          case 'left':
            graphics.moveTo(this.game.player.position.x - 30, this.game.player.position.y - 30);
            graphics.lineTo(this.game.player.position.x - 30, this.game.player.position.y + 30);
            break;
        }
      }
      
      // Add player text
      const text = new PIXI.Text(`PLAYER (${Math.round(this.game.player.position.x)}, ${Math.round(this.game.player.position.y)})`, {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xFFFFFF
      });
      text.position.set(this.game.player.position.x - 60, this.game.player.position.y - 60);
      
      // Add to entity layer
      this.entityLayer.addChild(graphics);
      this.entityLayer.addChild(text);
    } catch (error) {
      console.error("Failed to draw emergency player:", error);
    }
  }
  
  /**
   * Draw monsters directly for debugging
   */
  drawEmergencyMonsters() {
    try {
      // Draw other players first
      this.game.players.forEach((player, id) => {
        // Get player position
        const x = player.position.x;
        const y = player.position.y;
        
        console.log(`Drawing other player at (${x}, ${y})`);
        
        // Create a graphics object for the player
        const graphics = new PIXI.Graphics();
        
        // Draw a blue square with border for other players
        graphics.beginFill(0x0000FF);
        graphics.lineStyle(3, 0xFFFFFF);
        graphics.drawRect(x - 20, y - 20, 40, 40);
        graphics.endFill();
        
        // Draw attack effect if player is attacking
        if (player.isAttacking) {
          // Set attack color based on class
          let attackColor = 0xFFFFFF; // Default white
          if (player.characterClass === 'warrior') {
            attackColor = 0xFF8800; // Orange for warrior
          } else if (player.characterClass === 'mage') {
            attackColor = 0x00AAFF; // Blue for mage
          } else if (player.characterClass === 'archer') {
            attackColor = 0x88FF00; // Green for archer
          }
          
          // Draw attack effect
          graphics.lineStyle(5, attackColor);
          
          // Direction-based attack visualization
          switch (player.facingDirection) {
            case 'up':
              graphics.moveTo(x - 30, y - 30);
              graphics.lineTo(x + 30, y - 30);
              break;
            case 'right':
              graphics.moveTo(x + 30, y - 30);
              graphics.lineTo(x + 30, y + 30);
              break;
            case 'down':
              graphics.moveTo(x - 30, y + 30);
              graphics.lineTo(x + 30, y + 30);
              break;
            case 'left':
              graphics.moveTo(x - 30, y - 30);
              graphics.lineTo(x - 30, y + 30);
              break;
          }
        }
        
        // Add player name text
        const text = new PIXI.Text(`${player.name || 'PLAYER'} (${Math.round(x)}, ${Math.round(y)})`, {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xFFFFFF
        });
        text.position.set(x - 60, y - 60);
        
        // Add to entity layer
        this.entityLayer.addChild(graphics);
        this.entityLayer.addChild(text);
      });
      
      // Draw monsters
      this.game.monsters.forEach((monster, id) => {
        // Get monster position
        const x = monster.position.x;
        const y = monster.position.y;
        
        console.log(`Drawing emergency monster at (${x}, ${y})`);
        
        // Create a graphics object for the monster
        const graphics = new PIXI.Graphics();
        
        // Draw a large green triangle for the monster
        graphics.beginFill(0xFF0000);
        graphics.lineStyle(3, 0xFFFFFF);
        graphics.moveTo(x, y - 30);
        graphics.lineTo(x + 30, y + 30);
        graphics.lineTo(x - 30, y + 30);
        graphics.closePath();
        graphics.endFill();
        
        // Add monster text
        const text = new PIXI.Text(`MONSTER (${Math.round(x)}, ${Math.round(y)})`, {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xFFFFFF
        });
        text.position.set(x - 60, y - 60);
        
        // Add to entity layer
        this.entityLayer.addChild(graphics);
        this.entityLayer.addChild(text);
      });
    } catch (error) {
      console.error("Failed to draw emergency monsters:", error);
    }
  }
  
  /**
   * Emergency camera update method
   */
  updateCameraEmergency() {
    try {
      if (!this.game.player) return;
      
      // Force camera to player position
      this.camera.x = this.game.player.position.x;
      this.camera.y = this.game.player.position.y;
      
      console.log(`Emergency camera update: (${this.camera.x}, ${this.camera.y})`);
      
      // Set world container position directly
      this.worldContainer.position.x = CONFIG.GAME_WIDTH / 2 - this.camera.x;
      this.worldContainer.position.y = CONFIG.GAME_HEIGHT / 2 - this.camera.y;
      this.worldContainer.scale.x = 1;
      this.worldContainer.scale.y = 1;
    } catch (error) {
      console.error("Failed to update camera:", error);
    }
  }
  
  /**
   * Add diagnostic overlay
   */
  addDiagnosticOverlay() {
    try {
      // Create diagnostic text
      const text = new PIXI.Text("DIAGNOSTIC MODE", {
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xFF0000
      });
      text.position.set(10, 10);
      
      // Add player info
      let info = "";
      if (this.game.player) {
        info += `Player: (${Math.round(this.game.player.position.x)}, ${Math.round(this.game.player.position.y)})\n`;
      } else {
        info += "Player: NOT FOUND\n";
      }
      
      info += `Players: ${this.game.players.size}\n`;
      info += `Monsters: ${this.game.monsters.size}\n`;
      info += `Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})\n`;
      
      const infoText = new PIXI.Text(info, {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xFFFFFF,
        backgroundColor: 0x000000
      });
      infoText.position.set(10, 40);
      
      // Add help text
      const helpText = new PIXI.Text("Use WASD to move", {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xFFFF00
      });
      helpText.position.set(10, CONFIG.GAME_HEIGHT - 30);
      
      // Add directly to stage
      this.app.stage.addChild(text);
      this.app.stage.addChild(infoText);
      this.app.stage.addChild(helpText);
    } catch (error) {
      console.error("Failed to add diagnostic overlay:", error);
    }
  }
  
  /**
   * Log render state for debugging
   */
  logRenderState() {
    console.log("=== RENDERER STATE ===");
    console.log("Game running:", this.game.isRunning);
    console.log("App initialized:", !!this.app);
    console.log("World container:", !!this.worldContainer);
    console.log("Ground layer:", !!this.groundLayer);
    console.log("Entity layer:", !!this.entityLayer);
    console.log("Item layer:", !!this.itemLayer);
    console.log("Player exists:", !!this.game.player);
    console.log("Number of players:", this.game.players.size);
    console.log("Number of monsters:", this.game.monsters.size);
    
    // Check if PIXI is loaded
    console.log("PIXI loaded:", typeof PIXI !== 'undefined');
    
    if (this.game.player) {
      console.log("Player position:", this.game.player.position);
    }
    
    console.log("=====================");
  }
  
  /**
   * Update camera position to follow player
   */
  updateCamera() {
    if (this.game.player) {
      // Log camera info for debugging
      if (this.game.debugMode) {
        console.log("Camera updating:");
        console.log("- Player at:", this.game.player.position.x, this.game.player.position.y);
        console.log("- Current camera at:", this.camera.x, this.camera.y);
      }
      
      // Force center camera on player (disable smooth following for debugging)
      this.camera.x = this.game.player.position.x;
      this.camera.y = this.game.player.position.y;
      
      // Directly apply camera transform to world container
      this.worldContainer.position.x = CONFIG.GAME_WIDTH / 2 - this.camera.x * this.camera.zoom;
      this.worldContainer.position.y = CONFIG.GAME_HEIGHT / 2 - this.camera.y * this.camera.zoom;
      this.worldContainer.scale.x = this.camera.zoom;
      this.worldContainer.scale.y = this.camera.zoom;
      
      if (this.game.debugMode) {
        console.log("- New container position:", this.worldContainer.position.x, this.worldContainer.position.y);
      }
    }
  }
  
  /**
   * Render the game world (ground, terrain, etc.)
   */
  renderWorld() {
    // In test mode, just draw a simple grid
    if (!this.gridGraphics) {
      this.gridGraphics = new PIXI.Graphics();
      this.groundLayer.addChild(this.gridGraphics);
      
      // Draw grid
      this.gridGraphics.clear();
      
      // Add a solid background first so we can see the world boundaries
      this.gridGraphics.beginFill(0x333333); // Dark gray background
      this.gridGraphics.drawRect(0, 0, 1000, 1000); // Full world size
      this.gridGraphics.endFill();
      
      // Draw grid lines
      this.gridGraphics.lineStyle(1, 0x666666, 0.5); // Make grid lines more visible
      
      const gridSize = 50;
      const worldWidth = 1000;
      const worldHeight = 1000;
      
      // Draw vertical lines
      for (let x = 0; x <= worldWidth; x += gridSize) {
        this.gridGraphics.moveTo(x, 0);
        this.gridGraphics.lineTo(x, worldHeight);
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= worldHeight; y += gridSize) {
        this.gridGraphics.moveTo(0, y);
        this.gridGraphics.lineTo(worldWidth, y);
      }
      
      // Draw world border
      this.gridGraphics.lineStyle(5, 0x999999, 1.0); // Thicker, more visible border
      this.gridGraphics.drawRect(0, 0, worldWidth, worldHeight);
      
      // Draw the center point for reference
      this.gridGraphics.lineStyle(2, 0xFF0000, 1.0);
      this.gridGraphics.drawCircle(worldWidth/2, worldHeight/2, 20);
      
      // Add coordinate labels at 100-pixel intervals
      for (let x = 0; x <= worldWidth; x += 100) {
        for (let y = 0; y <= worldHeight; y += 100) {
          const coordText = new PIXI.Text(
            `(${x},${y})`, 
            { fontFamily: 'Arial', fontSize: 10, fill: 0xFFFFFF }
          );
          coordText.position.set(x + 2, y + 2);
          this.groundLayer.addChild(coordText);
        }
      }
    }
  }
  
  /**
   * Render all game entities (players, monsters, items)
   */
  renderEntities() {
    // Clear entity layer
    this.entityLayer.removeChildren();
    this.itemLayer.removeChildren();
    
    // Log what we're rendering
    if (this.game.debugMode) {
      console.log("Rendering entities:");
      console.log("- Player:", this.game.player ? "exists" : "none");
      console.log("- Other players:", this.game.players.size);
      console.log("- Monsters:", this.game.monsters.size);
      console.log("- Items:", this.game.items.size);
    }
    
    // Draw items
    this.game.items.forEach(item => {
      const graphics = new PIXI.Graphics();
      
      // Draw item based on rarity
      let color = 0xFFFFFF; // Default white for common items
      if (item.rarity === 'rare') {
        color = 0x4169E1; // Royal blue
      } else if (item.rarity === 'legendary') {
        color = 0xFFD700; // Gold
      }
      
      graphics.beginFill(color);
      graphics.drawCircle(item.position.x, item.position.y, 15); // Bigger items
      graphics.endFill();
      
      this.itemLayer.addChild(graphics);
    });
    
    // Draw player
    if (this.game.player) {
      const playerGraphics = new PIXI.Graphics();
      
      // Draw local player as a square with border
      playerGraphics.lineStyle(3, 0xFFFFFF, 1.0); // White border
      playerGraphics.beginFill(0x00FF00, 0.8); // Green, semi-transparent
      
      // Draw a larger player square
      const playerSize = 40;
      playerGraphics.drawRect(
        this.game.player.position.x - playerSize/2, 
        this.game.player.position.y - playerSize/2, 
        playerSize, 
        playerSize
      );
      playerGraphics.endFill();
      
      // Add player label
      const nameText = new PIXI.Text(
        `YOU (${Math.round(this.game.player.position.x)},${Math.round(this.game.player.position.y)})`, 
        { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF }
      );
      nameText.position.set(
        this.game.player.position.x - nameText.width / 2,
        this.game.player.position.y - playerSize/2 - 20
      );
      
      this.entityLayer.addChild(playerGraphics);
      this.entityLayer.addChild(nameText);
      
      // Log player position for debugging
      if (this.game.debugMode) {
        console.log(`Player rendered at: (${this.game.player.position.x}, ${this.game.player.position.y})`);
      }
    }
    
    // Draw other players
    this.game.players.forEach(player => {
      const playerGraphics = new PIXI.Graphics();
      
      // Draw other players as blue squares with border
      playerGraphics.lineStyle(2, 0xFFFFFF, 1.0);
      playerGraphics.beginFill(0x0000FF, 0.8); // Blue, semi-transparent
      
      const playerSize = 40;
      playerGraphics.drawRect(
        player.position.x - playerSize/2, 
        player.position.y - playerSize/2, 
        playerSize, 
        playerSize
      );
      playerGraphics.endFill();
      
      // Add player name label
      const nameText = new PIXI.Text(
        player.name, 
        { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF }
      );
      nameText.position.set(
        player.position.x - nameText.width / 2,
        player.position.y - playerSize/2 - 20
      );
      
      this.entityLayer.addChild(playerGraphics);
      this.entityLayer.addChild(nameText);
    });
    
    // Draw monsters
    this.game.monsters.forEach(monster => {
      const monsterGraphics = new PIXI.Graphics();
      
      // Draw monsters as red triangles with border
      monsterGraphics.lineStyle(2, 0xFFFFFF, 1.0);
      monsterGraphics.beginFill(0xFF0000, 0.8); // Red, semi-transparent
      
      // Make monsters larger
      const monsterSize = 40;
      monsterGraphics.moveTo(monster.position.x, monster.position.y - monsterSize/2);
      monsterGraphics.lineTo(monster.position.x + monsterSize/2, monster.position.y + monsterSize/2);
      monsterGraphics.lineTo(monster.position.x - monsterSize/2, monster.position.y + monsterSize/2);
      monsterGraphics.closePath();
      monsterGraphics.endFill();
      
      // Add monster type label
      const nameText = new PIXI.Text(
        `${monster.type} (${Math.round(monster.position.x)},${Math.round(monster.position.y)})`, 
        { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF }
      );
      nameText.position.set(
        monster.position.x - nameText.width / 2,
        monster.position.y - monsterSize/2 - 20
      );
      
      this.entityLayer.addChild(monsterGraphics);
      this.entityLayer.addChild(nameText);
      
      // Log monster position for debugging
      if (this.game.debugMode) {
        console.log(`Monster rendered at: (${monster.position.x}, ${monster.position.y})`);
      }
    });
  }
  
  /**
   * Render UI elements (minimap, etc.)
   */
  renderUI() {
    // Update minimap if player exists
    if (this.game.player) {
      this.updateMinimap();
    }
  }
  
  /**
   * Update the minimap
   */
  updateMinimap() {
    // Create minimap container if it doesn't exist
    if (!this.minimapContainer) {
      this.minimapContainer = new PIXI.Container();
      this.minimapContainer.position.set(CONFIG.GAME_WIDTH - 150, 10);
      this.app.stage.addChild(this.minimapContainer);
      
      // Create minimap background
      const minimapBg = new PIXI.Graphics();
      minimapBg.beginFill(0x000000, 0.5);
      minimapBg.drawRect(0, 0, 140, 140);
      minimapBg.endFill();
      this.minimapContainer.addChild(minimapBg);
      
      // Create minimap content container
      this.minimapContent = new PIXI.Container();
      this.minimapContent.position.set(5, 5);
      this.minimapContainer.addChild(this.minimapContent);
    }
    
    // Make sure minimapContent exists before trying to clear it
    if (!this.minimapContent) {
      this.minimapContent = new PIXI.Container();
      this.minimapContent.position.set(5, 5);
      this.minimapContainer.addChild(this.minimapContent);
    }
    
    // Clear minimap content
    this.minimapContent.removeChildren();
    
    // Create minimap content graphics
    const minimapGraphics = new PIXI.Graphics();
    this.minimapContent.addChild(minimapGraphics);
    
    // Determine minimap scale based on world size (assuming 1000x1000 world)
    const worldSize = 1000;
    const minimapSize = 130;
    const minimapScale = minimapSize / worldSize;
    
    // Draw world border
    minimapGraphics.lineStyle(1, 0xFFFFFF, 0.5);
    minimapGraphics.drawRect(0, 0, worldSize * minimapScale, worldSize * minimapScale);
    
    // Draw player on minimap
    if (this.game.player) {
      minimapGraphics.beginFill(0x00FF00);
      minimapGraphics.drawCircle(
        this.game.player.position.x * minimapScale,
        this.game.player.position.y * minimapScale,
        3
      );
      minimapGraphics.endFill();
    }
    
    // Draw other players
    this.game.players.forEach(player => {
      minimapGraphics.beginFill(0x0000FF);
      minimapGraphics.drawCircle(
        player.position.x * minimapScale,
        player.position.y * minimapScale,
        2
      );
      minimapGraphics.endFill();
    });
    
    // Draw monsters
    this.game.monsters.forEach(monster => {
      minimapGraphics.beginFill(0xFF0000);
      minimapGraphics.drawCircle(
        monster.position.x * minimapScale,
        monster.position.y * minimapScale,
        2
      );
      minimapGraphics.endFill();
    });
  }
  
  /**
   * Set the local player
   * @param {Player} player - The local player
   */
  setPlayer(player) {
    // Create player sprite
    const texture = this.textures.player[player.characterClass] || this.textures.player.warrior;
    const sprite = new PIXI.Sprite(texture);
    
    // Set sprite properties
    sprite.anchor.set(0.5);
    sprite.position.x = player.position.x;
    sprite.position.y = player.position.y;
    
    // Add to entity layer
    this.entityLayer.addChild(sprite);
    
    // Store sprite reference
    this.playerSprites.set(player.id, sprite);
  }
  
  /**
   * Add a player to the renderer
   * @param {Player} player - The player to add
   */
  addPlayer(player) {
    // Create player sprite
    const texture = this.textures.player[player.characterClass] || this.textures.player.warrior;
    const sprite = new PIXI.Sprite(texture);
    
    // Set sprite properties
    sprite.anchor.set(0.5);
    sprite.position.x = player.position.x;
    sprite.position.y = player.position.y;
    
    // Add to entity layer
    this.entityLayer.addChild(sprite);
    
    // Store sprite reference
    this.playerSprites.set(player.id, sprite);
  }
  
  /**
   * Remove a player from the renderer
   * @param {Player} player - The player to remove
   */
  removePlayer(player) {
    // Get player sprite
    const sprite = this.playerSprites.get(player.id);
    
    if (sprite) {
      // Remove from entity layer
      this.entityLayer.removeChild(sprite);
      
      // Remove from sprite map
      this.playerSprites.delete(player.id);
    }
  }
  
  /**
   * Add a monster to the renderer
   * @param {Monster} monster - The monster to add
   */
  addMonster(monster) {
    // Create monster sprite
    const texture = this.textures.monster[monster.type] || this.textures.monster.wolf;
    const sprite = new PIXI.Sprite(texture);
    
    // Set sprite properties
    sprite.anchor.set(0.5);
    sprite.position.x = monster.position.x;
    sprite.position.y = monster.position.y;
    
    // Add to entity layer
    this.entityLayer.addChild(sprite);
    
    // Store sprite reference
    this.monsterSprites.set(monster.id, sprite);
  }
  
  /**
   * Remove a monster from the renderer
   * @param {Monster} monster - The monster to remove
   */
  removeMonster(monster) {
    // Get monster sprite
    const sprite = this.monsterSprites.get(monster.id);
    
    if (sprite) {
      // Remove from entity layer
      this.entityLayer.removeChild(sprite);
      
      // Remove from sprite map
      this.monsterSprites.delete(monster.id);
    }
  }
  
  /**
   * Add a boss to the renderer
   * @param {Boss} boss - The boss to add
   */
  addBoss(boss) {
    // Create boss sprite
    const texture = this.textures.boss[boss.type] || this.textures.boss.dragon;
    const sprite = new PIXI.Sprite(texture);
    
    // Set sprite properties
    sprite.anchor.set(0.5);
    sprite.position.x = boss.position.x;
    sprite.position.y = boss.position.y;
    
    // Add to entity layer
    this.entityLayer.addChild(sprite);
    
    // Store sprite reference
    this.bossSprites.set(boss.id, sprite);
  }
  
  /**
   * Remove a boss from the renderer
   * @param {Boss} boss - The boss to remove
   */
  removeBoss(boss) {
    // Get boss sprite
    const sprite = this.bossSprites.get(boss.id);
    
    if (sprite) {
      // Remove from entity layer
      this.entityLayer.removeChild(sprite);
      
      // Remove from sprite map
      this.bossSprites.delete(boss.id);
    }
  }
  
  /**
   * Add an item to the renderer
   * @param {Item} item - The item to add
   */
  addItem(item) {
    // Create item sprite
    const texture = this.textures.item[item.type] || this.textures.item.weapon;
    const sprite = new PIXI.Sprite(texture);
    
    // Set sprite properties
    sprite.anchor.set(0.5);
    sprite.position.x = item.position.x;
    sprite.position.y = item.position.y;
    
    // Tint based on rarity
    if (item.rarity === 'rare') {
      sprite.tint = 0x4169E1; // Royal blue
    } else if (item.rarity === 'legendary') {
      sprite.tint = 0xFFD700; // Gold
    }
    
    // Add to item layer
    this.itemLayer.addChild(sprite);
    
    // Store sprite reference
    this.itemSprites.set(item.id, sprite);
  }
  
  /**
   * Remove an item from the renderer
   * @param {Item} item - The item to remove
   */
  removeItem(item) {
    // Get item sprite
    const sprite = this.itemSprites.get(item.id);
    
    if (sprite) {
      // Remove from item layer
      this.itemLayer.removeChild(sprite);
      
      // Remove from sprite map
      this.itemSprites.delete(item.id);
    }
  }
  
  /**
   * Show damage text
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} damage - Damage amount
   */
  showDamageText(x, y, damage) {
    // Create damage text
    const damageText = new PIXI.Text(damage.toString(), {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xFF0000,
      align: 'center',
      stroke: 0x000000,
      strokeThickness: 4
    });
    
    // Set text properties
    damageText.anchor.set(0.5);
    damageText.position.x = x;
    damageText.position.y = y - 20;
    
    // Add to effect layer
    this.effectLayer.addChild(damageText);
    
    // Animate and remove
    const startY = damageText.position.y;
    let elapsed = 0;
    
    const animate = (delta) => {
      elapsed += delta;
      
      // Move up
      damageText.position.y = startY - elapsed * 0.5;
      
      // Fade out
      damageText.alpha = 1 - (elapsed / 60);
      
      // Remove when animation complete
      if (elapsed >= 60) {
        this.effectLayer.removeChild(damageText);
        this.app.ticker.remove(animate);
      }
    };
    
    this.app.ticker.add(animate);
  }
  
  /**
   * Play hit animation
   * @param {Object} target - The target entity
   */
  playHitAnimation(target) {
    // Get target sprite
    let sprite = null;
    
    if (target.type === 'player') {
      if (target.isLocalPlayer) {
        sprite = this.playerSprites.get(target.id);
      } else {
        sprite = this.playerSprites.get(target.id);
      }
    } else if (target.type === 'monster') {
      sprite = this.monsterSprites.get(target.id);
    } else if (target.type === 'boss') {
      sprite = this.bossSprites.get(target.id);
    }
    
    if (sprite) {
      // Flash red
      sprite.tint = 0xFF0000;
      
      // Reset after 100ms
      setTimeout(() => {
        sprite.tint = 0xFFFFFF;
      }, 100);
    }
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    const worldX = (screenX - this.worldContainer.position.x) / this.camera.zoom;
    const worldY = (screenY - this.worldContainer.position.y) / this.camera.zoom;
    return { x: worldX, y: worldY };
  }
  
  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    const screenX = (worldX - this.camera.x) * this.camera.zoom + CONFIG.GAME_WIDTH / 2;
    const screenY = (worldY - this.camera.y) * this.camera.zoom + CONFIG.GAME_HEIGHT / 2;
    
    return { x: screenX, y: screenY };
  }
  
  /**
   * Handle window resize
   */
  resize() {
    // Update config
    CONFIG.GAME_WIDTH = window.innerWidth;
    CONFIG.GAME_HEIGHT = window.innerHeight;
    
    // Resize renderer
    this.app.renderer.resize(CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
  }
  
  /**
   * Render debug info on screen
   */
  renderDebugInfo() {
    // Only render if debug mode is on
    if (!this.game.debugMode) {
      return;
    }
    
    try {
      // Debug graphics
      const debugGraphics = new PIXI.Graphics();
      
      // Draw FPS counter
      const fps = Math.round(this.app.ticker.FPS);
      const fpsText = new PIXI.Text(`FPS: ${fps}`, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xFFFFFF
      });
      fpsText.position.set(10, 10);
      
      // Draw player coordinates if player exists
      if (this.game.player) {
        const x = Math.round(this.game.player.position.x);
        const y = Math.round(this.game.player.position.y);
        
        const posText = new PIXI.Text(`Position: (${x}, ${y})`, {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xFFFFFF
        });
        posText.position.set(10, 30);
        
        this.debugContainer.addChild(posText);
      }
      
      // Draw entity counts
      const countText = new PIXI.Text(
        `Players: ${this.game.players.size} | Monsters: ${this.game.monsters.size}`, 
        {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xFFFFFF
        }
      );
      countText.position.set(10, 50);
      
      this.debugContainer.addChild(fpsText);
      this.debugContainer.addChild(countText);
    } catch (error) {
      console.error("Failed to render debug info:", error);
    }
  }
} 