/**
 * Represents an item in the game
 */
class Item {
  /**
   * Create a new item
   * @param {string} id - Unique ID
   * @param {string} type - Item type (weapon, helmet, etc.)
   * @param {string} rarity - Item rarity (common, rare, legendary)
   * @param {Object} stats - Item stats
   * @param {Object} position - Position in world (if dropped)
   */
  constructor(id, type, rarity, stats, position) {
    this.id = id;
    this.type = type;
    this.rarity = rarity;
    this.stats = stats || {};
    this.position = position;
    
    // Generate item name
    this.name = this.generateName();
    
    // Set pickup radius
    this.pickupRadius = 30; // pixels
  }
  
  /**
   * Generate a name for the item based on type and rarity
   * @returns {string} Generated item name
   */
  generateName() {
    // Prefixes based on rarity
    const rarityPrefixes = {
      common: ['Simple', 'Basic', 'Plain', 'Crude', 'Ordinary'],
      rare: ['Fine', 'Quality', 'Superior', 'Exceptional', 'Masterwork'],
      legendary: ['Ancient', 'Mythical', 'Legendary', 'Epic', 'Divine']
    };
    
    // Suffixes based on primary stat
    const statSuffixes = {
      strength: ['of Power', 'of Might', 'of Force', 'of the Warrior'],
      intelligence: ['of Wisdom', 'of the Mind', 'of Insight', 'of the Mage'],
      dexterity: ['of Agility', 'of Precision', 'of Quickness', 'of the Ranger'],
      vitality: ['of Vitality', 'of Health', 'of Endurance', 'of the Bear'],
      damage: ['of Destruction', 'of Slaying', 'of Ruin', 'of Devastation'],
      defense: ['of Protection', 'of Shielding', 'of Defense', 'of the Turtle']
    };
    
    // Base names by type
    const baseNames = {
      weapon: ['Sword', 'Axe', 'Mace', 'Dagger', 'Staff', 'Wand', 'Bow'],
      helmet: ['Helmet', 'Cap', 'Crown', 'Circlet', 'Hood'],
      chest: ['Chestplate', 'Armor', 'Robe', 'Tunic', 'Breastplate'],
      legs: ['Leggings', 'Pants', 'Greaves', 'Leg Guards'],
      boots: ['Boots', 'Shoes', 'Greaves', 'Sabatons'],
      gloves: ['Gloves', 'Gauntlets', 'Hand Wraps', 'Bracers'],
      ring: ['Ring', 'Band', 'Loop', 'Signet'],
      amulet: ['Amulet', 'Necklace', 'Pendant', 'Talisman'],
      potion: ['Potion', 'Elixir', 'Tonic', 'Brew']
    };
    
    // Get random prefix based on rarity
    const prefixes = rarityPrefixes[this.rarity] || rarityPrefixes.common;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    // Get base name based on type
    const bases = baseNames[this.type] || ['Item'];
    const baseName = bases[Math.floor(Math.random() * bases.length)];
    
    // For potions, return a simple name
    if (this.type === 'potion') {
      if (this.stats.effect === 'healing') {
        return `${prefix} Healing ${baseName}`;
      }
      return `${prefix} ${baseName}`;
    }
    
    // Find primary stat for suffix
    let primaryStat = null;
    let highestValue = 0;
    
    for (const [stat, value] of Object.entries(this.stats)) {
      if (value > highestValue && statSuffixes[stat]) {
        primaryStat = stat;
        highestValue = value;
      }
    }
    
    // Get suffix based on primary stat
    let suffix = '';
    if (primaryStat && highestValue > 0) {
      const suffixes = statSuffixes[primaryStat];
      suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    
    return `${prefix} ${baseName}${suffix}`;
  }
  
  /**
   * Check if a player can pick up this item
   * @param {Object} player - The player
   * @returns {boolean} True if player can pick up
   */
  canPickup(player) {
    // Check distance
    const distance = Math.sqrt(
      Math.pow(player.position.x - this.position.x, 2) + 
      Math.pow(player.position.y - this.position.y, 2)
    );
    
    return distance <= this.pickupRadius;
  }
  
  /**
   * Get color code for item rarity
   * @returns {string} Color hex code
   */
  getRarityColor() {
    switch (this.rarity) {
      case 'common':
        return '#FFFFFF'; // White
      case 'rare':
        return '#4169E1'; // Royal Blue
      case 'legendary':
        return '#FFD700'; // Gold
      default:
        return '#FFFFFF';
    }
  }
  
  /**
   * Serialize item data for network transmission
   * @returns {Object} Serialized item data
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      rarity: this.rarity,
      stats: this.stats,
      position: this.position,
      color: this.getRarityColor()
    };
  }
}

module.exports = Item; 