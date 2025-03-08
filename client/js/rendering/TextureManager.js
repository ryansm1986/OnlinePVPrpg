/**
 * TextureManager class
 * Handles creation and loading of textures
 */
class TextureManager {
  /**
   * Create a new TextureManager
   * @param {Renderer} renderer - Reference to the renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    
    // Texture collections
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
  }
  
  /**
   * Load all game textures
   */
  loadTextures() {
    try {
      console.log("Loading textures...");
      
      // Load terrain textures
      this.textures.terrain.tree = this.createTreeTexture();
      this.textures.terrain.rock = this.createRockTexture();
      this.textures.terrain.grass = this.createGrassTexture();
      
      // Load effect textures
      this.textures.effect.explosion = [];
      for (let i = 0; i < 5; i++) {
        const size = 40 + i * 20;
        this.textures.effect.explosion.push(this.createExplosionTexture(size, 1 - (i * 0.15)));
      }
      
      // Load projectile textures
      this.loadProjectileTextures();
      
      // Load player textures
      this.loadPlayerTextures();
      
      // Load monster textures
      this.loadMonsterTextures();
      
      console.log("Textures loaded successfully");
      return true;
    } catch (error) {
      console.error("Error loading textures:", error);
      return false;
    }
  }
  
  /**
   * Load player character textures
   */
  loadPlayerTextures() {
    console.log("Loading player textures for each class...");
    // Create a simple texture for each class
    this.loadClassTexture('warrior', 'warrior');
    this.loadClassTexture('mage', 'mage');
    this.loadClassTexture('ranger', 'ranger');
  }
  
  /**
   * Load projectile textures
   */
  loadProjectileTextures() {
    this.textures.projectile = {
      fireball: this.createFireballTexture(),
      arrow: this.createArrowTexture(),
      slash: this.createSlashTexture(),
      default: this.createColoredRectTexture(0xFFFFFF, 10, 10)
    };
  }
  
  /**
   * Load monster textures
   */
  loadMonsterTextures() {
    // Create simple monster textures
    this.textures.monster.skeleton = this.createColoredRectTexture(0xCCCCCC, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    this.textures.monster.zombie = this.createColoredRectTexture(0x00CC00, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    this.textures.monster.demon = this.createColoredRectTexture(0xFF0000, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE);
    
    // Create boss textures
    this.textures.boss.dragon = this.createColoredRectTexture(0xFF4400, CONFIG.MONSTER_SIZE * 2, CONFIG.MONSTER_SIZE * 2);
    this.textures.boss.lich = this.createColoredRectTexture(0x9900FF, CONFIG.MONSTER_SIZE * 2, CONFIG.MONSTER_SIZE * 2);
  }
  
  /**
   * Load a character class texture
   * @param {string} className - Class name
   * @param {string} path - Path to texture
   */
  loadClassTexture(className, path) {
    try {
      // Log that we're loading this class texture
      console.log(`Loading texture for class ${className}`);
      
      // Creating colored rectangles based on class
      const classColors = {
        warrior: 0xFF0000, // Red
        mage: 0x0000FF,    // Blue
        ranger: 0x00FF00    // Green
      };
      
      const color = classColors[className] || 0xFFFFFF;
      
      // Ensure CONFIG.PLAYER_SIZE exists and is valid
      if (typeof CONFIG === 'undefined' || !CONFIG.PLAYER_SIZE || CONFIG.PLAYER_SIZE <= 0) {
        console.error("CONFIG.PLAYER_SIZE is missing or invalid, using default size of 32");
        CONFIG = CONFIG || {};
        CONFIG.PLAYER_SIZE = CONFIG.PLAYER_SIZE || 32;
      }
      
      console.log(`Creating texture for ${className} with size ${CONFIG.PLAYER_SIZE}x${CONFIG.PLAYER_SIZE}`);
      
      // Create a simple texture based on class color
      const texture = this.createColoredRectTexture(color, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
      
      // For a real game, you'd load actual sprites here
      // For this example, we just create colored rectangles
      const frames = {
        default: texture,
        down: [texture],
        left: [texture],
        right: [texture],
        up: [texture]
      };
      
      // Store textures by class
      this.renderer.playerTextures = this.renderer.playerTextures || {};
      this.renderer.playerTextures[className] = frames;
      
      console.log(`Successfully loaded textures for class ${className}`);
      
    } catch (error) {
      console.error(`Error loading texture for class ${className}:`, error);
      
      // Create fallback texture with explicit size
      const fallbackTexture = this.createColoredRectTexture(0x00ff00, 32, 32);
      
      // Set fallback frames
      const frames = { 
        default: fallbackTexture,
        down: [fallbackTexture],
        left: [fallbackTexture],
        right: [fallbackTexture],
        up: [fallbackTexture]
      };
      
      // Store fallback textures
      this.renderer.playerTextures = this.renderer.playerTextures || {};
      this.renderer.playerTextures[className] = frames;
    }
  }
  
  /**
   * Create a simple colored rectangle texture
   * @param {number} color - Color in hex format
   * @param {number} width - Width of the rectangle
   * @param {number} height - Height of the rectangle
   * @returns {PIXI.Texture} The created texture
   */
  createColoredRectTexture(color, width, height) {
    try {
      // Check if app is initialized
      if (!this.renderer.app || !this.renderer.app.renderer) {
        console.warn("Cannot create colored rect texture - renderer not initialized");
        // Return a 1x1 white pixel as fallback
        const fallbackGraphics = new PIXI.Graphics();
        fallbackGraphics.beginFill(0xFFFFFF);
        fallbackGraphics.drawRect(0, 0, 1, 1);
        fallbackGraphics.endFill();
        return PIXI.Texture.from(fallbackGraphics.canvas);
      }
      
      const graphics = new PIXI.Graphics();
      graphics.beginFill(color);
      graphics.drawRect(0, 0, width, height);
      graphics.endFill();
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating colored rectangle texture:", error);
      return PIXI.Texture.WHITE;
    }
  }
  
  /**
   * Create a fireball texture
   * @returns {PIXI.Texture} The created texture
   */
  createFireballTexture() {
    try {
      // Check if app is initialized
      if (!this.renderer.app || !this.renderer.app.renderer) {
        console.warn("Cannot create fireball texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0xFF0000, 20, 20);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Orange center
      graphics.beginFill(0xFF8800);
      graphics.drawCircle(10, 10, 8);
      graphics.endFill();
      
      // Red outer glow
      graphics.beginFill(0xFF4400, 0.7);
      graphics.drawCircle(10, 10, 10);
      graphics.endFill();
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating fireball texture:", error);
      return this.createColoredRectTexture(0xFF0000, 20, 20);
    }
  }
  
  /**
   * Create an arrow texture
   * @returns {PIXI.Texture} The created texture
   */
  createArrowTexture() {
    try {
      // Check if app is initialized
      if (!this.renderer.app || !this.renderer.app.renderer) {
        console.warn("Cannot create arrow texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0xBBBBBB, 20, 6);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Arrow shaft
      graphics.beginFill(0xBBBBBB);
      graphics.drawRect(0, 2, 16, 2);
      graphics.endFill();
      
      // Arrow head
      graphics.beginFill(0xBBBBBB);
      graphics.moveTo(15, 0);
      graphics.lineTo(20, 3);
      graphics.lineTo(15, 6);
      graphics.closePath();
      graphics.endFill();
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating arrow texture:", error);
      return this.createColoredRectTexture(0xBBBBBB, 20, 6);
    }
  }
  
  /**
   * Create a slash texture for melee attacks
   * @returns {PIXI.Texture} The created texture
   */
  createSlashTexture() {
    try {
      // Check if app is initialized
      if (!this.renderer.app || !this.renderer.app.renderer) {
        console.warn("Cannot create slash texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0xFFFFFF, 40, 40);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Create a slash effect (arc)
      graphics.lineStyle(3, 0xFFFFFF, 0.8);
      graphics.arc(20, 20, 18, 0, Math.PI * 1.5);
      
      graphics.lineStyle(2, 0xFFFFFF, 0.6);
      graphics.arc(20, 20, 15, 0, Math.PI * 1.5);
      
      graphics.lineStyle(1, 0xFFFFFF, 0.4);
      graphics.arc(20, 20, 12, 0, Math.PI * 1.5);
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating slash texture:", error);
      return this.createColoredRectTexture(0xFFFFFF, 40, 40);
    }
  }
  
  /**
   * Create a tree texture
   * @returns {PIXI.Texture} The created texture
   */
  createTreeTexture() {
    try {
      // Check if app is initialized
      if (!this.renderer.app || !this.renderer.app.renderer) {
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
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
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
      if (!this.renderer.app || !this.renderer.app.renderer) {
        console.warn("Cannot create rock texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0x888888, 32, 32);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Rock base
      graphics.beginFill(0x888888);
      graphics.drawEllipse(16, 18, 14, 12);
      graphics.endFill();
      
      // Rock highlights
      graphics.beginFill(0xAAAAAA);
      graphics.drawEllipse(12, 14, 4, 3);
      graphics.endFill();
      
      // Rock shadows
      graphics.beginFill(0x666666);
      graphics.drawEllipse(20, 22, 5, 4);
      graphics.endFill();
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating rock texture:", error);
      return this.createColoredRectTexture(0x888888, 32, 32);
    }
  }
  
  /**
   * Create an explosion texture
   * @param {number} size - Size of the explosion
   * @param {number} alpha - Alpha transparency
   * @returns {PIXI.Texture} The created texture
   */
  createExplosionTexture(size, alpha) {
    try {
      // Check if app is initialized
      if (!this.renderer.app || !this.renderer.app.renderer) {
        console.warn("Cannot create explosion texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0xFF8800, size, size);
      }
      
      const graphics = new PIXI.Graphics();
      const halfSize = size / 2;
      
      // Outer glow
      graphics.beginFill(0xFF4400, alpha * 0.5);
      graphics.drawCircle(halfSize, halfSize, halfSize);
      graphics.endFill();
      
      // Inner explosion
      graphics.beginFill(0xFF8800, alpha * 0.8);
      graphics.drawCircle(halfSize, halfSize, halfSize * 0.7);
      graphics.endFill();
      
      // Core
      graphics.beginFill(0xFFFF00, alpha);
      graphics.drawCircle(halfSize, halfSize, halfSize * 0.3);
      graphics.endFill();
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating explosion texture:", error);
      return this.createColoredRectTexture(0xFF8800, size, size);
    }
  }
  
  /**
   * Create a grass texture for ground tiles
   * @returns {PIXI.Texture} The created texture
   */
  createGrassTexture() {
    try {
      // Check if app is initialized
      if (!this.renderer.app || !this.renderer.app.renderer) {
        console.warn("Cannot create grass texture - renderer not initialized");
        // Return a simple fallback texture
        return this.createColoredRectTexture(0x33AA33, 64, 64);
      }
      
      const graphics = new PIXI.Graphics();
      
      // Base grass color
      graphics.beginFill(0x33AA33); // Medium green
      graphics.drawRect(0, 0, 64, 64);
      graphics.endFill();
      
      // Add some texture/detail with varied greens
      for (let i = 0; i < 20; i++) {
        // Random positions within the tile
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        const size = 2 + Math.random() * 4;
        
        // Slightly varied green colors
        const green = 0.6 + Math.random() * 0.4; // Value between 0.6 and 1
        const color = PIXI.utils.rgb2hex([0, green, 0]);
        
        graphics.beginFill(color, 0.7);
        graphics.drawCircle(x, y, size);
        graphics.endFill();
      }
      
      const texture = this.renderer.app.renderer.generateTexture(graphics);
      
      // Clean up the graphics object
      graphics.destroy();
      
      return texture;
    } catch (error) {
      console.error("Error creating grass texture:", error);
      return this.createColoredRectTexture(0x33AA33, 64, 64);
    }
  }
  
  /**
   * Clean up resources when manager is destroyed
   */
  destroy() {
    // Destroy all textures
    for (const category in this.textures) {
      for (const key in this.textures[category]) {
        const texture = this.textures[category][key];
        
        if (Array.isArray(texture)) {
          texture.forEach(t => t.destroy && t.destroy(true));
        } else if (texture && texture.destroy) {
          texture.destroy(true);
        }
      }
    }
    
    // Clear texture references
    this.textures = {};
    
    console.log("TextureManager destroyed");
  }
} 