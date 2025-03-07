/**
 * Client-side World class
 * Manages the game world and its components
 */
class World {
  /**
   * Create a new world
   * @param {Game} game - Reference to the game
   */
  constructor(game) {
    this.game = game;
    
    // World properties
    this.width = CONFIG.WORLD_WIDTH;
    this.height = CONFIG.WORLD_HEIGHT;
    
    // World components
    this.biomes = [];
    this.exits = [];
    this.landmarks = [];
    this.terrainFeatures = [];
    
    // Bind methods
    this.update = this.update.bind(this);
    this.updateFromServer = this.updateFromServer.bind(this);
  }
  
  /**
   * Update world state
   * @param {number} deltaTime - Time since last update in ms
   */
  update(deltaTime) {
    // Update world components
    // This would include things like particle effects, environmental animations, etc.
  }
  
  /**
   * Update world data from server
   * @param {Object} data - World data from server
   */
  updateFromServer(data) {
    // Update biomes
    if (data.biomes) {
      this.biomes = data.biomes;
    }
    
    // Update exits
    if (data.exits) {
      this.exits = data.exits;
    }
    
    // Update landmarks
    if (data.landmarks) {
      this.landmarks = data.landmarks;
    }
    
    // Update terrain features if provided
    if (data.terrainFeatures) {
      this.terrainFeatures = data.terrainFeatures;
    }
  }
  
  /**
   * Get biome at position
   * @param {Object} position - Position to check
   * @returns {Object|null} Biome at position or null
   */
  getBiomeAt(position) {
    // Find biome that contains this position
    for (const biome of this.biomes) {
      // Calculate distance from biome center
      const distance = Math.sqrt(
        Math.pow(position.x - biome.position.x, 2) + 
        Math.pow(position.y - biome.position.y, 2)
      );
      
      // Check if position is within biome radius
      if (distance <= biome.size) {
        return biome;
      }
    }
    
    return null;
  }
  
  /**
   * Get landmark at position
   * @param {Object} position - Position to check
   * @returns {Object|null} Landmark at position or null
   */
  getLandmarkAt(position) {
    // Find landmark that contains this position
    for (const landmark of this.landmarks) {
      // Calculate distance from landmark center
      const distance = Math.sqrt(
        Math.pow(position.x - landmark.position.x, 2) + 
        Math.pow(position.y - landmark.position.y, 2)
      );
      
      // Check if position is within landmark radius
      if (distance <= landmark.radius) {
        return landmark;
      }
    }
    
    return null;
  }
  
  /**
   * Get terrain features at position
   * @param {Object} position - Position to check
   * @param {number} radius - Search radius
   * @returns {Array} Array of terrain features at position
   */
  getTerrainFeaturesAt(position, radius = 50) {
    return this.terrainFeatures.filter(feature => {
      const distance = Math.sqrt(
        Math.pow(position.x - feature.position.x, 2) + 
        Math.pow(position.y - feature.position.y, 2)
      );
      
      return distance <= radius;
    });
  }
  
  /**
   * Check if position is in a safe zone
   * @param {Object} position - Position to check
   * @returns {boolean} True if in safe zone
   */
  isInSafeZone(position) {
    // Check if position is near any exit (safe zone)
    for (const exit of this.exits) {
      const distance = Math.sqrt(
        Math.pow(position.x - exit.position.x, 2) + 
        Math.pow(position.y - exit.position.y, 2)
      );
      
      if (distance < exit.safeZoneRadius) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get nearest exit to position
   * @param {Object} position - Position to check
   * @returns {Object|null} Nearest exit or null
   */
  getNearestExit(position) {
    let nearestExit = null;
    let nearestDistance = Infinity;
    
    for (const exit of this.exits) {
      const distance = Math.sqrt(
        Math.pow(position.x - exit.position.x, 2) + 
        Math.pow(position.y - exit.position.y, 2)
      );
      
      if (distance < nearestDistance) {
        nearestExit = exit;
        nearestDistance = distance;
      }
    }
    
    return nearestExit;
  }
  
  /**
   * Get nearest landmark to position
   * @param {Object} position - Position to check
   * @returns {Object|null} Nearest landmark or null
   */
  getNearestLandmark(position) {
    let nearestLandmark = null;
    let nearestDistance = Infinity;
    
    for (const landmark of this.landmarks) {
      const distance = Math.sqrt(
        Math.pow(position.x - landmark.position.x, 2) + 
        Math.pow(position.y - landmark.position.y, 2)
      );
      
      if (distance < nearestDistance) {
        nearestLandmark = landmark;
        nearestDistance = distance;
      }
    }
    
    return nearestLandmark;
  }
  
  /**
   * Get world bounds
   * @returns {Object} World bounds {x, y, width, height}
   */
  getBounds() {
    return {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height
    };
  }
} 