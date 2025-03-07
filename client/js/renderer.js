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
    this.projectileLayer = null;
    
    // Sprite maps
    this.playerSprites = new Map();
    this.monsterSprites = new Map();
    this.bossSprites = new Map();
    this.itemSprites = new Map();
    this.projectileSprites = new Map();
    
    // Textures
    this.textures = {
      player: {},
      monster: {},
      boss: {},
      item: {},
      tile: {},
      effect: {},
      projectile: {}
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
      
      // Get the game container
      const gameContainer = document.getElementById('game-container');
      if (!gameContainer) {
        console.error("CRITICAL: Game container element not found!");
        return;
      }
      
      // Add canvas to DOM
      gameContainer.prepend(this.app.view);
      
      // Create containers
      this.createContainers();
      
      // Generate character sprites programmatically as a fallback
      // We don't need to do this if we're using sprite files, but
      // keeping it as a fallback option
      this.generateAndSaveSprites();
      
      // Load textures
      this.loadTextures();
      
      // Set up resize handler
      window.addEventListener('resize', this.resize);
    } catch (error) {
      console.error("CRITICAL: Error initializing renderer:", error);
    }
  }
  
  /**
   * Create containers for organizing sprites
   */
  createContainers() {
    try {
      // World container (affected by camera)
      this.worldContainer = new PIXI.Container();
      this.app.stage.addChild(this.worldContainer);
      
      // Create layers
      this.groundLayer = new PIXI.Container();
      this.itemLayer = new PIXI.Container();
      this.entityLayer = new PIXI.Container();
      this.effectLayer = new PIXI.Container();
      this.projectileLayer = new PIXI.Container();
      
      // Add layers to world container
      this.worldContainer.addChild(this.groundLayer);
      this.worldContainer.addChild(this.itemLayer);
      this.worldContainer.addChild(this.projectileLayer);
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
    } catch (error) {
      console.error("CRITICAL: Error creating containers:", error);
    }
  }
  
  /**
   * Generate and save sprite textures for use in-game
   */
  generateAndSaveSprites() {
    // Initialize the sprite storage
    this.generatedSprites = {};
    
    // Generate warrior sprite
    try {
      this.generatedSprites.warrior = this.createWarriorSprite();
      console.log("Generated warrior sprite successfully");
    } catch (error) {
      console.error("Error generating warrior sprite:", error);
      // Leave generatedSprites.warrior as undefined
    }
    
    // Generate mage sprite
    try {
      this.generatedSprites.mage = this.createMageSprite();
      console.log("Generated mage sprite successfully");
    } catch (error) {
      console.error("Error generating mage sprite:", error);
      // Leave generatedSprites.mage as undefined
    }
    
    // Generate ranger sprite
    try {
      this.generatedSprites.ranger = this.createRangerSprite();
      console.log("Generated ranger sprite successfully");
    } catch (error) {
      console.error("Error generating ranger sprite:", error);
      // Leave generatedSprites.ranger as undefined
    }
  }
  
  /**
   * Load all textures
   */
  loadTextures() {
    console.log("Loading textures...");
    
    // Load textures by category
    this.loadPlayerTextures();
    this.loadProjectileTextures();
    this.loadExplosionTextures();
    
    // Copy the player textures to the main textures object
    this.textures.player = { ...this.playerTextures };
    
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
    
    console.log("Texture loading complete");
  }
  
  /**
   * Load player textures
   */
  loadPlayerTextures() {
    this.playerTextures = {};
    
    // Load warrior texture
    const warriorPath = '/assets/classes/warrior/warriorsprite.png';
    this.loadClassTexture('warrior', warriorPath);
    
    // Load mage texture
    const magePath = '/assets/classes/mage/magesprite.png';
    this.loadClassTexture('mage', magePath);
    
    // Load ranger texture - use the path from client assets (correct path)
    const rangerPath = '/assets/classes/ranger/rangersprite.png';
    this.loadClassTextureWithAnimation('ranger', rangerPath);
  }
  
  /**
   * Load projectile textures
   */
  loadProjectileTextures() {
    // Initialize projectile textures
    if (!this.textures.projectile) {
      this.textures.projectile = {};
    }
    
    // Create various projectile textures
    this.textures.projectile.fireball = this.createFireballTexture();
    this.textures.projectile.arrow = this.createArrowTexture();
    
    console.log("Projectile textures loaded successfully");
  }
  
  /**
   * Load explosion textures
   */
  loadExplosionTextures() {
    // Initialize effect textures if not already
    if (!this.textures.effect) {
      this.textures.effect = {};
    }
    
    // Create explosion texture
    this.textures.effect.explosion = this.createColoredRectTexture(0xFF5500, 64, 64);
    this.textures.effect.hit = this.createColoredRectTexture(0xFF0000, 32, 32);
    this.textures.effect.slash = this.createSlashTexture();
    
    console.log("Explosion textures loaded successfully");
  }
  
  /**
   * Create a slash texture for warrior attacks
   * @returns {PIXI.Texture} The slash texture
   */
  createSlashTexture() {
    // Create a graphics object to draw our slash
    const graphics = new PIXI.Graphics();
    
    // Set slash texture size
    const width = 128;
    const height = 128;
    
    // Draw a gradient arc representing a slash
    graphics.lineStyle(0);
    
    // Create a radial gradient effect for the slash
    // Orange to yellow gradient
    const color1 = 0xFF5500; // Orange
    const color2 = 0xFFFF00; // Yellow
    const color3 = 0xFFFFFF; // White for highlights
    
    // Create a more directional slash that looks good when expanding outward
    // Draw a wider arc (more than 90 degrees) for better visibility
    const startAngle = -Math.PI / 3; // -60 degrees 
    const endAngle = Math.PI / 3;    // 60 degrees
    
    // Outer arc (semi-transparent orange)
    graphics.beginFill(color1, 0.6);
    graphics.arc(0, 0, width/2 - 10, startAngle, endAngle);
    graphics.lineTo(0, 0);
    graphics.endFill();
    
    // Middle arc
    graphics.beginFill(color1, 0.7);
    graphics.arc(0, 0, width/2.5, startAngle, endAngle);
    graphics.lineTo(0, 0);
    graphics.endFill();
    
    // Inner arc (more opaque yellow)
    graphics.beginFill(color2, 0.8);
    graphics.arc(0, 0, width/3, startAngle, endAngle);
    graphics.lineTo(0, 0);
    graphics.endFill();
    
    // Add multiple slash lines for a more dynamic effect
    // Main slash line
    graphics.lineStyle(5, color3, 0.9);
    graphics.arc(0, 0, width/2.5, startAngle + 0.1, endAngle - 0.1);
    
    // Secondary slash line
    graphics.lineStyle(3, color3, 0.7);
    graphics.arc(0, 0, width/2.2, startAngle + 0.15, endAngle - 0.15);
    
    // Add motion streaks
    const streakCount = 5;
    for (let i = 1; i <= streakCount; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i / (streakCount + 1));
      const alpha = 0.3 + (i / streakCount) * 0.3;
      
      graphics.lineStyle(2, color3, alpha);
      graphics.moveTo(0, 0);
      graphics.lineTo(
        Math.cos(angle) * (width/2 - 5),
        Math.sin(angle) * (width/2 - 5)
      );
    }
    
    // Add some small particles for effect
    for (let i = 0; i < 12; i++) {
      const angle = startAngle + (Math.random() * (endAngle - startAngle));
      const distance = (Math.random() * width/3) + width/4;
      const size = Math.random() * 3 + 1;
      
      graphics.beginFill(Math.random() > 0.3 ? color3 : color2, 0.7);
      graphics.drawCircle(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        size
      );
      graphics.endFill();
    }
    
    // Position the graphic to be centered for proper rotation
    graphics.position.set(width/2, height/2);
    
    // Create a texture from the graphics
    return this.app.renderer.generateTexture(graphics);
  }
  
  /**
   * Load a class texture with animation frames if it's a spritesheet
   * @param {string} className - The class name
   * @param {string} path - The path to the texture
   */
  loadClassTextureWithAnimation(className, path) {
    try {
      // Load the base texture
      const baseTexture = PIXI.BaseTexture.from(path);
      
      // Get the dimensions of the spritesheet
      const spritesheetWidth = baseTexture.width;
      const spritesheetHeight = baseTexture.height;
      
      console.log(`${className} sprite dimensions: ${spritesheetWidth}x${spritesheetHeight}`);
      
      // Create frames object with default structure
      const frames = {
        down: [],
        left: [],
        right: [],
        up: [],
        default: null
      };
      
      // If sprite is too small for a proper spritesheet (likely a placeholder),
      // just use it as a single texture for all directions
      if (spritesheetWidth < 32 || spritesheetHeight < 32) {
        console.log(`${className} sprite is too small for animation, using as single texture`);
        const texture = new PIXI.Texture(baseTexture);
        
        // Use the same texture for all directions
        frames.default = texture;
        frames.down.push(texture);
        frames.left.push(texture);
        frames.right.push(texture);
        frames.up.push(texture);
      } else {
        // For larger spritesheets, extract animation frames
        // Typically 16x16 pixel frames arranged in a grid
        const frameWidth = 16;
        const frameHeight = 16;
        
        // Calculate rows and columns in the sheet
        const cols = Math.floor(spritesheetWidth / frameWidth);
        const rows = Math.floor(spritesheetHeight / frameHeight);
        
        console.log(`Spritesheet has ${rows} rows and ${cols} columns of frames`);
        
        // Extract frames for each direction
        // Typical layout: row 0 = down, row 1 = left, row 2 = right, row 3 = up
        
        // Process for each row (direction)
        for (let row = 0; row < Math.min(rows, 4); row++) {
          const direction = row === 0 ? 'down' : 
                           row === 1 ? 'left' : 
                           row === 2 ? 'right' : 'up';
                           
          // Get frames for this direction
          for (let col = 0; col < cols; col++) {
            const x = col * frameWidth;
            const y = row * frameHeight;
            
            const texture = new PIXI.Texture(
              baseTexture,
              new PIXI.Rectangle(x, y, frameWidth, frameHeight)
            );
            
            frames[direction].push(texture);
            
            // Use the first frame (down, first column) as default
            if (row === 0 && col === 0) {
              frames.default = texture;
            }
          }
        }
      }
      
      // If we couldn't extract any frames, create a fallback
      if (!frames.default) {
        // Create a simple colored rectangle as fallback
        frames.default = this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
        
        // Copy default to all directions if they're empty
        if (frames.down.length === 0) frames.down.push(frames.default);
        if (frames.left.length === 0) frames.left.push(frames.default);
        if (frames.right.length === 0) frames.right.push(frames.default);
        if (frames.up.length === 0) frames.up.push(frames.default);
        
        console.warn(`No frames were extracted from ${path}, using fallback`);
      }
      
      // Store the animation frames
      this.playerTextures[className] = frames;
      console.log(`Successfully loaded ${className} animation frames from ${path}`);
    } catch (error) {
      console.error(`Failed to load ${className} spritesheet from ${path}:`, error);
      // Create a fallback colored rectangle
      const fallbackTexture = this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
      this.playerTextures[className] = { 
        default: fallbackTexture,
        down: [fallbackTexture],
        left: [fallbackTexture],
        right: [fallbackTexture],
        up: [fallbackTexture]
      };
    }
  }
  
  /**
   * Load a class texture
   * @param {string} className - The class name
   * @param {string} path - The path to the texture
   */
  loadClassTexture(className, path) {
    try {
      const texture = PIXI.Texture.from(path);
      this.playerTextures[className] = { default: texture };
      console.log(`Successfully loaded ${className} texture from ${path}`);
    } catch (error) {
      console.error(`Failed to load ${className} texture from ${path}:`, error);
      // Create a fallback colored rectangle as texture
      this.playerTextures[className] = { 
        default: this.createColoredRectTexture(
          className === 'warrior' ? 0xff0000 : 
          className === 'mage' ? 0x0000ff : 0xffff00
        )
      };
    }
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
   * Create a fireball texture
   * @returns {PIXI.Texture} The created texture
   */
  createFireballTexture() {
    const graphics = new PIXI.Graphics();
    
    // Orange-red gradient circle
    graphics.beginFill(0xFF4500); // Orange-red
    graphics.drawCircle(12, 12, 12);
    graphics.endFill();
    
    // Yellow core
    graphics.beginFill(0xFFFF00); // Yellow
    graphics.drawCircle(12, 12, 6);
    graphics.endFill();
    
    return this.app.renderer.generateTexture(graphics);
  }
  
  /**
   * Create an arrow texture
   * @returns {PIXI.Texture} The created texture
   */
  createArrowTexture() {
    const graphics = new PIXI.Graphics();
    
    // Draw arrow shaft
    graphics.beginFill(0x8B4513); // Brown
    graphics.drawRect(2, 4, 12, 2);
    graphics.endFill();
    
    // Draw arrow head
    graphics.beginFill(0x808080); // Gray
    graphics.moveTo(14, 1);
    graphics.lineTo(20, 5);
    graphics.lineTo(14, 9);
    graphics.lineTo(14, 1);
    graphics.endFill();
    
    // Draw arrow fletching
    graphics.beginFill(0x333333); // Dark gray
    graphics.drawRect(0, 2, 2, 6);
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
      
      // Update world
      this.renderWorld();
      
      // Render entities
      this.renderEntities();
      
      // Render projectiles
      this.renderProjectiles();
      
      // Render UI
      this.renderUI();
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
        const nameText = new PIXI.Text(`${player.name || 'PLAYER'} (${Math.round(x)}, ${Math.round(y)})`, {
          fontFamily: 'Arial',
          fontSize: 14,
          fill: 0xFFFFFF
        });
        nameText.position.set(x - 60, y - 60);
        
        // Add to entity layer
        this.entityLayer.addChild(graphics);
        this.entityLayer.addChild(nameText);
      });
      
      // Draw monsters
      this.game.monsters.forEach((monster, id) => {
        // Get monster position
        const x = monster.position.x;
        const y = monster.position.y;
        
        // Create a graphics object for the monster
        const graphics = new PIXI.Graphics();
        
        // Draw a large green triangle for the monster
        graphics.beginFill(0xFF0000);
        graphics.lineStyle(3, 0xFFFFFF, 1.0);
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
      // Force center camera on player (disable smooth following for debugging)
      this.camera.x = this.game.player.position.x;
      this.camera.y = this.game.player.position.y;
      
      // Directly apply camera transform to world container
      this.worldContainer.position.x = CONFIG.GAME_WIDTH / 2 - this.camera.x * this.camera.zoom;
      this.worldContainer.position.y = CONFIG.GAME_HEIGHT / 2 - this.camera.y * this.camera.zoom;
      this.worldContainer.scale.x = this.camera.zoom;
      this.worldContainer.scale.y = this.camera.zoom;
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
      this.renderPlayerSprite(this.game.player, true);
    }
    
    // Draw other players
    this.game.players.forEach(player => {
      // Skip local player since we already rendered it
      if (player === this.game.player) return;
      
      this.renderPlayerSprite(player, false);
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
    });
  }
  
  /**
   * Render a player using either a sprite or a fallback graphic
   * @param {Object} player - The player to render
   * @param {boolean} isLocalPlayer - Whether this is the local player
   */
  renderPlayerSprite(player, isLocalPlayer) {
    // Determine character class
    const charClass = player.characterClass || 'warrior';
    
    try {
      // Log which player and class we're rendering
      if (isLocalPlayer) {
        console.log(`Rendering local player as ${charClass}`);
      }
      
      // Get the textures for this class
      const textures = this.playerTextures[charClass];
      
      if (!textures) {
        throw new Error(`No textures found for class ${charClass}`);
      }
      
      // Create sprite using appropriate texture
      let sprite;
      
      // Check if this is an animated spritesheet (has direction frames)
      if (textures.down && textures.down.length > 0) {
        // Determine direction based on player movement or facing
        let direction = 'down'; // Default direction
        
        // If player has movement data, use it to determine direction
        if (player.movement) {
          if (Math.abs(player.movement.x) > Math.abs(player.movement.y)) {
            // Moving more horizontally than vertically
            direction = player.movement.x > 0 ? 'right' : 'left';
          } else {
            // Moving more vertically than horizontally
            direction = player.movement.y > 0 ? 'down' : 'up';
          }
        }
        
        // Get frames for this direction
        const directionFrames = textures[direction] || textures.down;
        
        // Calculate animation frame based on time or movement
        const animationSpeed = 200; // ms per frame
        const frameIndex = Math.floor(Date.now() / animationSpeed) % directionFrames.length;
        
        // Create sprite using the calculated frame
        sprite = new PIXI.Sprite(directionFrames[frameIndex]);
      } else {
        // Use default/static texture
        sprite = new PIXI.Sprite(textures.default);
      }
      
      // Set the anchor to center the sprite on the player's position
      sprite.anchor.set(0.5, 0.5);
      
      // Position the sprite at the player's position
      sprite.position.set(player.position.x, player.position.y);
      
      // Set the size
      sprite.width = CONFIG.PLAYER_SIZE;
      sprite.height = CONFIG.PLAYER_SIZE;
      
      // Add the sprite to the entity layer
      this.entityLayer.addChild(sprite);
      
      // Add slash effect for warrior when attacking
      if (player.isAttacking && charClass === 'warrior') {
        this.showWarriorSlashEffect(player);
      }
    } 
    catch (error) {
      // Log the error
      console.error(`Error creating sprite for ${isLocalPlayer ? 'local' : 'other'} player (${charClass}):`, error);
      
      // Fall back to a colored rectangle
      const playerGraphics = new PIXI.Graphics();
      
      // Draw the player as a colored rectangle
      const colors = {
        'warrior': 0xFF0000, // Red for warrior
        'mage': 0x0000FF,    // Blue for mage
        'ranger': 0x00FF00   // Green for ranger
      };
      
      const color = colors[charClass] || 0xAAAAAA;
      
      playerGraphics.lineStyle(2, 0xFFFFFF, 1.0);
      playerGraphics.beginFill(color, 0.8);
      playerGraphics.drawRect(
        player.position.x - CONFIG.PLAYER_SIZE/2, 
        player.position.y - CONFIG.PLAYER_SIZE/2, 
        CONFIG.PLAYER_SIZE, 
        CONFIG.PLAYER_SIZE
      );
      playerGraphics.endFill();
      
      // Add the graphics to the entity layer
      this.entityLayer.addChild(playerGraphics);
    }
    
    // Always add name tag
    const nameText = new PIXI.Text(
      isLocalPlayer ? 
        `YOU (${Math.round(player.position.x)},${Math.round(player.position.y)})` : 
        player.name, 
      { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF }
    );
    
    nameText.position.set(
      player.position.x - nameText.width / 2,
      player.position.y - CONFIG.PLAYER_SIZE/2 - 20
    );
    
    this.entityLayer.addChild(nameText);
  }
  
  /**
   * Show a cone-shaped slash effect for warrior attacks
   * @param {Object} player - The player (warrior) performing the attack
   */
  showWarriorSlashEffect(player) {
    // Safety check
    if (!this.effectLayer || !this.textures.effect.slash) return;
    
    // Determine facing direction (use facingDirection if available, otherwise default to 'down')
    const direction = player.facingDirection || 'down';
    
    // Get player position
    const x = player.position.x;
    const y = player.position.y;
    
    // Calculate position offset based on direction and player size
    // This positions the slash at the edge of the character model
    const offsetDistance = CONFIG.PLAYER_SIZE / 2 * 0.7; // Slightly less than half player size
    let offsetX = 0;
    let offsetY = 0;
    
    switch (direction) {
      case 'right':
        offsetX = offsetDistance;
        break;
      case 'left':
        offsetX = -offsetDistance;
        break;
      case 'down':
        offsetY = offsetDistance;
        break;
      case 'up':
        offsetY = -offsetDistance;
        break;
    }
    
    // Create slash sprite using the slash texture
    const slashEffect = new PIXI.Sprite(this.textures.effect.slash);
    
    // Set the anchor differently for each direction to ensure the slash expands outward
    switch (direction) {
      case 'right':
        slashEffect.anchor.set(0, 0.5); // Anchor at left center
        break;
      case 'left':
        slashEffect.anchor.set(1, 0.5); // Anchor at right center
        break;
      case 'down':
        slashEffect.anchor.set(0.5, 0); // Anchor at top center
        break;
      case 'up':
        slashEffect.anchor.set(0.5, 1); // Anchor at bottom center
        break;
    }
    
    // Position at player's edge
    slashEffect.position.set(x + offsetX, y + offsetY);
    
    // Set rotation based on direction
    switch (direction) {
      case 'right':
        slashEffect.rotation = 0; // 0 degrees - default orientation
        break;
      case 'down':
        slashEffect.rotation = Math.PI / 2; // 90 degrees
        break;
      case 'left':
        slashEffect.rotation = Math.PI; // 180 degrees
        break;
      case 'up':
        slashEffect.rotation = 3 * Math.PI / 2; // 270 degrees
        break;
    }
    
    // Size the effect appropriately - start smaller initially
    const baseScale = CONFIG.PLAYER_SIZE / 50; // Base scale factor
    const initialScale = baseScale * 0.3; // Start at 30% of final size
    slashEffect.scale.set(initialScale, initialScale);
    
    // Add to effect layer
    this.effectLayer.addChild(slashEffect);
    
    // Animation settings
    const startTime = Date.now();
    const duration = 300; // 300ms for the slash animation
    
    // Use a simple update function
    const animate = () => {
      try {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Scale effect during animation (start smaller, expand quickly)
        // Use an easing function for more natural expansion
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const animScale = baseScale * (initialScale + (1.1 - initialScale) * easeOutQuad);
        slashEffect.scale.set(animScale, animScale);
        
        // Add slight oscillation for a more dynamic effect
        const wobble = Math.sin(progress * Math.PI * 3) * 0.05;
        slashEffect.rotation += wobble;
        
        // For expanding outward effect, we can also slightly move the slash away from player
        const outwardDistance = 8 * progress; // Move up to 8 pixels outward
        switch (direction) {
          case 'right':
            slashEffect.position.x = x + offsetX + outwardDistance;
            break;
          case 'left':
            slashEffect.position.x = x + offsetX - outwardDistance;
            break;
          case 'down':
            slashEffect.position.y = y + offsetY + outwardDistance;
            break;
          case 'up':
            slashEffect.position.y = y + offsetY - outwardDistance;
            break;
        }
        
        // Fade out near the end
        if (progress > 0.6) {
          const fadeProgress = (progress - 0.6) / 0.4;
          slashEffect.alpha = 1 - fadeProgress;
        }
        
        // Remove when animation complete
        if (progress >= 1) {
          if (this.effectLayer.children.includes(slashEffect)) {
            this.effectLayer.removeChild(slashEffect);
          }
          return true; // Animation complete
        }
        
        return false; // Animation still running
      } catch (error) {
        console.error("Error in slash effect animation:", error);
        if (this.effectLayer && this.effectLayer.children.includes(slashEffect)) {
          this.effectLayer.removeChild(slashEffect);
        }
        return true; // Stop animation on error
      }
    };
    
    // Set up animation loop
    const runAnimation = () => {
      if (!animate()) {
        requestAnimationFrame(runAnimation);
      }
    };
    
    requestAnimationFrame(runAnimation);
    
    // Add a small complementary effect - impact particles
    this.createSlashParticles(x + offsetX, y + offsetY, direction);
  }
  
  /**
   * Create particles for the warrior slash effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} direction - Direction of the slash
   */
  createSlashParticles(x, y, direction) {
    // Don't create particles if no effect layer
    if (!this.effectLayer) return;
    
    // Create 8-12 particles
    const particleCount = 8 + Math.floor(Math.random() * 5);
    
    // Calculate direction vector
    let dirX = 0;
    let dirY = 0;
    
    switch (direction) {
      case 'right':
        dirX = 1;
        break;
      case 'left':
        dirX = -1;
        break;
      case 'down':
        dirY = 1;
        break;
      case 'up':
        dirY = -1;
        break;
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      // Create a particle
      const particle = new PIXI.Graphics();
      
      // Random size between 2-5 pixels
      const size = 2 + Math.random() * 3;
      
      // Random color (yellow to orange)
      const colorRatio = Math.random();
      const red = 255;
      const green = Math.floor(150 + (255 - 150) * colorRatio);
      const blue = 0;
      const color = (red << 16) | (green << 8) | blue;
      
      // Draw the particle
      particle.beginFill(color, 0.8);
      particle.drawCircle(0, 0, size);
      particle.endFill();
      
      // Set position with a spread pattern focused in the direction of attack
      // Calculate a cone of angles in the attack direction
      const spreadAngle = Math.PI / 3; // 60 degree spread
      const baseAngle = Math.atan2(dirY, dirX);
      const particleAngle = baseAngle + (Math.random() * spreadAngle - spreadAngle/2);
      
      // Random distance from edge (mostly forward with some variance)
      const distanceMin = 5;
      const distanceMax = 25;
      const distance = distanceMin + Math.random() * (distanceMax - distanceMin);
      
      // Set position based on angle and distance
      particle.position.set(
        x + Math.cos(particleAngle) * distance,
        y + Math.sin(particleAngle) * distance
      );
      
      // Set velocity - faster at start, spreading outward in the attack direction
      const speed = 4 + Math.random() * 4; // Slightly faster than before
      
      // Add some spread to the velocity direction
      const velocityAngle = particleAngle + (Math.random() * 0.3 - 0.15);
      particle.vx = Math.cos(velocityAngle) * speed;
      particle.vy = Math.sin(velocityAngle) * speed;
      
      // Set lifetime - shorter for more intense effect
      particle.lifetime = 200 + Math.random() * 150;
      particle.age = 0;
      
      // Add to effect layer
      this.effectLayer.addChild(particle);
      
      // Animate the particle
      const animate = () => {
        if (!particle || !this.effectLayer) return true;
        
        // Update age
        particle.age += 16.67; // Assume ~60fps
        
        // Update position
        particle.position.x += particle.vx;
        particle.position.y += particle.vy;
        
        // Apply some drag
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        
        // Fade out
        particle.alpha = 1 - (particle.age / particle.lifetime);
        
        // Remove when expired
        if (particle.age >= particle.lifetime) {
          if (this.effectLayer.children.includes(particle)) {
            this.effectLayer.removeChild(particle);
          }
          return true;
        }
        
        return false;
      };
      
      // Animation loop
      const runParticleAnimation = () => {
        if (!animate()) {
          requestAnimationFrame(runParticleAnimation);
        }
      };
      
      requestAnimationFrame(runParticleAnimation);
    }
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
    try {
      // Safety checks
      if (!this.app || !this.app.ticker || !this.effectLayer) {
        console.error("Cannot show damage text: renderer not fully initialized");
        return;
      }
      
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
      
      // Animate and remove using a simpler approach
      const startY = damageText.position.y;
      const startTime = Date.now();
      const duration = 1000; // 1 second animation
      
      // Use a simple update function
      const animate = () => {
        try {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Move up
          damageText.position.y = startY - progress * 30;
          
          // Fade out
          damageText.alpha = 1 - progress;
          
          // Remove when animation complete
          if (progress >= 1) {
            if (this.effectLayer.children.includes(damageText)) {
              this.effectLayer.removeChild(damageText);
            }
            return true; // Animation complete
          }
          return false; // Animation still running
        } catch (error) {
          console.error("Error in damage text animation:", error);
          if (this.effectLayer && this.effectLayer.children.includes(damageText)) {
            this.effectLayer.removeChild(damageText);
          }
          return true; // Stop animation on error
        }
      };
      
      // Set up a simple animation loop using requestAnimationFrame instead of ticker
      const runAnimation = () => {
        if (!animate()) {
          requestAnimationFrame(runAnimation);
        }
      };
      
      requestAnimationFrame(runAnimation);
    } catch (error) {
      console.error("Error showing damage text:", error);
    }
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
  
  /**
   * Render all projectiles
   */
  renderProjectiles() {
    // Clear projectile layer
    this.projectileLayer.removeChildren();
    
    // Render all projectiles
    if (this.game.player && this.game.player.projectiles) {
      this.game.player.projectiles.forEach(projectile => {
        this.renderProjectile(projectile);
      });
    }
    
    // Render other players' projectiles
    if (this.game.players) {
      this.game.players.forEach(player => {
        if (player && player.projectiles) {
          player.projectiles.forEach(projectile => {
            this.renderProjectile(projectile);
          });
        }
      });
    }
  }
  
  /**
   * Render a single projectile
   * @param {Object} projectile - The projectile to render
   */
  renderProjectile(projectile) {
    // Safety checks for required properties
    if (!projectile || !projectile.active || !projectile.position) return;
    
    // Create sprite based on projectile type
    let sprite;
    
    if (projectile.type === 'fireball') {
      sprite = new PIXI.Sprite(this.textures.projectile.fireball);
      
      // Only add glow filter if it exists in PIXI
      try {
        if (PIXI.filters && PIXI.filters.GlowFilter) {
          const glowFilter = new PIXI.filters.GlowFilter({
            distance: 8,
            outerStrength: 2,
            innerStrength: 1,
            color: 0xFF8000,
            quality: 0.5
          });
          
          sprite.filters = [glowFilter];
        } else {
          // Fallback: create a simple pulsing effect instead
          const pulseTime = Date.now() % 1000 / 1000;
          const scale = 1 + 0.2 * Math.sin(pulseTime * Math.PI * 2);
          sprite.scale.set(scale, scale);
        }
      } catch (error) {
        console.error("Error applying filter to fireball:", error);
      }
      
      // Add random rotation for fireballs
      sprite.rotation = Date.now() * 0.01;
    } 
    else if (projectile.type === 'arrow') {
      sprite = new PIXI.Sprite(this.textures.projectile.arrow);
      
      // Set arrow rotation based on angle
      sprite.rotation = ((projectile.angle || 0) * Math.PI) / 180;
    }
    else {
      // Default projectile if type not recognized
      sprite = new PIXI.Graphics();
      sprite.beginFill(0xFFFF00);
      sprite.drawRect(0, 0, 16, 8);
      sprite.endFill();
    }
    
    // Set position
    sprite.position.set(projectile.position.x, projectile.position.y);
    
    // Set anchor to center
    sprite.anchor.set(0.5, 0.5);
    
    // Set custom size if specified
    if (projectile.width && projectile.height) {
      sprite.width = projectile.width;
      sprite.height = projectile.height;
    }
    
    // Add to projectile layer
    this.projectileLayer.addChild(sprite);
  }
  
  /**
   * Show an explosion effect
   * @param {Object} position - Position {x, y}
   * @param {number} radius - Explosion radius
   */
  showExplosionEffect(position, radius) {
    try {
      // Safety checks
      if (!this.app || !this.effectLayer) {
        console.error("Cannot show explosion effect: renderer not fully initialized");
        return;
      }
      
      // Create explosion sprite
      const explosion = new PIXI.Graphics();
      
      // Draw explosion circle
      explosion.beginFill(0xFF5500, 0.7); // Semi-transparent orange
      explosion.drawCircle(0, 0, radius);
      explosion.endFill();
      
      // Draw inner circle
      explosion.beginFill(0xFFFF00, 0.9); // More opaque yellow
      explosion.drawCircle(0, 0, radius * 0.6);
      explosion.endFill();
      
      // Position at center
      explosion.position.set(position.x, position.y);
      
      // Add to effect layer
      this.effectLayer.addChild(explosion);
      
      // Animation settings
      const startTime = Date.now();
      const expandDuration = 200; // ms
      const fadeDuration = 300; // ms
      const totalDuration = expandDuration + fadeDuration;
      
      // Use a simple update function with requestAnimationFrame
      const animate = () => {
        try {
          const elapsed = Date.now() - startTime;
          
          // Check if animation is done
          if (elapsed >= totalDuration) {
            if (this.effectLayer.children.includes(explosion)) {
              this.effectLayer.removeChild(explosion);
            }
            return true; // Animation complete
          }
          
          // Expand phase
          if (elapsed < expandDuration) {
            const scale = 0.2 + (elapsed / expandDuration) * 0.8;
            explosion.scale.set(scale);
          } 
          // Fade phase
          else {
            const fadeTime = elapsed - expandDuration;
            const fadeProgress = fadeTime / fadeDuration;
            explosion.alpha = 1 - fadeProgress;
          }
          
          return false; // Animation still running
        } catch (error) {
          console.error("Error in explosion animation:", error);
          if (this.effectLayer && this.effectLayer.children.includes(explosion)) {
            this.effectLayer.removeChild(explosion);
          }
          return true; // Stop animation on error
        }
      };
      
      // Set up a simple animation loop using requestAnimationFrame instead of ticker
      const runAnimation = () => {
        if (!animate()) {
          requestAnimationFrame(runAnimation);
        }
      };
      
      requestAnimationFrame(runAnimation);
    } catch (error) {
      console.error("Error showing explosion effect:", error);
    }
  }
  
  /**
   * Utility method to generate character preview textures for use on the character selection screen
   * This is a workaround for the missing preview images
   */
  generateCharacterPreviews() {
    try {
      if (!this.app || !this.app.renderer) {
        console.error("Cannot generate character previews: renderer not initialized");
        return;
      }
      
      // Create warrior preview
      const warriorPreview = this.createCharacterPreview(0xFF0000, '⚔️', 'WARRIOR');
      // Create mage preview
      const magePreview = this.createCharacterPreview(0x0000FF, '🔮', 'MAGE');
      // Create ranger preview
      const rangerPreview = this.createCharacterPreview(0x00FF00, '🏹', 'RANGER');
      
      // Only console log in this method since this is just informational
      console.log("Character preview textures generated");
      console.log("Please create the following files manually:");
      console.log("- client/assets/ui/warrior-preview.png");
      console.log("- client/assets/ui/mage-preview.png");
      console.log("- client/assets/ui/ranger-preview.png");
    } catch (error) {
      console.error("Error generating character previews:", error);
    }
  }
  
  /**
   * Create a character preview texture with class-specific styling
   * @param {number} color - Base color for the character
   * @param {string} symbol - Unicode symbol to represent the class
   * @param {string} label - Class name to display
   * @returns {PIXI.Texture} The created texture
   */
  createCharacterPreview(color, symbol, label) {
    // Create graphics object
    const graphics = new PIXI.Graphics();
    const width = 300;
    const height = 200;
    
    // Draw background
    graphics.beginFill(0x333333);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    // Draw character silhouette
    graphics.beginFill(color, 0.8);
    graphics.drawCircle(width/2, height/2 - 20, 40);  // Head
    graphics.drawRect(width/2 - 30, height/2 + 20, 60, 80);  // Body
    graphics.endFill();
    
    // Create text for label
    const text = new PIXI.Text(label, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFFFFFF,
      align: 'center'
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(width/2, height - 30);
    
    // Create container for the preview
    const container = new PIXI.Container();
    container.addChild(graphics);
    container.addChild(text);
    
    // Generate texture
    return this.app.renderer.generateTexture(container);
  }

  /**
   * Generate character sprites for use in the game.
   * This is a utility method to create sprite images that can be saved.
   */
  generateCharacterSprites() {
    try {
      // Create warrior sprite
      const warriorSprite = this.createWarriorSprite();
      const mageSprite = this.createMageSprite();
      const rangerSprite = this.createRangerSprite();
      
      // Log instructions for the user
      console.log("Character sprites generated!");
      console.log("To use them in-game, save these images as:");
      console.log("- client/assets/warriorsprite.png");
      console.log("- client/assets/magesprite.png");
      console.log("- client/assets/rangersprite.png");
      
      // Image URLs for download are available in the console
      if (warriorSprite) {
        console.log("Warrior sprite URL:", warriorSprite.canvas.toDataURL());
      }
      if (mageSprite) {
        console.log("Mage sprite URL:", mageSprite.canvas.toDataURL());
      }
      if (rangerSprite) {
        console.log("Ranger sprite URL:", rangerSprite.canvas.toDataURL());
      }
    } catch (error) {
      console.error("Error generating character sprites:", error);
    }
  }

  /**
   * Create a warrior sprite
   * @returns {PIXI.RenderTexture} The warrior sprite texture
   */
  createWarriorSprite() {
    // Create a container for the warrior sprite
    const container = new PIXI.Container();
    
    // Create the body
    const body = new PIXI.Graphics();
    body.beginFill(0x8B0000); // Dark red
    body.drawRect(-20, -15, 40, 50); // Body
    body.endFill();
    
    // Create the head
    const head = new PIXI.Graphics();
    head.beginFill(0xE0AC69); // Skin tone
    head.drawCircle(0, -25, 15); // Head
    head.endFill();
    
    // Create helmet
    const helmet = new PIXI.Graphics();
    helmet.beginFill(0x888888); // Metal
    helmet.drawCircle(0, -25, 17); // Outer helmet
    helmet.endFill();
    helmet.beginFill(0xE0AC69); // Skin tone
    helmet.drawCircle(0, -25, 15); // Cut out inner circle
    helmet.endFill();
    
    // Draw helmet details
    helmet.lineStyle(3, 0x888888, 1);
    helmet.moveTo(-15, -37);
    helmet.lineTo(15, -37);
    helmet.moveTo(0, -42);
    helmet.lineTo(0, -25);
    
    // Create weapon
    const weapon = new PIXI.Graphics();
    weapon.beginFill(0x8B4513); // Brown handle
    weapon.drawRect(22, -10, 5, 40); // Handle
    weapon.endFill();
    weapon.beginFill(0xCCCCCC); // Silver blade
    weapon.drawRect(27, -30, 8, 60); // Blade
    weapon.endFill();
    
    // Create shield
    const shield = new PIXI.Graphics();
    shield.beginFill(0x964B00); // Brown shield
    shield.drawRoundedRect(-32, -15, 20, 40, 5); // Shield
    shield.endFill();
    shield.lineStyle(2, 0xCCCCCC, 1);
    shield.drawRoundedRect(-30, -13, 16, 36, 5); // Shield decoration
    
    // Add all parts to the container
    container.addChild(body, helmet, head, weapon, shield);
    
    // Create and return texture
    return this.app.renderer.generateTexture(container, {
      resolution: 1,
      region: new PIXI.Rectangle(-40, -50, 80, 100)
    });
  }

  /**
   * Create a mage sprite
   * @returns {PIXI.RenderTexture} The mage sprite texture
   */
  createMageSprite() {
    // Create a container for the mage sprite
    const container = new PIXI.Container();
    
    // Create the body (robe)
    const body = new PIXI.Graphics();
    body.beginFill(0x000080); // Dark blue robe
    body.drawRect(-15, -15, 30, 50); // Body
    body.endFill();
    
    // Create robe bottom (wider)
    const robeBottom = new PIXI.Graphics();
    robeBottom.beginFill(0x000080); // Dark blue
    robeBottom.drawPolygon([
      -15, 35, // Left top
      15, 35,  // Right top
      25, 50,  // Right bottom
      -25, 50  // Left bottom
    ]);
    robeBottom.endFill();
    
    // Create the head
    const head = new PIXI.Graphics();
    head.beginFill(0xE0AC69); // Skin tone
    head.drawCircle(0, -25, 15); // Head
    head.endFill();
    
    // Create wizard hat
    const hat = new PIXI.Graphics();
    hat.beginFill(0x000080); // Dark blue hat
    hat.drawPolygon([
      -15, -30, // Left base
      15, -30,  // Right base
      0, -65    // Top point
    ]);
    hat.endFill();
    
    // Create hat decoration - replace drawStar with standard methods
    // Draw stars as small circles
    hat.beginFill(0xFFD700); // Gold stars
    
    // First star (center)
    hat.drawCircle(0, -50, 3);
    
    // Second star (left)
    hat.drawCircle(-10, -40, 2);
    
    // Third star (right)
    hat.drawCircle(10, -45, 2.5);
    hat.endFill();
    
    // Create staff
    const staff = new PIXI.Graphics();
    staff.beginFill(0x8B4513); // Brown wood
    staff.drawRect(20, -40, 5, 80); // Staff pole
    staff.endFill();
    
    // Create magic orb on top of staff
    const orb = new PIXI.Graphics();
    orb.beginFill(0x00BFFF); // Light blue
    orb.drawCircle(22.5, -45, 10); // Orb
    orb.endFill();
    
    // Add glow to orb
    orb.beginFill(0x00BFFF, 0.5);
    orb.drawCircle(22.5, -45, 15);
    orb.endFill();
    
    // Add all parts to the container
    container.addChild(robeBottom, body, head, hat, staff, orb);
    
    // Create and return texture
    return this.app.renderer.generateTexture(container, {
      resolution: 1,
      region: new PIXI.Rectangle(-40, -70, 80, 120)
    });
  }

  /**
   * Create a ranger sprite
   * @returns {PIXI.RenderTexture} The ranger sprite texture
   */
  createRangerSprite() {
    // Create a container for the ranger sprite
    const container = new PIXI.Container();
    
    // Create the body
    const body = new PIXI.Graphics();
    body.beginFill(0x228B22); // Forest green
    body.drawRect(-15, -15, 30, 50); // Body
    body.endFill();
    
    // Create the head
    const head = new PIXI.Graphics();
    head.beginFill(0xE0AC69); // Skin tone
    head.drawCircle(0, -25, 15); // Head
    head.endFill();
    
    // Create hood
    const hood = new PIXI.Graphics();
    hood.beginFill(0x228B22); // Forest green
    hood.drawCircle(0, -25, 17); // Outer hood
    hood.endFill();
    hood.beginFill(0xE0AC69); // Skin tone
    hood.drawCircle(0, -25, 15); // Cut out inner circle for face
    hood.endFill();
    
    // Create cape
    const cape = new PIXI.Graphics();
    cape.beginFill(0x006400, 0.7); // Dark green, semi-transparent
    cape.drawPolygon([
      -15, -15, // Left top
      15, -15,  // Right top
      20, 35,   // Right bottom
      -20, 35   // Left bottom
    ]);
    cape.endFill();
    
    // Create bow
    const bow = new PIXI.Graphics();
    bow.lineStyle(3, 0x8B4513, 1); // Brown wood
    bow.moveTo(25, -40);
    bow.quadraticCurveTo(40, 0, 25, 40);
    
    // Create bowstring
    bow.lineStyle(1, 0xFFFFFF, 1);
    bow.moveTo(25, -40);
    bow.lineTo(25, 40);
    
    // Add arrow
    const arrow = new PIXI.Graphics();
    arrow.lineStyle(2, 0x8B4513, 1);
    arrow.moveTo(25, 0);
    arrow.lineTo(-5, 0);
    arrow.lineStyle(1, 0x333333, 1);
    arrow.moveTo(-5, 0);
    arrow.lineTo(-15, -5);
    arrow.moveTo(-5, 0);
    arrow.lineTo(-15, 5);
    
    // Add all parts to the container (in proper z-order)
    container.addChild(cape, body, hood, head, bow, arrow);
    
    // Create and return texture
    return this.app.renderer.generateTexture(container, {
      resolution: 1,
      region: new PIXI.Rectangle(-40, -50, 90, 100)
    });
  }
} 