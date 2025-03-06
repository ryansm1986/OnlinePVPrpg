const { v4: uuidv4 } = require('uuid');
const Biome = require('./world/Biome');
const Exit = require('./world/Exit');
const Landmark = require('./world/Landmark');

class WorldGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.biomeSize = 400; // Average size of biomes
    this.exitRadius = 100; // Safe zone radius around exits
    this.landmarkDensity = 0.0005; // Landmarks per pixel (adjust as needed)
  }
  
  /**
   * Generate a complete game world
   * @returns {Object} The generated world
   */
  generate() {
    // Initialize the world structure
    const world = {
      biomes: [],
      exits: [],
      landmarks: []
    };
    
    // Generate biomes
    this.generateBiomes(world);
    
    // Generate exits (one on each edge)
    this.generateExits(world);
    
    // Generate landmarks
    this.generateLandmarks(world);
    
    return world;
  }
  
  /**
   * Generate biomes for the world
   * @param {Object} world - The world object to populate
   */
  generateBiomes(world) {
    // Calculate how many biomes to create based on world size
    const totalArea = this.width * this.height;
    const averageBiomeArea = this.biomeSize * this.biomeSize;
    const biomeCount = Math.ceil(totalArea / averageBiomeArea);
    
    // Define biome types and their weights (chance of spawning)
    const biomeTypes = [
      { type: 'forest', weight: 0.4 },
      { type: 'swamp', weight: 0.3 },
      { type: 'ruins', weight: 0.2 },
      { type: 'mountains', weight: 0.1 }
    ];
    
    // Use Voronoi-like approach to distribute biomes
    // This is a simplified approach - a real implementation would use a proper Voronoi algorithm
    const biomeSeeds = [];
    
    // Create biome seed points
    for (let i = 0; i < biomeCount; i++) {
      const biomeType = this.weightedRandomSelection(biomeTypes);
      
      biomeSeeds.push({
        id: uuidv4(),
        type: biomeType,
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height),
        size: this.biomeSize * (0.8 + Math.random() * 0.4) // Vary size a bit
      });
    }
    
    // Create actual biome objects
    for (const seed of biomeSeeds) {
      const biome = new Biome(
        seed.id,
        seed.type,
        { x: seed.x, y: seed.y },
        seed.size
      );
      
      world.biomes.push(biome);
    }
    
    return world.biomes;
  }
  
  /**
   * Generate exits at the edges of the map
   * @param {Object} world - The world object to populate
   */
  generateExits(world) {
    const exits = [
      { name: 'North Exit', position: { x: this.width / 2, y: 50 } },
      { name: 'East Exit', position: { x: this.width - 50, y: this.height / 2 } },
      { name: 'South Exit', position: { x: this.width / 2, y: this.height - 50 } },
      { name: 'West Exit', position: { x: 50, y: this.height / 2 } }
    ];
    
    for (const exitData of exits) {
      const exit = new Exit(
        uuidv4(),
        exitData.name,
        exitData.position,
        this.exitRadius
      );
      
      world.exits.push(exit);
    }
    
    return world.exits;
  }
  
  /**
   * Generate landmarks across the world
   * @param {Object} world - The world object to populate
   */
  generateLandmarks(world) {
    // Calculate how many landmarks to create
    const totalArea = this.width * this.height;
    const landmarkCount = Math.floor(totalArea * this.landmarkDensity);
    
    // Define landmark types for each biome
    const landmarkTypes = {
      forest: ['ancient tree', 'hunting lodge', 'fairy circle', 'ranger outpost'],
      swamp: ['witch hut', 'giant mushroom', 'abandoned shrine', 'bubbling pool'],
      ruins: ['fallen tower', 'abandoned temple', 'forgotten altar', 'crumbling castle'],
      mountains: ['cave entrance', 'dwarven outpost', 'mountain peak', 'abandoned mine']
    };
    
    // Create landmarks
    for (let i = 0; i < landmarkCount; i++) {
      // Pick a random position
      const position = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
      
      // Find which biome this position belongs to
      const biome = this.findBiomeAt(position, world.biomes);
      
      if (biome) {
        // Get landmark types for this biome
        const biomeTypes = landmarkTypes[biome.type] || landmarkTypes.forest;
        const landmarkType = biomeTypes[Math.floor(Math.random() * biomeTypes.length)];
        
        // Create landmark name
        const adjectives = ['ancient', 'mysterious', 'forgotten', 'haunted', 'sacred', 'ruined'];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const name = `${adjective} ${landmarkType}`;
        
        // Create landmark
        const landmark = new Landmark(
          uuidv4(),
          name,
          position,
          landmarkType,
          biome.type
        );
        
        world.landmarks.push(landmark);
      }
    }
    
    return world.landmarks;
  }
  
  /**
   * Find which biome a position belongs to
   * @param {Object} position - The position to check
   * @param {Array} biomes - The biomes to check against
   * @returns {Object|null} The biome at the position or null if none
   */
  findBiomeAt(position, biomes) {
    // Find biome with minimum distance to its center
    let closestBiome = null;
    let minDistance = Infinity;
    
    for (const biome of biomes) {
      const distance = Math.sqrt(
        Math.pow(position.x - biome.position.x, 2) + 
        Math.pow(position.y - biome.position.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestBiome = biome;
      }
    }
    
    return closestBiome;
  }
  
  /**
   * Select a random item from an array based on weights
   * @param {Array} items - Array of {item, weight} objects
   * @returns {any} The selected item
   */
  weightedRandomSelection(items) {
    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    
    // Pick a random value
    let random = Math.random() * totalWeight;
    
    // Find the item that corresponds to the random value
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.type;
      }
    }
    
    // Fallback
    return items[0].type;
  }
}

module.exports = WorldGenerator; 