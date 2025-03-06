/**
 * Represents a landmark in the game world
 */
class Landmark {
  /**
   * Create a new landmark
   * @param {string} id - Unique ID
   * @param {string} name - Landmark name (e.g., "Ancient Temple")
   * @param {Object} position - Position {x, y}
   * @param {string} type - Landmark type
   * @param {string} biomeType - The biome this landmark is in
   */
  constructor(id, name, position, type, biomeType) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.type = type;
    this.biomeType = biomeType;
    this.radius = 50; // Visual/interaction radius
    this.isBossSpawn = this.determineIfBossSpawn();
  }
  
  /**
   * Determine if this landmark can be a boss spawn point
   * @returns {boolean} True if this can be a boss spawn
   */
  determineIfBossSpawn() {
    // Some landmark types are more likely to be boss spawns
    const bossSpawnTypes = [
      'abandoned temple', 'crumbling castle', 'ancient tree',
      'fallen tower', 'cave entrance', 'forgotten altar'
    ];
    
    // Check if this landmark type is in the boss spawn list
    if (bossSpawnTypes.some(t => this.type.includes(t))) {
      return Math.random() < 0.7; // 70% chance for these types
    }
    
    return Math.random() < 0.3; // 30% chance for other types
  }
  
  /**
   * Check if a point is within this landmark
   * @param {Object} point - The point to check {x, y}
   * @returns {boolean} True if point is in landmark
   */
  containsPoint(point) {
    const distance = Math.sqrt(
      Math.pow(point.x - this.position.x, 2) + 
      Math.pow(point.y - this.position.y, 2)
    );
    
    return distance <= this.radius;
  }
  
  /**
   * Get boss type that can spawn at this landmark
   * @returns {string} Boss type id
   */
  getPossibleBossType() {
    // Map landmark types to possible boss types
    const bossMapping = {
      'abandoned temple': ['lich', 'demon'],
      'crumbling castle': ['dragon', 'giant'],
      'ancient tree': ['treant', 'fairy queen'],
      'fallen tower': ['ghost king', 'golem'],
      'cave entrance': ['troll king', 'dragon'],
      'forgotten altar': ['demon', 'necromancer'],
      'witch hut': ['witch', 'demon'],
      'giant mushroom': ['mushroom king', 'spore beast'],
      'abandoned shrine': ['lich', 'ghost king'],
      'bubbling pool': ['slime king', 'water elemental'],
      'hunting lodge': ['werewolf', 'hunter'],
      'fairy circle': ['fairy queen', 'mushroom king'],
      'ranger outpost': ['bandit king', 'hunter'],
      'dwarven outpost': ['dwarf king', 'golem'],
      'mountain peak': ['dragon', 'griffon king'],
      'abandoned mine': ['dwarf king', 'stone golem']
    };
    
    // Find boss types for this landmark
    for (const [landmarkType, bossTypes] of Object.entries(bossMapping)) {
      if (this.type.includes(landmarkType)) {
        return bossTypes[Math.floor(Math.random() * bossTypes.length)];
      }
    }
    
    // Default boss types by biome
    const biomeBosses = {
      'forest': ['treant', 'werewolf'],
      'swamp': ['slime king', 'witch'],
      'ruins': ['lich', 'ghost king'],
      'mountains': ['dragon', 'stone golem']
    };
    
    const bossList = biomeBosses[this.biomeType] || ['demon', 'dragon'];
    return bossList[Math.floor(Math.random() * bossList.length)];
  }
  
  /**
   * Serialize landmark data for client
   * @returns {Object} Serialized landmark
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      type: this.type,
      biomeType: this.biomeType,
      radius: this.radius,
      isBossSpawn: this.isBossSpawn
    };
  }
}

module.exports = Landmark; 