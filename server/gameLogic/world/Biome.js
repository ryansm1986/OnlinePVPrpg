/**
 * Represents a biome in the game world
 */
class Biome {
  /**
   * Create a new biome
   * @param {string} id - Unique ID
   * @param {string} type - Biome type (forest, swamp, ruins, etc.)
   * @param {Object} position - Central position {x, y}
   * @param {number} size - Approximate radius of the biome
   */
  constructor(id, type, position, size) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.size = size;
    
    // Set biome-specific properties
    this.setProperties();
  }
  
  /**
   * Set biome-specific properties based on type
   */
  setProperties() {
    // Monster spawn rates and types
    switch (this.type) {
      case 'forest':
        this.monsterTypes = ['wolf', 'bear', 'bandit'];
        this.monsterDensity = 0.0003; // Monsters per square pixel
        this.dangerLevel = 1;
        this.color = '#228B22'; // Forest green
        break;
      case 'swamp':
        this.monsterTypes = ['slime', 'troll', 'snake'];
        this.monsterDensity = 0.0004;
        this.dangerLevel = 2;
        this.color = '#2F4F4F'; // Dark slate gray
        break;
      case 'ruins':
        this.monsterTypes = ['skeleton', 'ghost', 'cultist'];
        this.monsterDensity = 0.0005;
        this.dangerLevel = 3;
        this.color = '#8B4513'; // Saddle brown
        break;
      case 'mountains':
        this.monsterTypes = ['golem', 'griffon', 'harpy'];
        this.monsterDensity = 0.0002;
        this.dangerLevel = 4;
        this.color = '#A9A9A9'; // Dark gray
        break;
      default:
        // Default to forest properties
        this.monsterTypes = ['wolf', 'bear', 'bandit'];
        this.monsterDensity = 0.0003;
        this.dangerLevel = 1;
        this.color = '#228B22';
    }
  }
  
  /**
   * Calculate the number of monsters to spawn in this biome
   * @returns {number} Number of monsters
   */
  getMonsterSpawnCount() {
    const biomeArea = Math.PI * this.size * this.size; // Approximating as circle
    return Math.floor(biomeArea * this.monsterDensity);
  }
  
  /**
   * Get a random position within this biome
   * @returns {Object} Random position {x, y}
   */
  getRandomPosition() {
    // Get a random position within the biome's radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * this.size;
    
    return {
      x: this.position.x + Math.cos(angle) * distance,
      y: this.position.y + Math.sin(angle) * distance
    };
  }
  
  /**
   * Get a random monster type for this biome
   * @returns {string} Monster type
   */
  getRandomMonsterType() {
    return this.monsterTypes[Math.floor(Math.random() * this.monsterTypes.length)];
  }
  
  /**
   * Check if a point is within this biome
   * @param {Object} point - The point to check {x, y}
   * @returns {boolean} True if point is in biome
   */
  containsPoint(point) {
    const distance = Math.sqrt(
      Math.pow(point.x - this.position.x, 2) + 
      Math.pow(point.y - this.position.y, 2)
    );
    
    return distance <= this.size;
  }
  
  /**
   * Serialize biome data for client
   * @returns {Object} Serialized biome
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      size: this.size,
      color: this.color,
      dangerLevel: this.dangerLevel
    };
  }
}

module.exports = Biome; 