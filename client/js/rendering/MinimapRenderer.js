/**
 * MinimapRenderer class
 * Handles rendering of the minimap
 */
class MinimapRenderer {
  /**
   * Create a new MinimapRenderer
   * @param {Renderer} renderer - Reference to the renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.minimapGraphics = null;
    this.minimapTexture = null;
  }
  
  /**
   * Initialize the minimap
   */
  init() {
    console.log("Initializing Minimap Renderer");
    // Create minimap graphics object
    this.minimapGraphics = new PIXI.Graphics();
    
    // Add to minimap container
    this.renderer.minimapContainer.addChild(this.minimapGraphics);
  }
  
  /**
   * Update the minimap
   */
  updateMinimap() {
    // Skip if no app available
    if (!this.renderer.app) return;
    
    // Clear previous graphics
    this.minimapGraphics.clear();
    
    // Calculate minimap position and dimensions
    const minimapSize = Math.min(200, Math.min(this.renderer.app.screen.width, this.renderer.app.screen.height) * 0.2);
    const borderWidth = 2;
    const minimapX = this.renderer.app.screen.width - minimapSize - 20; // 20px padding from right
    const minimapY = 20; // 20px padding from top
    
    // Draw minimap background
    this.minimapGraphics.beginFill(0x000000, 0.5);
    this.minimapGraphics.lineStyle(borderWidth, 0xFFFFFF, 0.8);
    this.minimapGraphics.drawRect(minimapX, minimapY, minimapSize, minimapSize);
    this.minimapGraphics.endFill();
    
    // Calculate minimap scale
    const minimapScale = CONFIG.MINIMAP_SCALE || 0.1;
    
    // Only try to render terrain and entities if game data is available
    if (this.renderer.terrainRenderer && this.renderer.terrainRenderer.terrainFeatures) {
      this.renderMinimapTerrain(minimapX, minimapY, minimapSize, minimapScale);
    }
    
    // Render player on minimap if available
    if (this.renderer.game && this.renderer.game.player) {
      this.renderMinimapPlayer(minimapX, minimapY, minimapSize, minimapScale);
    }
  }
  
  /**
   * Render terrain features on the minimap
   * @param {number} x - Minimap X position
   * @param {number} y - Minimap Y position
   * @param {number} size - Minimap size
   * @param {number} scale - Scale factor
   */
  renderMinimapTerrain(x, y, size, scale) {
    // Draw trees as small green dots
    this.minimapGraphics.beginFill(0x006400, 0.7);
    for (const feature of this.renderer.terrainRenderer.terrainFeatures) {
      if (feature.type === 'tree') {
        this.minimapGraphics.drawCircle(
          x + feature.position.x * scale,
          y + feature.position.y * scale,
          1.5
        );
      }
    }
    this.minimapGraphics.endFill();
    
    // Draw rocks as small gray dots
    this.minimapGraphics.beginFill(0x808080, 0.7);
    for (const feature of this.renderer.terrainRenderer.terrainFeatures) {
      if (feature.type === 'rock') {
        this.minimapGraphics.drawCircle(
          x + feature.position.x * scale,
          y + feature.position.y * scale,
          1
        );
      }
    }
    this.minimapGraphics.endFill();
  }
  
  /**
   * Render player on the minimap
   * @param {number} x - Minimap X position
   * @param {number} y - Minimap Y position
   * @param {number} size - Minimap size
   * @param {number} scale - Scale factor
   */
  renderMinimapPlayer(x, y, size, scale) {
    const player = this.renderer.game.player;
    
    // Draw player as a bright dot
    this.minimapGraphics.beginFill(0x00FF00);
    this.minimapGraphics.drawCircle(
      x + player.position.x * scale,
      y + player.position.y * scale,
      3
    );
    this.minimapGraphics.endFill();
    
    // Draw player view area
    const visibleAreaWidth = CONFIG.GAME_WIDTH / this.renderer.camera.zoom;
    const visibleAreaHeight = CONFIG.GAME_HEIGHT / this.renderer.camera.zoom;
    
    this.minimapGraphics.lineStyle(1, 0xFFFF00, 0.5);
    this.minimapGraphics.drawRect(
      x + (this.renderer.camera.x - visibleAreaWidth/2) * scale,
      y + (this.renderer.camera.y - visibleAreaHeight/2) * scale,
      visibleAreaWidth * scale,
      visibleAreaHeight * scale
    );
  }
  
  /**
   * Reposition minimap on screen resize
   */
  repositionMinimap() {
    this.updateMinimap();
  }
  
  /**
   * Clean up resources when renderer is destroyed
   */
  destroy() {
    if (this.minimapGraphics) {
      this.minimapGraphics.destroy();
      this.minimapGraphics = null;
    }
    
    if (this.minimapTexture) {
      this.minimapTexture.destroy();
      this.minimapTexture = null;
    }
    
    console.log("MinimapRenderer destroyed");
  }
} 