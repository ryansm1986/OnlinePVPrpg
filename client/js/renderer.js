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
    // Store reference to game
    this.game = game;
    
    // PixiJS application
    this.app = null;
    
    // Camera
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    };
    
    // Animation tracking to prevent memory leaks
    this.activeAnimations = [];
    this.animationCleanupInterval = null;
    
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
      projectile: {},
      terrain: {}
    };
    
    // Terrain features collection
    this.terrainFeatures = [];
    this.terrainInitialized = false;
    
    // Initialize player textures to avoid null references
    this.playerTextures = {};
    
    // Safely bind methods
    if (typeof this.render === 'function') {
      this.render = this.render.bind(this);
    } else {
      // Create default render method if it doesn't exist
      this.render = function() {
        console.log("Default render method called - renderer not fully initialized");
      }.bind(this);
    }
    
    if (typeof this.resize === 'function') {
      this.resize = this.resize.bind(this);
    } else {
      // Create default resize method if it doesn't exist
      this.resize = function() {
        console.log("Default resize method called - renderer not fully initialized");
      }.bind(this);
    }
  }
  
  /**
   * Initialize the renderer
   */
  init() {
    try {
      // Create PixiJS application
      this.app = new PIXI.Application({
        width: CONFIG.GAME_WIDTH,
        height: CONFIG.GAME_HEIGHT,
        backgroundColor: 0x000000,
        antialias: true
      });
      
      // Add canvas to document
      document.getElementById('game-container').appendChild(this.app.view);
      
      // Initialize playerTextures as an object with fallback values
      this.playerTextures = {
        warrior: { 
          default: this.createColoredRectTexture(0xff0000, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE),
          down: [this.createColoredRectTexture(0xff0000, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          left: [this.createColoredRectTexture(0xff0000, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          right: [this.createColoredRectTexture(0xff0000, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          up: [this.createColoredRectTexture(0xff0000, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)]
        },
        mage: { 
          default: this.createColoredRectTexture(0x0000ff, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE),
          down: [this.createColoredRectTexture(0x0000ff, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          left: [this.createColoredRectTexture(0x0000ff, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          right: [this.createColoredRectTexture(0x0000ff, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          up: [this.createColoredRectTexture(0x0000ff, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)]
        },
        ranger: { 
          default: this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE),
          down: [this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          left: [this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          right: [this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)],
          up: [this.createColoredRectTexture(0x00ff00, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)]
        }
      };
      
      // Create containers
      this.createContainers();
      
      // Load textures
      this.loadTextures();
      
      // Generate character previews for character selection screen
      try {
        console.log("Generating character previews...");
        this.generateCharacterPreviews();
      } catch (error) {
        console.error("Error generating character previews:", error);
      }
      
      // Set up resize handler
      window.addEventListener('resize', this.resize);
      
      // Set up ticker (animation loop)
      this.app.ticker.add(this.render);
      
      // Set up animation cleanup interval
      this.setupAnimationCleanup();
      
      // Debug message
      console.log("Renderer initialized successfully!");
    } catch (error) {
      console.error("Error initializing renderer:", error);
      throw error; // Re-throw to allow game to handle
    }
  }
  
  /**
   * Setup animation cleanup interval
   */
  setupAnimationCleanup() {
    // Clean up animations every 5 seconds
    this.animationCleanupInterval = setInterval(() => {
      this.cleanupAnimations();
    }, 5000);
    
    // Bind visibility change handler
    this.handleVisibilityChange = () => {
      if (document.hidden) {
        this.cleanupAnimations();
      }
    };
    
    // Add visibility change listener to clean up when tab is not visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  /**
   * Track an animation for potential cleanup
   * @param {Object} animation - Animation object to track
   * @param {PIXI.DisplayObject} sprite - The sprite associated with the animation
   * @param {PIXI.Container} container - The container the sprite is in
   * @param {number} maxAge - Maximum age in milliseconds before forced cleanup
   */
  trackAnimation(animation) {
    if (!animation) return;
    
    this.activeAnimations.push({
      id: Date.now() + Math.random(),
      startTime: Date.now(),
      animation: animation,
      maxAge: animation.maxAge || 5000 // Default 5 seconds max lifetime
    });
  }
  
  /**
   * Clean up animations that may have been abandoned
   */
  cleanupAnimations() {
    const now = Date.now();
    const expired = [];
    
    // Find expired animations
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const anim = this.activeAnimations[i];
      if (now - anim.startTime > anim.maxAge) {
        expired.push(anim);
        this.activeAnimations.splice(i, 1);
      }
    }
    
    // Force cleanup of expired animations
    expired.forEach(anim => {
      if (anim.animation.cleanup && typeof anim.animation.cleanup === 'function') {
        try {
          anim.animation.cleanup();
        } catch (e) {
          console.error("Error cleaning up animation:", e);
        }
      }
    });
    
    // Log debug info
    if (expired.length > 0 && this.game.debugMode) {
      console.log(`Cleaned up ${expired.length} expired animations`);
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
   * Generate character preview images for the character selection screen
   */
  generateCharacterPreviews() {
    try {
      // Find all character preview elements in the HTML
      const previewElements = document.querySelectorAll('.character-preview');
      
      if (!previewElements || previewElements.length === 0) {
        console.warn("No character preview elements found in the DOM");
        return;
      }
      
      console.log(`Found ${previewElements.length} character preview elements`);
      
      // Process each preview element
      previewElements.forEach(element => {
        // Get the class name from the data attribute
        const className = element.getAttribute('data-class-name');
        if (!className) {
          console.warn("Character preview element missing data-class-name attribute:", element);
          return;
        }
        
        try {
          // Create a temporary PIXI application for rendering the preview
          const app = new PIXI.Application({
            width: 100,
            height: 100,
            transparent: true
          });
          
          // Create a sprite representing the character
          let sprite;
          
          // Use the appropriate texture based on the class
          if (className.toLowerCase() === 'warrior') {
            sprite = new PIXI.Sprite(this.playerTextures.warrior.default);
          } else if (className.toLowerCase() === 'mage') {
            sprite = new PIXI.Sprite(this.playerTextures.mage.default);
          } else if (className.toLowerCase() === 'ranger') {
            sprite = new PIXI.Sprite(this.playerTextures.ranger.default);
          } else {
            console.warn(`Unknown class name: ${className}`);
            // Use a fallback texture
            sprite = new PIXI.Sprite(this.createColoredRectTexture(0xCCCCCC, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE));
          }
          
          // Position the sprite in the center of the preview
          sprite.anchor.set(0.5);
          sprite.position.set(app.renderer.width / 2, app.renderer.height / 2);
          sprite.scale.set(1.5); // Make it a bit larger for visibility
          
          // Add the sprite to the application
          app.stage.addChild(sprite);
          
          // Render the application once
          app.render();
          
          // Add the canvas to the preview element
          element.appendChild(app.view);
          
          // Store reference for cleanup later
          if (!this.characterPreviews) {
            this.characterPreviews = [];
          }
          this.characterPreviews.push(app);
          
          console.log(`Generated preview for ${className}`);
        } catch (previewError) {
          console.error(`Error generating preview for ${className}:`, previewError);
        }
      });
    } catch (error) {
      console.error("Error generating character previews:", error);
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
    this.loadMonsterTextures();
    this.loadProjectileTextures();
    this.loadExplosionTextures();
    
    // Copy the player textures to the main textures object
    this.textures.player = { ...this.playerTextures };
    
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
    this.textures.tile = {};
    this.textures.tile.grass = this.createColoredRectTexture(0x228B22, 32, 32);
    this.textures.tile.water = this.createColoredRectTexture(0x1E90FF, 32, 32);
    this.textures.tile.stone = this.createColoredRectTexture(0x808080, 32, 32);
    this.textures.tile.sand = this.createColoredRectTexture(0xF4A460, 32, 32);
    
    // Terrain textures
    this.textures.terrain = {};
    this.textures.terrain.tree = this.createTreeTexture();
    this.textures.terrain.rock = this.createRockTexture();
    this.textures.terrain.grass = this.createGrassTexture(); // Add grass texture
    
    console.log("Texture loading complete");
  }
  
  /**
   * Load player textures
   */
  loadPlayerTextures() {
    this.playerTextures = {};
    
    // Load warrior texture
    const warriorPath = '/assets/classes/warrior/warriorsprite.png';
    this.loadClassTextureWithAnimation('warrior', warriorPath);
    
    // Load mage texture
    const magePath = '/assets/classes/mage/magesprite.png';
    this.loadClassTextureWithAnimation('mage', magePath);
    
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
      
      console.log(`${className} sprite dimensions: ${spritesheetWidth}x${spritesheetHeight}. baseTexture.width: ${baseTexture.width} and baseTexture.height: ${baseTexture.height}`);
      
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
        const frameWidth = 64;
        const frameHeight = 64;
        
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
    try {
      // Check if app is initialized
      if (!this.app || !this.app.renderer) {
        // If app isn't initialized yet, create a temporary renderer to generate the texture
        const tempRenderer = PIXI.autoDetectRenderer 
          ? new PIXI.autoDetectRenderer({width: width, height: height})
          : new PIXI.Renderer({width: width, height: height});
        
        const graphics = new PIXI.Graphics();
        graphics.beginFill(color);
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();
        
        return tempRenderer.generateTexture(graphics);
      }
      
      // Normal path when app is initialized
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color);
      graphics.drawRect(0, 0, width, height);
      graphics.endFill();
      return this.app.renderer.generateTexture(graphics);
    } catch (error) {
      console.error("Error creating colored rectangle texture:", error);
      
      // Create and return a minimal texture as fallback (1x1 pixel)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      ctx.fillRect(0, 0, 1, 1);
      
      return PIXI.Texture.from(canvas);
    }
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
   * Create a tree texture
   * @returns {PIXI.Texture} The created texture
   */
  createTreeTexture() {
    try {
      // Check if app is initialized
      if (!this.app || !this.app.renderer) {
        console.warn("Cannot create tree texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0x008800, 96, 96);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Tree trunk - scaled up for larger trees
      graphics.beginFill(0x8B4513); // Brown
      graphics.drawRect(36, 60, 24, 36);
      graphics.endFill();
      
      // Tree foliage - scaled up for larger trees
      graphics.beginFill(0x228B22); // Forest Green
      graphics.drawCircle(48, 36, 48);
      graphics.endFill();
      
      // Add some detail to the foliage - scaled up for larger trees
      graphics.beginFill(0x006400); // Dark Green
      graphics.drawCircle(30, 24, 15);
      graphics.drawCircle(66, 30, 18);
      graphics.drawCircle(48, 12, 15);
      graphics.endFill();
      
      const texture = this.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object to prevent memory leaks
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating tree texture:", error);
      // Return a simple fallback texture
      return this.createColoredRectTexture(0x008800, 96, 96);
    }
  }
  
  /**
   * Create a rock texture
   * @returns {PIXI.Texture} The created texture
   */
  createRockTexture() {
    try {
      // Check if app is initialized
      if (!this.app || !this.app.renderer) {
        console.warn("Cannot create rock texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0x808080, 32, 32);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Main rock shape
      graphics.beginFill(0x808080); // Gray
      graphics.drawEllipse(16, 20, 16, 12);
      graphics.endFill();
      
      // Add some highlights
      graphics.beginFill(0xA9A9A9); // Dark Gray
      graphics.drawEllipse(12, 16, 6, 4);
      graphics.drawEllipse(20, 18, 4, 3);
      graphics.endFill();
      
      const texture = this.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object to prevent memory leaks
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating rock texture:", error);
      // Return a simple fallback texture
      return this.createColoredRectTexture(0x808080, 32, 32);
    }
  }
  
  /**
   * Create a grass texture
   * @returns {PIXI.Texture} The created texture
   */
  createGrassTexture() {
    try {
      // Check if app is initialized
      if (!this.app || !this.app.renderer) {
        console.warn("Cannot create grass texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0x7CFC00, 32, 32);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Base grass
      graphics.beginFill(0x7CFC00); // Lawn Green
      graphics.drawRect(0, 0, 32, 32);
      graphics.endFill();
      
      // Add some grass blades with fewer operations to reduce memory usage
      graphics.lineStyle(1, 0x006400); // Dark Green
      
      // Draw fewer grass blades (5 instead of 10)
      for (let i = 0; i < 5; i++) {
        const x = 5 + i * 5; // More predictable positioning instead of random
        const height = 4 + (i % 3) * 2; // Varied but predictable heights
        
        graphics.moveTo(x, 32);
        graphics.lineTo(x - 2, 32 - height);
        
        graphics.moveTo(x, 32);
        graphics.lineTo(x + 2, 32 - height);
      }
      
      const texture = this.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object to prevent memory leaks
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating grass texture:", error);
      // Return a simple fallback texture
      return this.createColoredRectTexture(0x7CFC00, 32, 32);
    }
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
        this.logRenderState ? this.logRenderState() : console.error("logRenderState not available");
        return;
      }
      
      // Initialize terrain if not already done
      if (!this.terrainInitialized && typeof this.generateTerrainFeatures === 'function') {
        this.generateTerrainFeatures();
        if (typeof this.updateVisibleTerrain === 'function') {
          this.updateVisibleTerrain();
        }
        this.terrainInitialized = true;
      }
      
      // Clear entity layer (but not ground layer which has terrain)
      this.entityLayer.removeChildren();
      this.itemLayer.removeChildren();
      
      // Update camera
      if (typeof this.updateCamera === 'function') {
        this.updateCamera();
      }
      
      // Render world (only if not already done)
      if (typeof this.renderWorld === 'function') {
        this.renderWorld();
      }
      
      // Render entities
      if (typeof this.renderEntities === 'function') {
        this.renderEntities();
      }
      
      // Render projectiles
      if (typeof this.renderProjectiles === 'function') {
        this.renderProjectiles();
      }
      
      // Render UI
      if (typeof this.renderUI === 'function') {
        this.renderUI();
      }
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
      
      // Use a simple green background for grass instead of blue
      graphics.beginFill(0x2d801e); // Green for grass
      graphics.drawRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
      graphics.endFill();
      
      // Draw a grid
      graphics.lineStyle(2, 0xFFFFFF, 0.3);
      for (let i = 0; i <= CONFIG.WORLD_WIDTH; i += 500) {
        // Vertical line
        graphics.moveTo(i, 0);
        graphics.lineTo(i, CONFIG.WORLD_HEIGHT);
        
        // Horizontal line
        graphics.moveTo(0, i);
        graphics.lineTo(CONFIG.WORLD_WIDTH, i);
        
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
      
      // Ensure camera doesn't go out of world bounds
      const visibleWidth = CONFIG.GAME_WIDTH;
      const visibleHeight = CONFIG.GAME_HEIGHT;
      
      // Calculate camera bounds
      const minX = visibleWidth / 2;
      const maxX = CONFIG.WORLD_WIDTH - visibleWidth / 2;
      const minY = visibleHeight / 2;
      const maxY = CONFIG.WORLD_HEIGHT - visibleHeight / 2;
      
      // Clamp camera position to bounds
      this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
      this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
      
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
      // Smooth camera following
      const targetX = this.game.player.position.x;
      const targetY = this.game.player.position.y;
      
      // Smoothly interpolate camera position
      this.camera.x += (targetX - this.camera.x) * CONFIG.CAMERA_LERP;
      this.camera.y += (targetY - this.camera.y) * CONFIG.CAMERA_LERP;
      
      // Ensure camera doesn't go out of world bounds
      // Calculate visible area dimensions
      const visibleWidth = CONFIG.GAME_WIDTH / this.camera.zoom;
      const visibleHeight = CONFIG.GAME_HEIGHT / this.camera.zoom;
      
      // Calculate camera bounds to keep visible area within world
      const minX = visibleWidth / 2;
      const maxX = CONFIG.WORLD_WIDTH - visibleWidth / 2;
      const minY = visibleHeight / 2;
      const maxY = CONFIG.WORLD_HEIGHT - visibleHeight / 2;
      
      // Clamp camera position to bounds
      this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
      this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
      
      // Apply camera transform to world container
      this.worldContainer.position.x = CONFIG.GAME_WIDTH / 2 - this.camera.x * this.camera.zoom;
      this.worldContainer.position.y = CONFIG.GAME_HEIGHT / 2 - this.camera.y * this.camera.zoom;
      this.worldContainer.scale.x = this.camera.zoom;
      this.worldContainer.scale.y = this.camera.zoom;
      
      // Update which terrain features are visible - only when camera moves significantly
      // This prevents updating every frame which could cause performance issues
      const cameraMoved = 
        !this.lastCameraPosition || 
        Math.abs(this.camera.x - this.lastCameraPosition.x) > 50 || 
        Math.abs(this.camera.y - this.lastCameraPosition.y) > 50;
      
      if (cameraMoved) {
        this.updateVisibleTerrain();
        this.lastCameraPosition = { x: this.camera.x, y: this.camera.y };
      }
    }
  }
  
  /**
   * Render the game world (ground, terrain, etc.)
   */
  renderWorld() {
    // Only create the grid graphics once
    if (!this.gridGraphics) {
      this.gridGraphics = new PIXI.Graphics();
      this.groundLayer.addChild(this.gridGraphics);
      
      // Draw grid
      this.gridGraphics.clear();
      
      // Create a tiling grass sprite for the world background (memory efficient)
      if (!this.grassBackground) {
        // Use TilingSprite for a memory-efficient repeating background
        this.grassBackground = new PIXI.TilingSprite(
          this.textures.terrain.grass,
          CONFIG.WORLD_WIDTH,
          CONFIG.WORLD_HEIGHT
        );
        this.grassBackground.position.set(0, 0);
        
        // Add the grass background as the first child (bottom layer)
        this.groundLayer.addChildAt(this.grassBackground, 0);
      }
      
      // Add a semi-transparent grid over the grass
      this.gridGraphics.lineStyle(1, 0x666666, 0.3); // Make grid lines more visible but subtle
      
      const gridSize = 100;
      const worldWidth = CONFIG.WORLD_WIDTH;
      const worldHeight = CONFIG.WORLD_HEIGHT;
      
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
      
      // Add coordinate labels at 1000-pixel intervals (fewer labels for the larger map)
      for (let x = 0; x <= worldWidth; x += 1000) {
        for (let y = 0; y <= worldHeight; y += 1000) {
          const coordText = new PIXI.Text(
            `(${x},${y})`, 
            { fontFamily: 'Arial', fontSize: 10, fill: 0xFFFFFF }
          );
          coordText.position.set(x + 2, y + 2);
          this.groundLayer.addChild(coordText);
        }
      }
      
      // Generate terrain features if not already done
      if (!this.terrainInitialized) {
        this.generateTerrainFeatures();
        this.terrainInitialized = true;
      }
    }
  }
  
  /**
   * Generate terrain features (trees, rocks, etc.)
   */
  generateTerrainFeatures() {
    // Create a container for terrain features if it doesn't exist
    if (!this.terrainContainer) {
      this.terrainContainer = new PIXI.Container();
      this.groundLayer.addChild(this.terrainContainer);
    } else {
      // Clear existing terrain to prevent memory leaks
      this.terrainContainer.removeChildren();
    }
    
    const worldWidth = CONFIG.WORLD_WIDTH;
    const worldHeight = CONFIG.WORLD_HEIGHT;
    
    // Use reduced counts from config to address memory issues
    const numTrees = CONFIG.TERRAIN.MAX_TREES;
    const numRocks = CONFIG.TERRAIN.MAX_ROCKS;
    
    console.log(`Generating ${numTrees} trees and ${numRocks} rocks (total: ${numTrees + numRocks})`);
    
    // Store terrain feature data for collision detection but with minimal memory footprint
    this.terrainFeatures = [];
    
    // Generate positions and properties first without creating sprites yet
    // This allows us to implement culling and only render visible elements
    for (let i = 0; i < numTrees; i++) {
      // Random position within world bounds (keep away from the edges)
      const x = Math.random() * (worldWidth - 100) + 50;
      const y = Math.random() * (worldHeight - 100) + 50;
      
      // Random size within configured range
      const sizeRatio = Math.random() * 
        (CONFIG.TERRAIN.TREE_SIZE.max - CONFIG.TERRAIN.TREE_SIZE.min) + 
        CONFIG.TERRAIN.TREE_SIZE.min;
      const scale = sizeRatio / 32; // Normalize by texture size
      
      // Store terrain feature data
      this.terrainFeatures.push({
        type: 'tree',
        position: { x, y },
        scale: scale,
        radius: 20 * scale, // Significantly increased collision radius for trees (from 14 to 20)
        sprite: null // Will be created only when visible
      });
    }
    
    // Create rocks
    for (let i = 0; i < numRocks; i++) {
      // Random position within world bounds (keep away from the edges)
      const x = Math.random() * (worldWidth - 100) + 50;
      const y = Math.random() * (worldHeight - 100) + 50;
      
      // Random size within configured range
      const sizeRatio = Math.random() * 
        (CONFIG.TERRAIN.ROCK_SIZE.max - CONFIG.TERRAIN.ROCK_SIZE.min) + 
        CONFIG.TERRAIN.ROCK_SIZE.min;
      const scale = sizeRatio / 32; // Normalize by texture size
      
      // Store terrain feature data
      this.terrainFeatures.push({
        type: 'rock',
        position: { x, y },
        scale: scale,
        radius: 12 * scale, // Collision radius
        sprite: null // Will be created only when visible
      });
    }
    
    // Initial render of visible terrain
    this.updateVisibleTerrain();
  }
  
  /**
   * Update which terrain features are visible and render only those
   * This significantly reduces memory usage by not rendering off-screen elements
   */
  updateVisibleTerrain() {
    // Skip if no camera or terrain features
    if (!this.camera || !this.terrainFeatures || !this.terrainContainer) return;
    
    try {
      // Calculate visible area bounds with a larger margin for the bigger map
      const visibleAreaWidth = CONFIG.GAME_WIDTH / this.camera.zoom;
      const visibleAreaHeight = CONFIG.GAME_HEIGHT / this.camera.zoom;
      
      // Use a larger margin (200px) for the larger map to prevent pop-in
      const margin = 200;
      
      const visibleBounds = {
        left: this.camera.x - visibleAreaWidth / 2 - margin,
        right: this.camera.x + visibleAreaWidth / 2 + margin,
        top: this.camera.y - visibleAreaHeight / 2 - margin,
        bottom: this.camera.y + visibleAreaHeight / 2 + margin
      };
      
      // Count visible features for debugging
      let visibleCount = 0;
      let newlyVisibleCount = 0;
      let newlyHiddenCount = 0;
      
      // Limit the number of new sprites created per frame to reduce memory spikes
      const maxNewSpritesPerFrame = 20; // Cap new sprites per update
      let newSpritesCreated = 0;
      
      // Remove sprites for features that are now out of view
      for (const feature of this.terrainFeatures) {
        const isVisible = 
          feature.position.x >= visibleBounds.left && 
          feature.position.x <= visibleBounds.right &&
          feature.position.y >= visibleBounds.top && 
          feature.position.y <= visibleBounds.bottom;
        
        if (feature.sprite && !isVisible) {
          // Remove sprite for off-screen feature to save memory
          this.terrainContainer.removeChild(feature.sprite);
          feature.sprite.destroy({children: true, texture: false, baseTexture: false});
          feature.sprite = null;
          newlyHiddenCount++;
        } else if (!feature.sprite && isVisible) {
          // Only create a limited number of new sprites per frame
          if (newSpritesCreated < maxNewSpritesPerFrame) {
            // Create sprite for newly visible features
            this.createTerrainSprite(feature);
            newSpritesCreated++;
            newlyVisibleCount++;
          }
          visibleCount++;
        } else if (feature.sprite && isVisible) {
          visibleCount++;
        }
      }
      
      // Log debug info about terrain visibility (only occasionally to reduce console spam)
      if (Math.random() < 0.05) { // Only log ~5% of the time
        console.log(`Terrain update: ${visibleCount} visible, +${newlyVisibleCount} new, -${newlyHiddenCount} hidden`);
      }
    } catch (error) {
      console.error("Error updating visible terrain:", error);
    }
  }
  
  /**
   * Create a sprite for a terrain feature
   * @param {Object} feature - The terrain feature data
   */
  createTerrainSprite(feature) {
    try {
      // Skip if feature already has a sprite
      if (feature.sprite) return;
      
      let texture;
      if (feature.type === 'tree') {
        texture = this.textures.terrain.tree;
      } else { // rock
        texture = this.textures.terrain.rock;
      }
      
      // Create sprite
      const sprite = new PIXI.Sprite(texture);
      sprite.position.set(feature.position.x, feature.position.y);
      
      // Set correct anchor based on type
      if (feature.type === 'tree') {
        sprite.anchor.set(0.5, 0.9); // Adjusted anchor for better tree positioning (trunk at bottom)
      } else {
        sprite.anchor.set(0.5, 0.5); // Center for rocks
      }
      
      // Apply correct scaling based on feature type
      if (feature.type === 'tree') {
        sprite.scale.set(feature.scale, feature.scale);
      } else {
        sprite.scale.set(feature.scale, feature.scale);
      }
      
      // Store sprite reference and add to container
      feature.sprite = sprite;
      this.terrainContainer.addChild(sprite);
      
    } catch (error) {
      console.error("Error creating terrain sprite:", error);
    }
  }
  
  /**
   * Render all game entities (players, monsters, items)
   */
  renderEntities() {
    // Clear entity layer
    this.entityLayer.removeChildren();
    this.itemLayer.removeChildren();
    
    // Cache for reusing item graphics objects
    if (!this._itemGraphicsCache) {
      this._itemGraphicsCache = new Map();
    }
    
    // Remove any stale cache entries
    const currentItemIds = new Set(Array.from(this.game.items.keys()));
    for (const itemId of this._itemGraphicsCache.keys()) {
      if (!currentItemIds.has(itemId)) {
        const graphics = this._itemGraphicsCache.get(itemId);
        if (graphics) {
          graphics.destroy();
        }
        this._itemGraphicsCache.delete(itemId);
      }
    }
    
    // Draw items
    this.game.items.forEach((item, itemId) => {
      // Reuse graphics object if it exists
      let graphics = this._itemGraphicsCache.get(itemId);
      if (!graphics) {
        graphics = new PIXI.Graphics();
        this._itemGraphicsCache.set(itemId, graphics);
      } else {
        graphics.clear();
      }
      
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
    
    // Cache for reusing player text objects
    if (!this._playerTextCache) {
      this._playerTextCache = new Map();
    }
    
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
    
    // Cache for reusing monster graphics and text objects
    if (!this._monsterGraphicsCache) {
      this._monsterGraphicsCache = new Map();
    }
    
    if (!this._monsterTextCache) {
      this._monsterTextCache = new Map();
    }
    
    // Remove any stale cache entries
    const currentMonsterIds = new Set(Array.from(this.game.monsters.keys()));
    for (const monsterId of this._monsterGraphicsCache.keys()) {
      if (!currentMonsterIds.has(monsterId)) {
        const graphics = this._monsterGraphicsCache.get(monsterId);
        if (graphics) {
          graphics.destroy();
        }
        this._monsterGraphicsCache.delete(monsterId);
        
        const text = this._monsterTextCache.get(monsterId);
        if (text) {
          text.destroy();
        }
        this._monsterTextCache.delete(monsterId);
      }
    }
    
    // Draw monsters
    this.game.monsters.forEach((monster, monsterId) => {
      try {
        let sprite;
        
        // Get the appropriate texture for this monster type
        const texture = this.textures.monster[monster.type.toLowerCase()];
        
        if (texture) {
          // Reuse sprite if it exists in cache
          sprite = this._monsterGraphicsCache.get(monsterId);
          if (!sprite) {
            sprite = new PIXI.Sprite(texture);
            this._monsterGraphicsCache.set(monsterId, sprite);
            
            // Set the anchor to center
            sprite.anchor.set(0.5, 0.5);
            
            // Set size based on monster type
            const monsterSize = monster.type === 'wolf' ? 48 : 40; // Larger size for wolf
            sprite.width = monsterSize;
            sprite.height = monsterSize;
          }
          
          // Update position
          sprite.position.set(monster.position.x, monster.position.y);
        } else {
          // Fallback to simple shape if texture not found
          sprite = this._monsterGraphicsCache.get(monsterId);
          if (!sprite) {
            sprite = new PIXI.Graphics();
            this._monsterGraphicsCache.set(monsterId, sprite);
          } else if (sprite instanceof PIXI.Graphics) {
            sprite.clear();
          }
          
          sprite.lineStyle(2, 0xFFFFFF, 1.0);
          sprite.beginFill(0xFF0000, 0.8);
          
          const monsterSize = 40;
          sprite.moveTo(monster.position.x, monster.position.y - monsterSize/2);
          sprite.lineTo(monster.position.x + monsterSize/2, monster.position.y + monsterSize/2);
          sprite.lineTo(monster.position.x - monsterSize/2, monster.position.y + monsterSize/2);
          sprite.closePath();
          sprite.endFill();
        }
        
        // Add or reuse monster type label
        let nameText = this._monsterTextCache.get(monsterId);
        const labelText = `${monster.type} (${Math.round(monster.position.x)},${Math.round(monster.position.y)})`;
        
        if (!nameText) {
          nameText = new PIXI.Text(labelText, { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF });
          this._monsterTextCache.set(monsterId, nameText);
        } else {
          nameText.text = labelText;
        }
        
        nameText.position.set(
          monster.position.x - nameText.width / 2,
          monster.position.y - (monster.type === 'wolf' ? 44 : 40) // Adjust label position for wolf
        );
        
        // Add to entity layer
        this.entityLayer.addChild(sprite);
        this.entityLayer.addChild(nameText);
      } catch (error) {
        console.error(`Error rendering monster ${monster.type}:`, error);
      }
    });
  }
  
  /**
   * Render a player using either a sprite or a fallback graphic
   * @param {Object} player - The player to render
   * @param {boolean} isLocalPlayer - Whether this is the local player
   */
  renderPlayerSprite(player, isLocalPlayer) {
    // Comprehensive null checks to prevent errors
    if (!player) {
      console.warn("Cannot render player: player is undefined");
      return;
    }
    
    if (!player.position || typeof player.position.x !== 'number' || typeof player.position.y !== 'number') {
      console.warn("Cannot render player: invalid position", player.id, player.position);
      return;
    }
    
    // Ensure playerTextures exists
    if (!this.playerTextures) {
      console.warn("playerTextures not initialized, creating fallback textures");
      this.playerTextures = {};
    }
    
    // Initialize cache for player sprites if not exists
    if (!this._playerSpriteCache) {
      this._playerSpriteCache = new Map();
    }
    
    // Initialize cache for player text labels if not exists
    if (!this._playerTextCache) {
      this._playerTextCache = new Map();
    }

    const charClass = player.characterClass || 'warrior';
    const playerId = player.id || 'local-player';
    
    // Ensure textures for this class exist
    if (!this.playerTextures[charClass]) {
      console.warn(`No textures found for class ${charClass}, creating fallback`);
      const fallbackColor = charClass === 'warrior' ? 0xFF0000 : 
                           charClass === 'mage' ? 0x0000FF : 0x00FF00;
      
      const fallbackTexture = this.createColoredRectTexture(fallbackColor, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
      this.playerTextures[charClass] = { 
        default: fallbackTexture,
        down: [fallbackTexture],
        left: [fallbackTexture],
        right: [fallbackTexture],
        up: [fallbackTexture]
      };
    }
    
    try {
      // Get the textures for this class
      const textures = this.playerTextures[charClass];
      
      // Create or reuse sprite
      let sprite = this._playerSpriteCache.get(playerId);
      
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
        
        // Get the current texture
        const currentTexture = directionFrames[frameIndex];
        
        // Create sprite if it doesn't exist, or update texture if it does
        if (!sprite) {
          // Create new sprite
          sprite = new PIXI.Sprite(currentTexture);
          this._playerSpriteCache.set(playerId, sprite);
          
          // Set the anchor to center the sprite on the player's position
          sprite.anchor.set(0.5, 0.5);
          
          // Set the size
          sprite.width = CONFIG.PLAYER_SIZE;
          sprite.height = CONFIG.PLAYER_SIZE;
        } else {
          // Update existing sprite texture
          sprite.texture = currentTexture;
        }
      } else {
        // Use default/static texture
        if (!sprite) {
          // Create new sprite
          sprite = new PIXI.Sprite(textures.default);
          this._playerSpriteCache.set(playerId, sprite);
          
          // Set the anchor to center the sprite on the player's position
          sprite.anchor.set(0.5, 0.5);
          
          // Set the size
          sprite.width = CONFIG.PLAYER_SIZE;
          sprite.height = CONFIG.PLAYER_SIZE;
        } else {
          // Update existing sprite texture
          sprite.texture = textures.default;
        }
      }
      
      // Update position
      sprite.position.set(player.position.x, player.position.y);
      
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
      
      // Get or create fallback graphics
      let playerGraphics = this._playerSpriteCache.get(playerId);
      if (!playerGraphics || !(playerGraphics instanceof PIXI.Graphics)) {
        // Create new graphics
        playerGraphics = new PIXI.Graphics();
        this._playerSpriteCache.set(playerId, playerGraphics);
      } else {
        // Clear existing graphics
        playerGraphics.clear();
      }
      
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
    
    // Get or create name text
    let nameText = this._playerTextCache.get(playerId);
    const displayText = isLocalPlayer ? 
      `YOU (${Math.round(player.position.x)},${Math.round(player.position.y)})` : 
      player.name;
      
    if (!nameText) {
      // Create new text
      nameText = new PIXI.Text(displayText, { fontFamily: 'Arial', fontSize: 12, fill: 0xFFFFFF });
      this._playerTextCache.set(playerId, nameText);
    } else {
      // Update existing text
      nameText.text = displayText;
    }
    
    // Update position
    nameText.position.set(
      player.position.x - nameText.width / 2,
      player.position.y - CONFIG.PLAYER_SIZE/2 - 20
    );
    
    this.entityLayer.addChild(nameText);
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
      
      // Position explosion
      explosion.position.set(position.x, position.y);
      
      // Add to effect layer
      this.effectLayer.addChild(explosion);
      
      // Flag to track if animation is still active
      let isActive = true;
      
      // Animate the explosion
      const animate = () => {
        // Check if animation should continue
        if (!isActive) return;
        
        // Get current explosion props
        let currentAlpha = explosion.alpha;
        let currentScale = explosion.scale.x;
        
        // Update alpha (fade out)
        currentAlpha -= 0.05;
        explosion.alpha = currentAlpha;
        
        // Update scale (expand)
        currentScale += 0.1;
        explosion.scale.set(currentScale, currentScale);
        
        // Continue animation or clean up
        if (currentAlpha > 0) {
          requestAnimationFrame(animate);
        } else {
          // Clean up
          cleanup();
        }
      };
      
      // Cleanup function
      const cleanup = () => {
        if (!isActive) return; // Prevent double cleanup
        
        isActive = false;
        
        // Remove the explosion if it's still in the effect layer
        if (explosion && explosion.parent === this.effectLayer) {
          this.effectLayer.removeChild(explosion);
        }
      };
      
      // Create animation object for tracking
      const animation = {
        startTime: Date.now(),
        maxAge: 2000, // 2 seconds max lifetime
        cleanup: cleanup
      };
      
      // Track the animation for cleanup
      this.trackAnimation(animation);
      
      // Start animation
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error showing explosion effect:", error);
    }
  }
  
  /**
   * Show damage text above a target
   * @param {number} x - The x position in world coordinates
   * @param {number} y - The y position in world coordinates
   * @param {number} damage - The damage amount to display
   */
  showDamageText(x, y, damage) {
    try {
      if (!this.app || !this.worldContainer) {
        console.warn("Cannot show damage text: renderer not fully initialized");
        return;
      }
      
      // Convert world coordinates to screen coordinates
      const screenPos = this.worldToScreen(x, y);
      
      // Create a PIXI Text object for the damage
      const damageText = new PIXI.Text(`${damage}`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#e74c3c',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      });
      
      // Position the text
      damageText.anchor.set(0.5, 0.5);
      damageText.position.set(screenPos.x, screenPos.y - 20);
      
      // Add the text to the UI container (so it's not affected by camera)
      this.uiContainer.addChild(damageText);
      
      // Flag to track if animation is still active
      let isActive = true;
      
      // Animate the text
      const duration = 1000; // Animation duration in milliseconds
      const startTime = performance.now();
      
      const animate = () => {
        // Check if still active
        if (!isActive) return;
        
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Move the text upward and fade it out
        damageText.position.y = screenPos.y - 20 - (progress * 30);
        damageText.alpha = 1 - progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          cleanup();
        }
      };
      
      // Cleanup function
      const cleanup = () => {
        if (!isActive) return; // Prevent double cleanup
        
        isActive = false;
        
        // Remove the text if it's still in the UI container
        if (damageText && damageText.parent === this.uiContainer) {
          this.uiContainer.removeChild(damageText);
        }
      };
      
      // Create animation object for tracking
      const animation = {
        startTime: Date.now(),
        maxAge: 2000, // 2 seconds max lifetime
        cleanup: cleanup
      };
      
      // Track the animation for cleanup
      this.trackAnimation(animation);
      
      // Start the animation
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error showing damage text:", error);
    }
  }
  
  /**
   * Play hit animation on a target
   * @param {Object} target - The target entity
   */
  playHitAnimation(target) {
    try {
      if (!this.app || !this.effectLayer) {
        console.warn("Cannot play hit animation: renderer not fully initialized");
        return;
      }
      
      if (!target || !target.position) {
        console.warn("Cannot play hit animation: invalid target");
        return;
      }
      
      // Create a flash effect
      const flash = new PIXI.Graphics();
      flash.beginFill(0xFF0000, 0.5);
      flash.drawCircle(0, 0, 30);
      flash.endFill();
      
      // Position the flash at the target
      flash.position.set(target.position.x, target.position.y);
      
      // Add to effect layer
      this.effectLayer.addChild(flash);
      
      // Flag to track if animation is still active
      let isActive = true;
      
      // Animate the flash effect
      const duration = 300; // Animation duration in milliseconds
      const startTime = performance.now();
      
      const animate = () => {
        // Check if still active
        if (!isActive) return;
        
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Scale down and fade out
        flash.scale.set(1 + progress);
        flash.alpha = 1 - progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          cleanup();
        }
      };
      
      // Cleanup function
      const cleanup = () => {
        if (!isActive) return; // Prevent double cleanup
        
        isActive = false;
        
        // Remove the flash if it's still in the effect layer
        if (flash && flash.parent === this.effectLayer) {
          this.effectLayer.removeChild(flash);
        }
      };
      
      // Create animation object for tracking
      const animation = {
        startTime: Date.now(),
        maxAge: 1000, // 1 second max lifetime
        cleanup: cleanup
      };
      
      // Track the animation for cleanup
      this.trackAnimation(animation);
      
      // Start the animation
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error playing hit animation:", error);
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
    // Skip if no app available
    if (!this.app) return;
    
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
    
    // Create or reuse minimap graphics
    if (!this._minimapGraphics) {
      this._minimapGraphics = new PIXI.Graphics();
      this.minimapContent.addChild(this._minimapGraphics);
    } else {
      this._minimapGraphics.clear();
    }
    
    // Reference to graphics for easier access
    const minimapGraphics = this._minimapGraphics;
    
    // Determine minimap scale based on world size
    const worldSize = Math.max(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    const minimapSize = 130;
    const minimapScale = minimapSize / worldSize;
    
    // Draw world border
    minimapGraphics.lineStyle(1, 0xFFFFFF, 0.5);
    minimapGraphics.drawRect(0, 0, CONFIG.WORLD_WIDTH * minimapScale, CONFIG.WORLD_HEIGHT * minimapScale);
    
    // Draw terrain features if available
    if (this.terrainFeatures && this.terrainFeatures.length > 0) {
      // Draw trees as small green dots
      minimapGraphics.beginFill(0x006400, 0.7);
      for (const feature of this.terrainFeatures) {
        if (feature.type === 'tree') {
          minimapGraphics.drawCircle(
            feature.position.x * minimapScale,
            feature.position.y * minimapScale,
            1
          );
        }
      }
      minimapGraphics.endFill();
      
      // Draw rocks as small gray dots
      minimapGraphics.beginFill(0x808080, 0.7);
      for (const feature of this.terrainFeatures) {
        if (feature.type === 'rock') {
          minimapGraphics.drawCircle(
            feature.position.x * minimapScale,
            feature.position.y * minimapScale,
            0.8
          );
        }
      }
      minimapGraphics.endFill();
    }
    
    // Draw player on minimap
    if (this.game.player) {
      minimapGraphics.beginFill(0x00FF00);
      minimapGraphics.drawCircle(
        this.game.player.position.x * minimapScale,
        this.game.player.position.y * minimapScale,
        3
      );
      minimapGraphics.endFill();
      
      // Draw viewport rectangle showing what's visible in the game window
      const visibleAreaWidth = CONFIG.GAME_WIDTH / this.camera.zoom;
      const visibleAreaHeight = CONFIG.GAME_HEIGHT / this.camera.zoom;
      
      minimapGraphics.lineStyle(1, 0xFFFF00, 0.8);
      minimapGraphics.drawRect(
        (this.camera.x - visibleAreaWidth/2) * minimapScale,
        (this.camera.y - visibleAreaHeight/2) * minimapScale,
        visibleAreaWidth * minimapScale,
        visibleAreaHeight * minimapScale
      );
    }
    
    // Draw other players
    if (this.game.players) {
      minimapGraphics.beginFill(0x0000FF);
      this.game.players.forEach(player => {
        minimapGraphics.drawCircle(
          player.position.x * minimapScale,
          player.position.y * minimapScale,
          2
        );
      });
      minimapGraphics.endFill();
    }
    
    // Draw monsters
    if (this.game.monsters) {
      minimapGraphics.beginFill(0xFF0000);
      this.game.monsters.forEach(monster => {
        minimapGraphics.drawCircle(
          monster.position.x * minimapScale,
          monster.position.y * minimapScale,
          2
        );
      });
      minimapGraphics.endFill();
    }
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    // Make sure we have initialized containers first
    if (!this.worldContainer) {
      console.warn("Cannot convert screen to world coordinates: worldContainer not initialized");
      return { x: 0, y: 0 };
    }
    
    // Get world position by applying the inverse of the camera transform
    const worldX = (screenX - CONFIG.GAME_WIDTH / 2) / this.camera.zoom + this.camera.x;
    const worldY = (screenY - CONFIG.GAME_HEIGHT / 2) / this.camera.zoom + this.camera.y;
    
    return { x: worldX, y: worldY };
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    // Make sure we have initialized containers first
    if (!this.worldContainer) {
      console.warn("Cannot convert world to screen coordinates: worldContainer not initialized");
      return { x: 0, y: 0 };
    }
    
    // Apply camera transform to convert world coordinates to screen coordinates
    const screenX = (worldX - this.camera.x) * this.camera.zoom + CONFIG.GAME_WIDTH / 2;
    const screenY = (worldY - this.camera.y) * this.camera.zoom + CONFIG.GAME_HEIGHT / 2;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Render all projectiles
   */
  renderProjectiles() {
    // Skip if projectile layer doesn't exist
    if (!this.projectileLayer) {
      console.warn("No projectile layer initialized");
      return;
    }
    
    // Create projectile sprite cache if not exists
    if (!this._projectileSpritePool) {
      this._projectileSpritePool = {
        fireball: [],
        arrow: [],
        default: []
      };
    }
    
    // Clear projectile layer but save sprites for reuse
    const spritesToReuse = [];
    for (let i = 0; i < this.projectileLayer.children.length; i++) {
      const sprite = this.projectileLayer.children[i];
      // Skip any non-sprite objects
      if (!(sprite instanceof PIXI.Sprite || sprite instanceof PIXI.Graphics)) continue;
      
      // Determine type based on texture
      let type = 'default';
      if (sprite.texture === this.textures.projectile.fireball) {
        type = 'fireball';
      } else if (sprite.texture === this.textures.projectile.arrow) {
        type = 'arrow';
      }
      
      // Store in the pool
      this._projectileSpritePool[type].push(sprite);
    }
    
    // Clear projectile layer
    this.projectileLayer.removeChildren();
    
    // Helper function to render a single projectile using sprite pooling
    const renderSingleProjectile = (projectile) => {
      if (!projectile || !projectile.active || !projectile.position) return;
      
      // Get a sprite from the pool or create a new one
      let sprite;
      let type = projectile.type || 'default';
      
      if (type === 'fireball') {
        if (this._projectileSpritePool.fireball.length > 0) {
          sprite = this._projectileSpritePool.fireball.pop();
        } else {
          sprite = new PIXI.Sprite(this.textures.projectile.fireball || this.createFireballTexture());
        }
        
        // Add rotation for fireballs
        sprite.rotation = Date.now() * 0.005;
      } 
      else if (type === 'arrow') {
        if (this._projectileSpritePool.arrow.length > 0) {
          sprite = this._projectileSpritePool.arrow.pop();
        } else {
          sprite = new PIXI.Sprite(this.textures.projectile.arrow || this.createArrowTexture());
        }
        
        // Set arrow rotation based on angle
        sprite.rotation = ((projectile.angle || 0) * Math.PI) / 180;
      }
      else {
        // Default projectile
        if (this._projectileSpritePool.default.length > 0) {
          sprite = this._projectileSpritePool.default.pop();
          
          // If it's a graphics object, clear it
          if (sprite instanceof PIXI.Graphics) {
            sprite.clear();
            sprite.beginFill(0xFFFF00);
            sprite.drawRect(0, 0, 16, 8);
            sprite.endFill();
          }
        } else {
          // Create a new default sprite
          sprite = new PIXI.Graphics();
          sprite.beginFill(0xFFFF00);
          sprite.drawRect(0, 0, 16, 8);
          sprite.endFill();
        }
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
    };
    
    // Render all projectiles
    if (this.game.player && this.game.player.projectiles) {
      this.game.player.projectiles.forEach(projectile => {
        renderSingleProjectile(projectile);
      });
    }
    
    // Render other players' projectiles
    if (this.game.players) {
      this.game.players.forEach(player => {
        if (player && player.projectiles) {
          player.projectiles.forEach(projectile => {
            renderSingleProjectile(projectile);
          });
        }
      });
    }
    
    // Limit pool size to avoid memory bloat
    const maxPoolSize = 50; // Maximum sprites to keep in each pool
    
    if (this._projectileSpritePool.fireball.length > maxPoolSize) {
      // Remove excess sprites
      const toRemove = this._projectileSpritePool.fireball.splice(0, this._projectileSpritePool.fireball.length - maxPoolSize);
      toRemove.forEach(sprite => sprite.destroy());
    }
    
    if (this._projectileSpritePool.arrow.length > maxPoolSize) {
      // Remove excess sprites
      const toRemove = this._projectileSpritePool.arrow.splice(0, this._projectileSpritePool.arrow.length - maxPoolSize);
      toRemove.forEach(sprite => sprite.destroy());
    }
    
    if (this._projectileSpritePool.default.length > maxPoolSize) {
      // Remove excess sprites
      const toRemove = this._projectileSpritePool.default.splice(0, this._projectileSpritePool.default.length - maxPoolSize);
      toRemove.forEach(sprite => sprite.destroy());
    }
  }
  
  /**
   * Show a slash effect for warrior attacks
   * @param {Object} player - The player entity performing the slash
   */
  showWarriorSlashEffect(player) {
    try {
      // Safety checks
      if (!this.app || !this.effectLayer) {
        console.error("Cannot show warrior slash effect: renderer not fully initialized");
        return;
      }
      
      // Create slash sprite using the slash texture
      const slash = new PIXI.Sprite(this.textures.effect.slash);
      
      // Set origin to center for proper rotation
      slash.anchor.set(0.5, 0.5);
      
      // Position slash in front of player based on direction
      const offsetDistance = 40;
      let offsetX = 0;
      let offsetY = 0;
      
      // Determine direction of slash based on player direction
      if (player.facingDirection) {
        switch (player.facingDirection) {
          case 'up':
            offsetY = -offsetDistance;
            slash.rotation = -Math.PI / 2; // -90 degrees
            break;
          case 'down':
            offsetY = offsetDistance;
            slash.rotation = Math.PI / 2; // 90 degrees
            break;
          case 'left':
            offsetX = -offsetDistance;
            slash.rotation = Math.PI; // 180 degrees
            break;
          case 'right':
            offsetX = offsetDistance;
            slash.rotation = 0; // 0 degrees
            break;
        }
      }
      
      // Position slash at player position plus offset
      slash.position.set(player.position.x + offsetX, player.position.y + offsetY);
      
      // Set initial scale and alpha
      slash.scale.set(0.5, 0.5);
      slash.alpha = 0.9;
      
      // Add to effect layer
      this.effectLayer.addChild(slash);
      
      // Flag to track if animation is still active
      let isActive = true;
      
      // Animate the slash
      const animate = () => {
        // Check if still active
        if (!isActive) return;
        
        // Get current slash props
        let currentAlpha = slash.alpha;
        let currentScale = slash.scale.x;
        
        // Update alpha (fade out)
        currentAlpha -= 0.1;
        slash.alpha = currentAlpha;
        
        // Update scale (expand slightly)
        currentScale += 0.2;
        slash.scale.set(currentScale, currentScale);
        
        // Continue animation or clean up
        if (currentAlpha > 0) {
          requestAnimationFrame(animate);
        } else {
          cleanup();
        }
      };
      
      // Cleanup function
      const cleanup = () => {
        if (!isActive) return; // Prevent double cleanup
        
        isActive = false;
        
        // Remove the slash if it's still in the effect layer
        if (slash && slash.parent === this.effectLayer) {
          this.effectLayer.removeChild(slash);
        }
      };
      
      // Create animation object for tracking
      const animation = {
        startTime: Date.now(),
        maxAge: 1000, // 1 second max lifetime
        cleanup: cleanup
      };
      
      // Track the animation for cleanup
      this.trackAnimation(animation);
      
      // Start animation
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error showing warrior slash effect:", error);
    }
  }

  /**
   * Load monster textures
   */
  loadMonsterTextures() {
    // Initialize monster textures if not already done
    if (!this.textures.monster) {
      this.textures.monster = {};
    }

    try {
      // Load wolf sprite
      this.textures.monster.wolf = PIXI.Texture.from('/assets/sprites/wolfsprite.png');
      console.log("Successfully loaded wolf sprite");
    } catch (error) {
      console.error("Failed to load wolf sprite, using fallback:", error);
      this.textures.monster.wolf = this.createColoredRectTexture(0x888888, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    }

    // Other monster textures (fallbacks)
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
  }

  /**
   * Clean up resources before game destruction
   */
  destroy() {
    try {
      // Clear animation cleanup interval
      if (this.animationCleanupInterval) {
        clearInterval(this.animationCleanupInterval);
        this.animationCleanupInterval = null;
      }
      
      // Force cleanup of all active animations
      this.cleanupAnimations();
      
      // Clear all event listeners
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      
      // Destroy all sprites and containers
      if (this.app) {
        // Clean up all terrain sprites
        if (this.terrainFeatures) {
          for (const feature of this.terrainFeatures) {
            if (feature.sprite) {
              feature.sprite.destroy({children: true, texture: false, baseTexture: false});
              feature.sprite = null;
            }
          }
        }
        
        // Clean up all sprite maps
        [this.playerSprites, this.monsterSprites, this.bossSprites, this.itemSprites, this.projectileSprites].forEach(spriteMap => {
          if (spriteMap) {
            spriteMap.forEach(sprite => {
              if (sprite) sprite.destroy({children: true, texture: false, baseTexture: false});
            });
            spriteMap.clear();
          }
        });
        
        // Destroy all containers and their children
        const containersToDestroy = [
          this.worldContainer, this.uiContainer, this.minimapContainer, 
          this.groundLayer, this.itemLayer, this.entityLayer, 
          this.effectLayer, this.projectileLayer, this.terrainContainer,
          this.minimapContent
        ];
        
        containersToDestroy.forEach(container => {
          if (container) {
            container.removeChildren();
            container.destroy({children: true});
          }
        });
        
        // Destroy all textures
        Object.values(this.textures).forEach(category => {
          Object.values(category).forEach(texture => {
            if (texture && texture.destroy) {
              texture.destroy(true);
            }
          });
        });
        
        // Clean up the PixiJS application
        this.app.destroy(true, {
          children: true,
          texture: true,
          baseTexture: true
        });
        this.app = null;
      }
      
      // Clear references to reduce memory usage
      this.terrainFeatures = null;
      this.textures = null;
      this.playerTextures = null;
      this.gridGraphics = null;
      this.grassBackground = null;
      
      console.log("Renderer resources cleaned up successfully");
    } catch (error) {
      console.error("Error cleaning up renderer resources:", error);
    }
  }
} 