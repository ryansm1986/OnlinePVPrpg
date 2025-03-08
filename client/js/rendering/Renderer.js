/**
 * Main Renderer class
 * Coordinates all rendering subsystems for the game
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
    
    // Initialize managers
    this.textureManager = new TextureManager(this);
    this.animationManager = new AnimationManager(this);
    this.entityRenderer = new EntityRenderer(this);
    this.terrainRenderer = new TerrainRenderer(this);
    this.uiRenderer = new UIRenderer(this);
    this.effectsRenderer = new EffectsRenderer(this);
    this.minimapRenderer = new MinimapRenderer(this);
    
    // Containers
    this.worldContainer = null;
    this.uiContainer = null;
    this.minimapContainer = null;
    
    // Layer references (created by TerrainRenderer)
    this.groundLayer = null;
    this.itemLayer = null;
    this.entityLayer = null;
    this.effectLayer = null;
    this.projectileLayer = null;
    
    // Safely bind methods
    this.render = this.render.bind(this);
    this.resize = this.resize.bind(this);
  }
  
  /**
   * Initialize the renderer
   */
  init() {
    try {
      // Ensure CONFIG is defined
      if (typeof CONFIG === 'undefined') {
        console.error("CONFIG is not defined, using default values");
        window.CONFIG = {
          GAME_WIDTH: window.innerWidth,
          GAME_HEIGHT: window.innerHeight,
          PLAYER_SIZE: 32,
          CAMERA_LERP: 0.1
        };
      }
      
      // Create PixiJS application
      this.app = new PIXI.Application({
        width: CONFIG.GAME_WIDTH || window.innerWidth,
        height: CONFIG.GAME_HEIGHT || window.innerHeight,
        backgroundColor: 0x000000,
        antialias: true
      });
      
      // Add canvas to document
      document.getElementById('game-container').appendChild(this.app.view);
      
      // Initialize subsystems
      this.createContainers();
      this.textureManager.loadTextures();
      this.terrainRenderer.init();
      this.uiRenderer.init();
      this.minimapRenderer.init();
      
      // Set up animation cleanup
      this.animationManager.setupAnimationCleanup();
      
      // Start render loop
      this.app.ticker.add(this.render);
      
      // Handle window resizing
      window.addEventListener('resize', this.resize);
      this.resize();
      
      console.log("Renderer initialized successfully");
      
      return true;
    } catch (error) {
      console.error("Failed to initialize renderer:", error);
      return false;
    }
  }
  
  /**
   * Create main containers for rendering
   */
  createContainers() {
    // Create world container (for game world)
    this.worldContainer = new PIXI.Container();
    this.app.stage.addChild(this.worldContainer);
    
    // Create layers within world container
    this.groundLayer = new PIXI.Container();
    this.itemLayer = new PIXI.Container();
    this.entityLayer = new PIXI.Container();
    this.effectLayer = new PIXI.Container();
    this.projectileLayer = new PIXI.Container();
    
    // Add layers to world container
    this.worldContainer.addChild(this.groundLayer);
    this.worldContainer.addChild(this.itemLayer);
    this.worldContainer.addChild(this.entityLayer);
    this.worldContainer.addChild(this.projectileLayer);
    this.worldContainer.addChild(this.effectLayer);
    
    // Create UI container (for HUD, menus, etc.)
    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.uiContainer);
    
    // Create minimap container
    this.minimapContainer = new PIXI.Container();
    this.uiContainer.addChild(this.minimapContainer);
  }
  
  /**
   * Main render method, called each frame
   * @param {number} delta - Time since last frame
   */
  render(delta) {
    if (!this.game.isRunning) return;
    
    try {
      // Update camera position
      this.updateCamera();
      
      // Render world elements
      this.terrainRenderer.updateVisibleTerrain();
      this.entityRenderer.renderEntities();
      this.entityRenderer.renderProjectiles();
      
      // Render UI elements
      this.uiRenderer.renderUI();
      this.minimapRenderer.updateMinimap();
    } catch (error) {
      console.error("Error in render loop:", error);
      this.drawEmergencyWorld();
    }
  }
  
  /**
   * Update camera position to follow player
   */
  updateCamera() {
    if (!this.game.player) return;
    
    // Target position (player's position)
    const targetX = this.game.player.position.x;
    const targetY = this.game.player.position.y;
    
    // Smoothly interpolate camera position (lerp)
    this.camera.x += (targetX - this.camera.x) * CONFIG.CAMERA_LERP;
    this.camera.y += (targetY - this.camera.y) * CONFIG.CAMERA_LERP;
    
    // Apply camera position to world container
    this.worldContainer.position.x = this.app.screen.width / 2 - this.camera.x * this.camera.zoom;
    this.worldContainer.position.y = this.app.screen.height / 2 - this.camera.y * this.camera.zoom;
    
    // Apply zoom
    this.worldContainer.scale.set(this.camera.zoom);
  }
  
  /**
   * Handle window resize
   */
  resize() {
    // Update canvas size
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    
    // Update UI positioning
    this.uiRenderer.repositionUI();
    this.minimapRenderer.repositionMinimap();
  }
  
  /**
   * Draw an emergency fallback world if rendering fails
   */
  drawEmergencyWorld() {
    try {
      console.error("Falling back to emergency rendering mode");
      
      // Clear existing content
      while (this.app.stage.children.length > 0) {
        this.app.stage.removeChildAt(0);
      }
      
      // Create a new container for emergency rendering
      const emergencyContainer = new PIXI.Container();
      this.app.stage.addChild(emergencyContainer);
      
      // Draw a simple background
      const background = new PIXI.Graphics();
      background.beginFill(0x000000);
      background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      background.endFill();
      emergencyContainer.addChild(background);
      
      // Draw a simple player representation
      this.drawEmergencyPlayer(emergencyContainer);
      
      // Add text notice
      const text = new PIXI.Text("Emergency Rendering Mode", {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xff0000
      });
      text.position.set(20, 20);
      emergencyContainer.addChild(text);
    } catch (error) {
      console.error("Even emergency rendering failed:", error);
    }
  }
  
  /**
   * Draw a simple player representation in emergency mode
   * @param {PIXI.Container} container - Container to draw in
   */
  drawEmergencyPlayer(container) {
    if (!this.game.player) return;
    
    const graphics = new PIXI.Graphics();
    
    // Draw a simple circle for the player
    graphics.beginFill(0xff0000);
    graphics.drawCircle(this.app.screen.width / 2, this.app.screen.height / 2, 20);
    graphics.endFill();
    
    container.addChild(graphics);
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - X coordinate on screen
   * @param {number} screenY - Y coordinate on screen
   * @returns {Object} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.app.screen.width / 2) / this.camera.zoom + this.camera.x,
      y: (screenY - this.app.screen.height / 2) / this.camera.zoom + this.camera.y
    };
  }
  
  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - X coordinate in world
   * @param {number} worldY - Y coordinate in world
   * @returns {Object} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom + this.app.screen.width / 2,
      y: (worldY - this.camera.y) * this.camera.zoom + this.app.screen.height / 2
    };
  }
  
  /**
   * Clean up resources when renderer is destroyed
   */
  destroy() {
    // Remove event listeners
    window.removeEventListener('resize', this.resize);
    
    // Stop animation cleanup
    this.animationManager.clearAnimationCleanup();
    
    // Destroy all subsystems
    this.textureManager.destroy();
    this.animationManager.destroy();
    this.entityRenderer.destroy();
    this.terrainRenderer.destroy();
    this.uiRenderer.destroy();
    this.effectsRenderer.destroy();
    this.minimapRenderer.destroy();
    
    // Destroy PIXI application
    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true
      });
      this.app = null;
    }
    
    console.log("Renderer destroyed");
  }
} 