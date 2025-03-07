/**
 * Represents a player in the game
 */
class Player {
  /**
   * Create a new player
   * @param {string} id - Socket ID
   * @param {string} name - Player name
   * @param {string} characterClass - Player class (warrior, mage, ranger)
   * @param {Object} position - Starting position {x, y}
   */
  constructor(id, name, characterClass, position) {
    this.id = id;
    this.name = name;
    this.characterClass = characterClass;
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.width = 32;
    this.height = 32;
    this.type = 'player';
    
    // Direction the player is facing
    this.facingDirection = 'down'; // 'up', 'down', 'left', 'right'
    
    // Stats
    this.level = 1;
    this.experience = 0;
    this.experienceToNextLevel = this.calculateXpForNextLevel();
    
    // Initialize stats based on class
    this.initializeStats();
    
    // Health and resources
    this.health = this.getMaxHealth();
    this.maxHealth = this.getMaxHealth();
    
    // Combat state
    this.isAttacking = false;
    this.attackDirection = null;
    this.attackCooldown = 0;
    this.attackDuration = 0;
    
    // Projectile attacks
    this.projectiles = [];
    
    // Skills
    this.skillCooldowns = {
      1: 0, // Skill 1
      2: 0, // Skill 2
      3: 0, // Skill 3
      4: 0  // Skill 4
    };
    
    // Inventory and equipment
    this.inventory = [];
    this.equipment = {
      weapon: null,
      head: null,
      body: null,
      legs: null,
      feet: null,
      hands: null,
      ring1: null,
      ring2: null,
      amulet: null
    };
  }
  
  /**
   * Initialize stats based on character class
   */
  initializeStats() {
    // Base stats for all classes
    this.stats = {
      vitality: 10,
      strength: 5,
      intelligence: 5,
      dexterity: 5
    };
    
    // Class-specific stat adjustments
    switch (this.characterClass) {
      case 'warrior':
        this.stats.strength += 5;
        this.stats.vitality += 5;
        this.primaryStat = 'strength';
        break;
        
      case 'mage':
        this.stats.intelligence += 8;
        this.stats.vitality -= 2;
        this.primaryStat = 'intelligence';
        break;
        
      case 'ranger':
        this.stats.dexterity += 7;
        this.stats.vitality += 2;
        this.primaryStat = 'dexterity';
        break;
    }
  }
  
  /**
   * Update player state
   * @param {number} deltaTime - Time since last update in ms
   */
  update(deltaTime) {
    // Update position based on velocity
    this.position.x += this.velocity.x * (deltaTime / 1000);
    this.position.y += this.velocity.y * (deltaTime / 1000);
    
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    if (this.attackDuration > 0) {
      this.attackDuration -= deltaTime;
      if (this.attackDuration <= 0) {
        this.isAttacking = false;
      }
    }
    
    // Update skill cooldowns
    for (const [skillId, cooldown] of Object.entries(this.skillCooldowns)) {
      if (cooldown > 0) {
        this.skillCooldowns[skillId] = Math.max(0, cooldown - deltaTime);
      }
    }
  }
  
  /**
   * Apply damage to the player
   * @param {number} damage - Amount of damage
   */
  takeDamage(damage) {
    this.health = Math.max(0, this.health - damage);
    return this.health <= 0;
  }
  
  /**
   * Check if player is dead
   * @returns {boolean} True if player is dead
   */
  isDead() {
    return this.health <= 0;
  }
  
  /**
   * Handle player death
   */
  death() {
    this.health = 0;
    // Could add additional death state flags here if needed
  }
  
  /**
   * Add experience to the player
   * @param {number} amount - Amount of XP
   * @returns {boolean} True if leveled up
   */
  addXp(amount) {
    this.experience += amount;
    
    // Check for level up
    if (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
      return true;
    }
    
    return false;
  }
  
  /**
   * Level up the player
   */
  levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = this.calculateXpForNextLevel();
    
    // Give stat points (5 per level)
    // In a real implementation, these would be allocated by the player
    // For now, we'll just auto-allocate based on class
    this.allocateStatPoints(5);
    
    // Heal to full on level up
    this.health = this.getMaxHealth();
  }
  
  /**
   * Calculate XP needed for next level
   * @returns {number} XP required
   */
  calculateXpForNextLevel() {
    // Simple formula: 100 * level * (level + 1) / 2
    return 100 * this.level * (this.level + 1) / 2;
  }
  
  /**
   * Allocate stat points based on class
   * @param {number} points - Number of points to allocate
   */
  allocateStatPoints(points) {
    switch (this.characterClass) {
      case 'warrior':
        this.stats.strength += Math.ceil(points * 0.6);
        this.stats.vitality += Math.floor(points * 0.4);
        break;
        
      case 'mage':
        this.stats.intelligence += Math.ceil(points * 0.7);
        this.stats.vitality += Math.floor(points * 0.3);
        break;
        
      case 'ranger':
        this.stats.dexterity += Math.ceil(points * 0.6);
        this.stats.vitality += Math.floor(points * 0.4);
        break;
    }
  }
  
  /**
   * Get the player's primary stat value
   * @returns {number} Primary stat value
   */
  getPrimaryStat() {
    return this.stats[this.primaryStat];
  }
  
  /**
   * Get the player's maximum health
   * @returns {number} Max health
   */
  getMaxHealth() {
    // Base health + vitality contribution + equipment bonuses
    const baseHealth = 50 + (this.stats.vitality * 10);
    const equipmentBonus = this.getEquipmentStatBonus('health');
    
    return Math.floor(baseHealth + equipmentBonus);
  }
  
  /**
   * Get the player's movement speed
   * @returns {number} Movement speed in pixels per second
   */
  getMovementSpeed() {
    // Base speed + equipment/class adjustments
    let baseSpeed = 150;
    
    // Class-specific speed adjustments
    switch (this.characterClass) {
      case 'warrior':
        baseSpeed -= 10; // Slower due to heavy armor
        break;
      case 'mage':
        baseSpeed += 0; // Average speed
        break;
      case 'ranger':
        baseSpeed += 20; // Faster
        break;
    }
    
    // Equipment modifiers would be added here
    const equipmentBonus = this.getEquipmentStatBonus('speed');
    
    return baseSpeed + equipmentBonus;
  }
  
  /**
   * Get the player's attack range
   * @returns {number} Attack range in pixels
   */
  getAttackRange() {
    // Base range depends on class and weapon
    let baseRange = 0;
    
    switch (this.characterClass) {
      case 'warrior':
        baseRange = 40; // Melee range
        break;
      case 'mage':
        baseRange = 200; // Long range
        break;
      case 'ranger':
        baseRange = 150; // Medium-long range
        break;
    }
    
    // Weapon can modify range
    if (this.equipment.weapon) {
      baseRange += (this.equipment.weapon.range || 0);
    }
    
    return baseRange;
  }
  
  /**
   * Get the player's attack duration
   * @returns {number} Attack duration in ms
   */
  getAttackDuration() {
    // Base duration depends on class and weapon
    let baseDuration = 0;
    
    switch (this.characterClass) {
      case 'warrior':
        baseDuration = 500; // Slower attacks
        break;
      case 'mage':
        baseDuration = 300; // Medium speed
        break;
      case 'ranger':
        baseDuration = 200; // Fast attacks
        break;
    }
    
    // Weapon and stats can modify duration
    if (this.equipment.weapon) {
      baseDuration = baseDuration * (this.equipment.weapon.attackSpeedModifier || 1);
    }
    
    return baseDuration;
  }
  
  /**
   * Get the player's attack cooldown
   * @returns {number} Cooldown in ms
   */
  getAttackCooldown() {
    // Base cooldown depends on class and weapon
    let baseCooldown = 0;
    
    switch (this.characterClass) {
      case 'warrior':
        baseCooldown = 1000; // Slower recovery
        break;
      case 'mage':
        baseCooldown = 800; // Medium recovery
        break;
      case 'ranger':
        baseCooldown = 600; // Fast recovery
        break;
    }
    
    // Weapon and stats can modify cooldown
    if (this.equipment.weapon) {
      baseCooldown = baseCooldown * (this.equipment.weapon.cooldownModifier || 1);
    }
    
    // Dexterity reduces cooldown
    const dexterityModifier = 1 - (this.stats.dexterity * 0.005); // 0.5% reduction per point
    
    return Math.max(300, baseCooldown * dexterityModifier); // Minimum 300ms cooldown
  }
  
  /**
   * Get the player's base damage
   * @returns {number} Base damage
   */
  getBaseDamage() {
    // Get weapon damage
    let weaponDamage = 0;
    if (this.equipment.weapon) {
      weaponDamage = this.equipment.weapon.damage || 0;
    } else {
      // Unarmed damage
      weaponDamage = 2;
    }
    
    return weaponDamage;
  }
  
  /**
   * Get the player's defense value
   * @returns {number} Defense value
   */
  getDefense() {
    let baseDefense = 0;
    
    // Add up defense from all equipment
    for (const slot in this.equipment) {
      if (this.equipment[slot] && this.equipment[slot].defense) {
        baseDefense += this.equipment[slot].defense;
      }
    }
    
    // Class-specific defense adjustments
    switch (this.characterClass) {
      case 'warrior':
        baseDefense += Math.floor(this.stats.strength * 0.2); // Strength adds defense for warriors
        break;
      case 'mage':
        // Mages have lower base defense
        break;
      case 'ranger':
        baseDefense += Math.floor(this.stats.dexterity * 0.1); // Some dodge-as-defense for rangers
        break;
    }
    
    return baseDefense;
  }
  
  /**
   * Get stat bonus from all equipment
   * @param {string} statName - The name of the stat
   * @returns {number} Total bonus
   */
  getEquipmentStatBonus(statName) {
    let total = 0;
    
    for (const slot in this.equipment) {
      const item = this.equipment[slot];
      if (item && item.stats && item.stats[statName]) {
        total += item.stats[statName];
      }
    }
    
    return total;
  }
  
  /**
   * Add an item to player's inventory
   * @param {Object} item - The item to add
   * @returns {boolean} Success
   */
  addItemToInventory(item) {
    // Simple inventory implementation with size limit
    const inventoryLimit = 20;
    
    if (this.inventory.length < inventoryLimit) {
      this.inventory.push(item);
      return true;
    }
    
    return false; // Inventory full
  }
  
  /**
   * Equip an item from inventory
   * @param {string} itemId - ID of the item to equip
   * @param {string} slot - Equipment slot
   * @returns {boolean} Success
   */
  equipItem(itemId, slot) {
    // Find the item in inventory
    const itemIndex = this.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false; // Item not found
    }
    
    const item = this.inventory[itemIndex];
    
    // Check if item can be equipped in this slot
    if (!this.canEquipItemInSlot(item, slot)) {
      return false;
    }
    
    // If there's already an item in this slot, put it back in inventory
    if (this.equipment[slot]) {
      this.inventory.push(this.equipment[slot]);
    }
    
    // Equip the new item
    this.equipment[slot] = item;
    
    // Remove from inventory
    this.inventory.splice(itemIndex, 1);
    
    return true;
  }
  
  /**
   * Check if an item can be equipped in a slot
   * @param {Object} item - The item
   * @param {string} slot - Equipment slot
   * @returns {boolean} True if can equip
   */
  canEquipItemInSlot(item, slot) {
    // Map item types to valid slots
    const validSlots = {
      weapon: ['weapon'],
      helmet: ['head'],
      chest: ['body'],
      legs: ['legs'],
      boots: ['feet'],
      gloves: ['hands'],
      ring: ['ring1', 'ring2'],
      amulet: ['amulet']
    };
    
    // Check if this item type can go in this slot
    return validSlots[item.type] && validSlots[item.type].includes(slot);
  }
  
  /**
   * Unequip an item from a slot
   * @param {string} slot - Equipment slot
   * @returns {boolean} Success
   */
  unequipItem(slot) {
    if (!this.equipment[slot]) {
      return false; // Nothing equipped in this slot
    }
    
    // Check if there's room in inventory
    if (this.inventory.length >= 20) {
      return false; // Inventory full
    }
    
    // Move item to inventory
    this.inventory.push(this.equipment[slot]);
    this.equipment[slot] = null;
    
    return true;
  }
  
  /**
   * Drop an item from inventory
   * @param {string} itemId - ID of item to drop
   * @returns {Object|null} The dropped item or null if not found
   */
  dropItem(itemId) {
    // Find the item in inventory
    const itemIndex = this.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return null; // Item not found
    }
    
    // Remove and return the item
    const item = this.inventory[itemIndex];
    this.inventory.splice(itemIndex, 1);
    
    return item;
  }
  
  /**
   * Use an item from inventory (consumables)
   * @param {string} itemId - ID of item to use
   * @returns {boolean} Success
   */
  useItem(itemId) {
    // Find the item in inventory
    const itemIndex = this.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false; // Item not found
    }
    
    const item = this.inventory[itemIndex];
    
    // Check if item is usable
    if (item.type !== 'potion' && item.type !== 'scroll') {
      return false; // Not a usable item
    }
    
    // Apply the item effect
    if (item.type === 'potion') {
      if (item.effect === 'healing') {
        // Heal the player
        const healAmount = item.potency || 20;
        this.health = Math.min(this.getMaxHealth(), this.health + healAmount);
      }
    }
    
    // Remove the item from inventory
    this.inventory.splice(itemIndex, 1);
    
    return true;
  }
  
  /**
   * Creates a projectile based on character class
   * @returns {Object} The projectile object
   */
  createProjectile() {
    // Base projectile properties
    const projectile = {
      id: `${this.id}_proj_${Date.now()}`,
      ownerId: this.id,
      position: { ...this.position },
      velocity: { x: 0, y: 0 },
      damage: this.getBaseDamage(),
      active: true,
      lifespan: 2000, // 2 seconds default lifespan
      createdAt: Date.now()
    };
    
    // Class-specific projectile
    switch (this.characterClass) {
      case 'mage':
        // Fireball projectile
        projectile.type = 'fireball';
        projectile.width = 24;
        projectile.height = 24;
        projectile.speed = 300; // pixels per second
        projectile.damage = this.getBaseDamage() * 1.5;
        projectile.explodes = true;
        projectile.explosionRadius = 50;
        break;
        
      case 'ranger':
        // Arrow projectile
        projectile.type = 'arrow';
        projectile.width = 16;
        projectile.height = 8;
        projectile.speed = 500; // pixels per second
        projectile.damage = this.getBaseDamage() * 1.2;
        projectile.piercing = true; // Can go through multiple enemies
        projectile.maxPierceCount = 2;
        projectile.pierceCount = 0;
        break;
        
      default:
        return null; // No projectile for other classes
    }
    
    // Set velocity based on facing direction
    const speed = projectile.speed * 0.001; // Convert to per-millisecond
    
    switch (this.facingDirection) {
      case 'up':
        projectile.velocity.y = -speed;
        projectile.angle = 270; // degrees
        break;
      case 'down':
        projectile.velocity.y = speed;
        projectile.angle = 90; // degrees
        break;
      case 'left':
        projectile.velocity.x = -speed;
        projectile.angle = 180; // degrees
        break;
      case 'right':
        projectile.velocity.x = speed;
        projectile.angle = 0; // degrees
        break;
    }
    
    return projectile;
  }
  
  /**
   * Fires a projectile attack
   * @returns {Object|null} The projectile object or null if class can't create projectiles
   */
  fireProjectile() {
    // Only mage and ranger can fire projectiles
    if (this.characterClass !== 'mage' && this.characterClass !== 'ranger') {
      return null;
    }
    
    // Create a new projectile
    const projectile = this.createProjectile();
    
    if (projectile) {
      // Add to player's projectiles list
      this.projectiles.push(projectile);
      
      // Set attack cooldown
      this.attackCooldown = this.getAttackCooldown();
      
      // Set attacking state
      this.isAttacking = true;
      this.attackDirection = this.facingDirection;
      this.attackDuration = this.getAttackDuration();
    }
    
    return projectile;
  }
  
  /**
   * Updates all projectiles for this player
   * @param {number} deltaTime - Time passed since last update in ms
   * @returns {Array} Array of projectiles that have hit or expired
   */
  updateProjectiles(deltaTime) {
    const expiredProjectiles = [];
    
    // Update each projectile position
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Update position based on velocity
      projectile.position.x += projectile.velocity.x * deltaTime;
      projectile.position.y += projectile.velocity.y * deltaTime;
      
      // Check if projectile has expired
      const age = Date.now() - projectile.createdAt;
      if (age > projectile.lifespan) {
        // Mark for explosion if it's a fireball
        if (projectile.type === 'fireball' && projectile.explodes) {
          expiredProjectiles.push({
            ...projectile,
            isExplosion: true
          });
        } else {
          expiredProjectiles.push(projectile);
        }
        
        // Remove from active projectiles
        this.projectiles.splice(i, 1);
      }
    }
    
    return expiredProjectiles;
  }
  
  /**
   * Serialize player data for network transmission
   * @returns {Object} Serialized player data
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      characterClass: this.characterClass,
      position: this.position,
      facingDirection: this.facingDirection,
      level: this.level,
      health: this.health,
      maxHealth: this.getMaxHealth(),
      experience: this.experience,
      experienceToNextLevel: this.experienceToNextLevel,
      isAttacking: this.isAttacking,
      attackDirection: this.attackDirection,
      equipment: this.equipment // Send equipment for rendering
    };
  }
}

module.exports = Player; 