/**
 * TerrainRenderer class
 * Handles terrain generation and rendering
 */
class TerrainRenderer {
  /**
   * Create a new TerrainRenderer
   * @param {Renderer} renderer - Reference to the renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    
    // Terrain container (created in init)
    this.terrainContainer = null;
    
    // Terrain features collection
    this.terrainFeatures = [];
    this.terrainInitialized = false;
    
    // Visible terrain tracking
    this.visibleFeatures = new Set();
  }
  
  /**
   * Initialize the terrain renderer
   */
  init() {
    // Create a container for terrain features if it doesn't exist
    if (!this.terrainContainer) {
      this.terrainContainer = new PIXI.Container();
      this.renderer.groundLayer.addChild(this.terrainContainer);
    }
    
    // Generate initial terrain
    this.generateTerrainFeatures();
    
    this.terrainInitialized = true;
  }
  
  /**
   * Generate terrain features (trees, rocks, etc.)
   */
  generateTerrainFeatures() {
    // Clear existing terrain to prevent memory leaks
    if (this.terrainContainer) {
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
        radius: 20 * scale, // Significantly increased collision radius for trees
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
   * Update which terrain features are visible and should be rendered
   */
  updateVisibleTerrain() {
    if (!this.renderer.app || !this.terrainInitialized) return;
    
    try {
      // Camera bounds with generous padding for culling
      const cameraBounds = this.getCameraBounds(300); // 300px padding
      
      // Track which features should be visible
      const newVisibleFeatures = new Set();
      
      // First pass: determine which features should be visible
      for (let i = 0; i < this.terrainFeatures.length; i++) {
        const feature = this.terrainFeatures[i];
        
        // Quick check if feature is in camera view (with padding)
        if (this.isFeatureVisible(feature, cameraBounds)) {
          newVisibleFeatures.add(i);
          
          // Create sprite if it doesn't exist
          if (!feature.sprite) {
            this.createTerrainSprite(feature);
          }
        } else {
          // Feature is not visible, remove sprite if it exists
          if (feature.sprite) {
            feature.sprite.parent.removeChild(feature.sprite);
            feature.sprite.destroy();
            feature.sprite = null;
          }
        }
      }
      
      // Update visible features cache
      this.visibleFeatures = newVisibleFeatures;
      
    } catch (error) {
      console.error("Error updating visible terrain:", error);
    }
  }
  
  /**
   * Get camera bounds with padding for culling calculations
   * @param {number} padding - Padding to add around camera bounds
   * @returns {Object} Camera bounds with padding
   */
  getCameraBounds(padding) {
    const camera = this.renderer.camera;
    const appWidth = this.renderer.app.screen.width;
    const appHeight = this.renderer.app.screen.height;
    
    // Calculate visible area in world space
    const visibleWidth = (appWidth / camera.zoom);
    const visibleHeight = (appHeight / camera.zoom);
    
    // Calculate bounds with padding
    return {
      left: camera.x - (visibleWidth / 2) - padding,
      right: camera.x + (visibleWidth / 2) + padding,
      top: camera.y - (visibleHeight / 2) - padding,
      bottom: camera.y + (visibleHeight / 2) + padding
    };
  }
  
  /**
   * Check if a feature is visible within the given bounds
   * @param {Object} feature - The terrain feature to check
   * @param {Object} bounds - The bounds to check against
   * @returns {boolean} Whether the feature is visible
   */
  isFeatureVisible(feature, bounds) {
    return (
      feature.position.x >= bounds.left &&
      feature.position.x <= bounds.right &&
      feature.position.y >= bounds.top &&
      feature.position.y <= bounds.bottom
    );
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
        texture = this.renderer.textureManager.textures.terrain.tree;
      } else { // rock
        texture = this.renderer.textureManager.textures.terrain.rock;
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
      
      // Apply scaling
      sprite.scale.set(feature.scale, feature.scale);
      
      // Store sprite reference and add to container
      feature.sprite = sprite;
      this.terrainContainer.addChild(sprite);
      
    } catch (error) {
      console.error("Error creating terrain sprite:", error);
    }
  }
  
  /**
   * Create ground tiles (grass, dirt, etc.)
   * Not fully implemented - would create a grid of ground tiles
   */
  createGroundTiles() {
    try {
      // Create a new container for ground tiles
      const groundTilesContainer = new PIXI.Container();
      this.renderer.groundLayer.addChildAt(groundTilesContainer, 0); // Add at bottom layer
      
      const grassTexture = this.renderer.textureManager.textures.terrain.grass;
      const tileSize = 64; // Size of each ground tile
      
      // Calculate number of tiles needed to cover the world
      const tilesX = Math.ceil(CONFIG.WORLD_WIDTH / tileSize);
      const tilesY = Math.ceil(CONFIG.WORLD_HEIGHT / tileSize);
      
      // Create a limited number of tiles around the player for performance
      // In a real implementation, this would use a more sophisticated approach
      const maxTiles = 20; // Maximum tiles in each direction from center
      const centerX = Math.floor(tilesX / 2);
      const centerY = Math.floor(tilesY / 2);
      
      // Calculate bounds
      const startX = Math.max(0, centerX - maxTiles);
      const endX = Math.min(tilesX, centerX + maxTiles);
      const startY = Math.max(0, centerY - maxTiles);
      const endY = Math.min(tilesY, centerY + maxTiles);
      
      // Create tiles
      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          const tile = new PIXI.Sprite(grassTexture);
          tile.position.set(x * tileSize, y * tileSize);
          groundTilesContainer.addChild(tile);
        }
      }
      
    } catch (error) {
      console.error("Error creating ground tiles:", error);
    }
  }
  
  /**
   * Clean up resources when renderer is destroyed
   */
  destroy() {
    // Clean up terrain sprites
    for (const feature of this.terrainFeatures) {
      if (feature.sprite) {
        feature.sprite.destroy();
        feature.sprite = null;
      }
    }
    
    // Clear terrain data
    this.terrainFeatures = [];
    this.visibleFeatures.clear();
    
    // Destroy terrain container
    if (this.terrainContainer) {
      this.terrainContainer.destroy({ children: true });
      this.terrainContainer = null;
    }
    
    this.terrainInitialized = false;
    
    console.log("TerrainRenderer destroyed");
  }
} 