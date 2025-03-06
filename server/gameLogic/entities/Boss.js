const Monster = require('./Monster');

/**
 * Represents a boss monster in the game
 * @extends Monster
 */
class Boss extends Monster {
  /**
   * Create a new boss monster
   * @param {string} id - Unique ID
   * @param {string} type - Boss type (dragon, lich, etc.)
   * @param {Object} position - Starting position {x, y}
   */
  constructor(id, type, position) {
    super(id, type, position);
    
    // Override entity type
    this.entityType = 'boss';
    
    // Override properties for bosses
    this.setProperties();
    
    // Specific boss properties
    this.specialAttackCooldown = 0;
    this.specialAttackChance = 0.3; // 30% chance to use special attack
    this.phaseThresholds = [0.7, 0.4, 0.15]; // Health % for phase changes
    this.currentPhase = 0;
    this.aggroRange = 400; // Bosses detect players from further away
    this.leashRange = 600; // Bosses chase players further
    
    // Boss never despawns until killed
    this.timeToRespawn = -1;
  }
  
  /**
   * Set boss-specific properties
   */
  setProperties() {
    // Scale up size
    this.width = 64;
    this.height = 64;
    
    // Type-specific properties
    switch (this.type) {
      case 'dragon':
        this.level = 10;
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.damage = 25;
        this.defense = 15;
        this.movementSpeed = 80;
        this.attackRange = 70;
        this.attackSpeed = 1500; // ms between attacks
        this.xpValue = 250;
        this.specialAttack = 'fireBreath';
        this.width = 96;
        this.height = 96;
        this.isRanged = true;
        break;
        
      case 'lich':
        this.level = 8;
        this.maxHealth = 350;
        this.health = this.maxHealth;
        this.damage = 30;
        this.defense = 8;
        this.movementSpeed = 50;
        this.attackRange = 200;
        this.attackSpeed = 1200;
        this.xpValue = 200;
        this.specialAttack = 'summonUndead';
        this.isRanged = true;
        break;
        
      case 'giant':
        this.level = 9;
        this.maxHealth = 600;
        this.health = this.maxHealth;
        this.damage = 35;
        this.defense = 20;
        this.movementSpeed = 40;
        this.attackRange = 80;
        this.attackSpeed = 2000;
        this.xpValue = 220;
        this.specialAttack = 'groundSmash';
        this.width = 112;
        this.height = 112;
        break;
        
      case 'demon':
        this.level = 12;
        this.maxHealth = 450;
        this.health = this.maxHealth;
        this.damage = 40;
        this.defense = 12;
        this.movementSpeed = 90;
        this.attackRange = 60;
        this.attackSpeed = 1000;
        this.xpValue = 300;
        this.specialAttack = 'hellfire';
        this.width = 80;
        this.height = 80;
        break;
        
      case 'treant':
        this.level = 7;
        this.maxHealth = 400;
        this.health = this.maxHealth;
        this.damage = 20;
        this.defense = 25;
        this.movementSpeed = 30;
        this.attackRange = 90;
        this.attackSpeed = 1800;
        this.xpValue = 180;
        this.specialAttack = 'rootEnsnare';
        this.width = 88;
        this.height = 88;
        break;
        
      case 'ghost king':
        this.level = 8;
        this.maxHealth = 300;
        this.health = this.maxHealth;
        this.damage = 35;
        this.defense = 5;
        this.movementSpeed = 70;
        this.attackRange = 150;
        this.attackSpeed = 1100;
        this.xpValue = 190;
        this.specialAttack = 'terrify';
        this.isRanged = true;
        break;
        
      case 'slime king':
        this.level = 6;
        this.maxHealth = 350;
        this.health = this.maxHealth;
        this.damage = 15;
        this.defense = 10;
        this.movementSpeed = 50;
        this.attackRange = 60;
        this.attackSpeed = 1200;
        this.xpValue = 170;
        this.specialAttack = 'split';
        this.width = 96;
        this.height = 96;
        break;
        
      default:
        // Generic boss stats if type not recognized
        this.level = 10;
        this.maxHealth = 400;
        this.health = this.maxHealth;
        this.damage = 30;
        this.defense = 15;
        this.movementSpeed = 60;
        this.attackRange = 70;
        this.attackSpeed = 1500;
        this.xpValue = 200;
        this.specialAttack = 'areaAttack';
    }
  }
  
  /**
   * Update boss state
   * @param {Object} gameWorld - Reference to the game world
   */
  update(gameWorld) {
    // Check if we should change phases based on health
    this.checkPhaseTransition();
    
    // Use parent update method for main behavior
    super.update(gameWorld);
    
    // Update special attack cooldown
    if (this.specialAttackCooldown > 0) {
      const now = Date.now();
      const deltaTime = now - this.lastStateChange;
      this.specialAttackCooldown -= deltaTime;
      this.lastStateChange = now;
    }
  }
  
  /**
   * Check if boss should transition to next phase
   */
  checkPhaseTransition() {
    if (this.currentPhase >= this.phaseThresholds.length) {
      return; // Already at max phase
    }
    
    const healthPercent = this.health / this.maxHealth;
    
    if (healthPercent <= this.phaseThresholds[this.currentPhase]) {
      this.currentPhase++;
      this.onPhaseTransition();
    }
  }
  
  /**
   * Handle phase transition behavior
   */
  onPhaseTransition() {
    // Phase transition effects
    switch (this.currentPhase) {
      case 1: // First transition
        // Small buff
        this.damage += 5;
        this.attackSpeed *= 0.9; // 10% faster attacks
        break;
        
      case 2: // Second transition
        // Medium buff
        this.damage += 10;
        this.movementSpeed *= 1.2; // 20% faster movement
        this.specialAttackChance = 0.5; // 50% chance for special
        break;
        
      case 3: // Final transition
        // Major buff
        this.damage += 15;
        this.attackSpeed *= 0.7; // 30% faster attacks
        this.specialAttackChance = 0.7; // 70% chance for special
        this.defense += 5;
        break;
    }
  }
  
  /**
   * Override attack method to potentially use special attack
   */
  attack() {
    // Chance to use special attack instead of regular attack
    if (this.specialAttackCooldown <= 0 && Math.random() < this.specialAttackChance) {
      this.useSpecialAttack();
    } else {
      // Use regular attack from parent class
      super.attack();
    }
  }
  
  /**
   * Use special attack based on boss type
   */
  useSpecialAttack() {
    // Set special attack flag
    this.isAttacking = true;
    this.isUsingSpecialAttack = true;
    this.attackDirection = this.facingDirection;
    
    // Set longer duration for special attacks
    this.attackDuration = 600; // 600ms
    
    // Set cooldown for special attack (separate from normal attack cooldown)
    this.specialAttackCooldown = 8000; // 8 seconds
    
    // Also trigger regular attack cooldown
    this.attackCooldown = this.attackSpeed;
    
    // Special attack implementation would be in the game world collision detection
    // This just sets the state
  }
  
  /**
   * Generate loot when boss is killed
   * @returns {Array} Array of loot items
   */
  generateLoot() {
    // Bosses always drop multiple items
    const lootCount = 2 + Math.floor(Math.random() * 3); // 2-4 items
    const loot = [];
    
    // Generate guaranteed rare+ items
    for (let i = 0; i < lootCount; i++) {
      // Define possible item types
      const possibleTypes = ['weapon', 'helmet', 'chest', 'legs', 'boots', 'gloves', 'ring', 'amulet'];
      
      // Generate a random item
      const itemType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
      
      // Rarity - bosses only drop rare or legendary
      let rarity = 'rare'; // Default blue
      const rarityRoll = Math.random();
      
      if (rarityRoll < 0.2) {
        rarity = 'legendary'; // 20% chance for legendary
      }
      
      // Generate item stats based on boss level and rarity
      const stats = this.generateItemStats(itemType, rarity);
      
      // Add the loot item
      loot.push({
        type: itemType,
        rarity: rarity,
        stats: stats
      });
    }
    
    // Always drop a health potion too
    loot.push({
      type: 'potion',
      rarity: 'common',
      stats: {
        potency: 50,
        effect: 'healing'
      }
    });
    
    return loot;
  }
  
  /**
   * Serialize boss data for network transmission
   * @returns {Object} Serialized boss data
   */
  serialize() {
    // Get base serialization from parent
    const baseData = super.serialize();
    
    // Add boss-specific properties
    return {
      ...baseData,
      entityType: 'boss',
      currentPhase: this.currentPhase,
      isUsingSpecialAttack: this.isUsingSpecialAttack || false,
      specialAttack: this.specialAttack
    };
  }
}

module.exports = Boss; 