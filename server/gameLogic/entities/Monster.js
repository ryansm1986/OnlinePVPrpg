/**
 * Represents a monster in the game
 */
class Monster {
  /**
   * Create a new monster
   * @param {string} id - Unique ID
   * @param {string} type - Monster type (wolf, troll, etc.)
   * @param {Object} position - Starting position {x, y}
   */
  constructor(id, type, position) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.width = 32;
    this.height = 32;
    this.entityType = 'monster';
    
    // Direction the monster is facing
    this.facingDirection = 'down'; // 'up', 'down', 'left', 'right'
    
    // Set monster properties based on type
    this.setMonsterProperties();
    
    // Combat state
    this.isAttacking = false;
    this.attackDirection = null;
    this.attackCooldown = 0;
    this.attackDuration = 0;
    
    // AI state
    this.state = 'idle'; // 'idle', 'patrol', 'chase', 'attack', 'flee'
    this.target = null; // Target player to chase/attack
    this.idleTime = 0; // Time spent in idle state
    this.patrolPoint = null; // Current patrol destination
    this.aggroRange = 200; // Range at which monster notices players
    this.leashRange = 400; // Maximum distance from spawn before returning
    this.timeToRespawn = 30000; // 30 seconds after death
    this.lastStateChange = Date.now();
    
    // Spawn and death
    this.spawnPosition = { ...position }; // Remember where monster spawned
    this.deathTime = 0; // Time of death (0 if alive)
  }
  
  /**
   * Set properties based on monster type
   */
  setMonsterProperties() {
    // Default properties
    this.level = 1;
    this.maxHealth = 50;
    this.health = this.maxHealth;
    this.damage = 5;
    this.defense = 2;
    this.movementSpeed = 60; // Pixels per second
    this.attackRange = 30; // Pixels
    this.attackSpeed = 1000; // Milliseconds between attacks
    this.xpValue = 20; // XP awarded on kill
    this.isRanged = false;
    
    // Type-specific adjustments
    switch (this.type) {
      // FOREST MONSTERS
      case 'wolf':
        this.movementSpeed = 100;
        this.maxHealth = 40;
        this.health = 40;
        this.damage = 6;
        this.defense = 1;
        this.aggroRange = 250; // More alert
        this.state = 'patrol'; // Actively patrols
        this.xpValue = 15;
        break;
        
      case 'bear':
        this.movementSpeed = 70;
        this.maxHealth = 80;
        this.health = 80;
        this.damage = 10;
        this.defense = 4;
        this.width = 48; // Larger
        this.height = 48;
        this.xpValue = 30;
        break;
        
      case 'bandit':
        this.movementSpeed = 60;
        this.maxHealth = 50;
        this.health = 50;
        this.damage = 7;
        this.defense = 2;
        this.isRanged = Math.random() < 0.3; // 30% chance to be archer
        if (this.isRanged) {
          this.attackRange = 150;
          this.damage = 5;
        }
        this.xpValue = 25;
        break;
        
      // SWAMP MONSTERS
      case 'slime':
        this.movementSpeed = 40;
        this.maxHealth = 60;
        this.health = 60;
        this.damage = 4;
        this.defense = 3;
        this.width = 28;
        this.height = 28;
        this.xpValue = 18;
        break;
        
      case 'troll':
        this.movementSpeed = 40;
        this.maxHealth = 120;
        this.health = 120;
        this.damage = 15;
        this.defense = 6;
        this.width = 56;
        this.height = 56;
        this.attackSpeed = 1500; // Slower attacks
        this.xpValue = 45;
        break;
        
      case 'snake':
        this.movementSpeed = 120;
        this.maxHealth = 30;
        this.health = 30;
        this.damage = 8;
        this.defense = 1;
        this.width = 24;
        this.height = 24;
        this.xpValue = 20;
        break;
        
      // RUINS MONSTERS
      case 'skeleton':
        this.movementSpeed = 50;
        this.maxHealth = 45;
        this.health = 45;
        this.damage = 9;
        this.defense = 3;
        this.xpValue = 22;
        this.isRanged = Math.random() < 0.5; // 50% chance to be archer
        if (this.isRanged) {
          this.attackRange = 180;
          this.damage = 7;
        }
        break;
        
      case 'ghost':
        this.movementSpeed = 70;
        this.maxHealth = 35;
        this.health = 35;
        this.damage = 12;
        this.defense = 0;
        this.isRanged = true;
        this.attackRange = 120;
        this.xpValue = 28;
        break;
        
      case 'cultist':
        this.movementSpeed = 55;
        this.maxHealth = 40;
        this.health = 40;
        this.damage = 14;
        this.defense = 2;
        this.isRanged = true;
        this.attackRange = 200;
        this.xpValue = 35;
        break;
        
      // MOUNTAIN MONSTERS
      case 'golem':
        this.movementSpeed = 30;
        this.maxHealth = 150;
        this.health = 150;
        this.damage = 20;
        this.defense = 10;
        this.width = 64;
        this.height = 64;
        this.attackSpeed = 2000; // Very slow attacks
        this.xpValue = 50;
        break;
        
      case 'griffon':
        this.movementSpeed = 110;
        this.maxHealth = 70;
        this.health = 70;
        this.damage = 12;
        this.defense = 3;
        this.width = 48;
        this.height = 48;
        this.isRanged = true;
        this.attackRange = 100;
        this.xpValue = 40;
        break;
        
      case 'harpy':
        this.movementSpeed = 90;
        this.maxHealth = 55;
        this.health = 55;
        this.damage = 10;
        this.defense = 2;
        this.isRanged = true;
        this.attackRange = 140;
        this.xpValue = 30;
        break;
    }
  }
  
  /**
   * Update monster state
   * @param {Object} gameWorld - Reference to the game world
   */
  update(gameWorld) {
    // Don't update if dead
    if (this.isDead()) {
      if (this.canRespawn()) {
        // Reset monster for respawn
        this.respawn();
      }
      return;
    }
    
    // Calculate deltaTime since last state change
    const now = Date.now();
    const deltaTime = now - this.lastStateChange;
    
    // Update based on current state
    switch (this.state) {
      case 'idle':
        this.updateIdleState(deltaTime, gameWorld);
        break;
      case 'patrol':
        this.updatePatrolState(deltaTime, gameWorld);
        break;
      case 'chase':
        this.updateChaseState(deltaTime, gameWorld);
        break;
      case 'attack':
        this.updateAttackState(deltaTime, gameWorld);
        break;
      case 'flee':
        this.updateFleeState(deltaTime, gameWorld);
        break;
    }
    
    // Update position based on velocity
    this.position.x += this.velocity.x * (deltaTime / 1000);
    this.position.y += this.velocity.y * (deltaTime / 1000);
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // Update attack duration
    if (this.attackDuration > 0) {
      this.attackDuration -= deltaTime;
      if (this.attackDuration <= 0) {
        this.isAttacking = false;
      }
    }
    
    // Check for nearby players to aggro
    if (this.state !== 'chase' && this.state !== 'attack') {
      this.checkForPlayers(gameWorld);
    }
    
    // Check if we've gone too far from spawn point
    if (this.state === 'chase' || this.state === 'attack') {
      this.checkLeashRange();
    }
    
    this.lastStateChange = now;
  }
  
  /**
   * Check if monster is dead
   * @returns {boolean} True if dead
   */
  isDead() {
    return this.health <= 0;
  }
  
  /**
   * Check if monster can respawn
   * @returns {boolean} True if can respawn
   */
  canRespawn() {
    return this.deathTime > 0 && Date.now() - this.deathTime >= this.timeToRespawn;
  }
  
  /**
   * Respawn the monster
   */
  respawn() {
    this.health = this.maxHealth;
    this.position = { ...this.spawnPosition };
    this.velocity = { x: 0, y: 0 };
    this.state = 'idle';
    this.target = null;
    this.deathTime = 0;
    this.lastStateChange = Date.now();
  }
  
  /**
   * Update monster in idle state
   * @param {number} deltaTime - Time since last update in ms
   * @param {Object} gameWorld - The game world
   */
  updateIdleState(deltaTime, gameWorld) {
    // Stop moving
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // Occasionally transition to patrol
    this.idleTime += deltaTime;
    if (this.idleTime > 3000) { // 3 seconds of idle
      this.idleTime = 0;
      if (Math.random() < 0.7) { // 70% chance to start patrolling
        this.changeState('patrol');
        this.setRandomPatrolPoint();
      }
    }
  }
  
  /**
   * Update monster in patrol state
   * @param {number} deltaTime - Time since last update in ms
   * @param {Object} gameWorld - The game world
   */
  updatePatrolState(deltaTime, gameWorld) {
    // If no patrol point, set one
    if (!this.patrolPoint) {
      this.setRandomPatrolPoint();
    }
    
    // Move toward patrol point
    const direction = this.getDirectionToPoint(this.patrolPoint);
    this.velocity.x = direction.x * this.movementSpeed;
    this.velocity.y = direction.y * this.movementSpeed;
    
    // Update facing direction
    this.updateFacingDirection();
    
    // Check if we've reached the patrol point
    const distToTarget = this.getDistanceToPoint(this.patrolPoint);
    if (distToTarget < 10) {
      // Reached patrol point, go idle or set new patrol point
      if (Math.random() < 0.3) { // 30% chance to go idle
        this.changeState('idle');
      } else {
        this.setRandomPatrolPoint();
      }
    }
  }
  
  /**
   * Update monster in chase state
   * @param {number} deltaTime - Time since last update in ms
   * @param {Object} gameWorld - The game world
   */
  updateChaseState(deltaTime, gameWorld) {
    // If no target or target is dead, go back to idle
    if (!this.target || !gameWorld.players.has(this.target.id) || this.target.health <= 0) {
      this.target = null;
      this.changeState('idle');
      return;
    }
    
    // Get target from game world
    const targetPlayer = gameWorld.players.get(this.target.id);
    
    // Move toward target
    const direction = this.getDirectionToPoint(targetPlayer.position);
    this.velocity.x = direction.x * this.movementSpeed;
    this.velocity.y = direction.y * this.movementSpeed;
    
    // Update facing direction
    this.updateFacingDirection();
    
    // Check if in attack range
    const distToTarget = this.getDistanceToPoint(targetPlayer.position);
    if (distToTarget <= this.attackRange) {
      this.changeState('attack');
    }
  }
  
  /**
   * Update monster in attack state
   * @param {number} deltaTime - Time since last update in ms
   * @param {Object} gameWorld - The game world
   */
  updateAttackState(deltaTime, gameWorld) {
    // If no target or target is dead, go back to idle
    if (!this.target || !gameWorld.players.has(this.target.id) || this.target.health <= 0) {
      this.target = null;
      this.changeState('idle');
      return;
    }
    
    // Get target from game world
    const targetPlayer = gameWorld.players.get(this.target.id);
    
    // Stop moving while attacking
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // Face the target
    const direction = this.getDirectionToPoint(targetPlayer.position);
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      this.facingDirection = direction.x > 0 ? 'right' : 'left';
    } else {
      this.facingDirection = direction.y > 0 ? 'down' : 'up';
    }
    
    // Check if still in attack range
    const distToTarget = this.getDistanceToPoint(targetPlayer.position);
    if (distToTarget > this.attackRange) {
      this.changeState('chase');
      return;
    }
    
    // Attack if cooldown is ready
    if (this.attackCooldown <= 0) {
      this.attack();
    }
  }
  
  /**
   * Update monster in flee state
   * @param {number} deltaTime - Time since last update in ms
   * @param {Object} gameWorld - The game world
   */
  updateFleeState(deltaTime, gameWorld) {
    // If no target, go back to idle
    if (!this.target) {
      this.changeState('idle');
      return;
    }
    
    // Move away from target
    const direction = this.getDirectionToPoint(this.target.position);
    this.velocity.x = -direction.x * this.movementSpeed;
    this.velocity.y = -direction.y * this.movementSpeed;
    
    // Update facing direction
    this.updateFacingDirection();
    
    // Check if we're far enough away
    const distToTarget = this.getDistanceToPoint(this.target.position);
    if (distToTarget > this.aggroRange * 1.5) {
      this.target = null;
      this.changeState('idle');
    }
  }
  
  /**
   * Change monster state
   * @param {string} newState - New state to change to
   */
  changeState(newState) {
    this.state = newState;
    this.lastStateChange = Date.now();
    
    // Reset state-specific variables
    if (newState === 'idle') {
      this.idleTime = 0;
      this.velocity = { x: 0, y: 0 };
    } else if (newState === 'patrol') {
      this.patrolPoint = null; // Will be set in updatePatrolState
    }
  }
  
  /**
   * Set a random patrol point
   */
  setRandomPatrolPoint() {
    // Set a random point within patrol range of spawn
    const patrolRange = 100; // pixels
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * patrolRange;
    
    this.patrolPoint = {
      x: this.spawnPosition.x + Math.cos(angle) * distance,
      y: this.spawnPosition.y + Math.sin(angle) * distance
    };
  }
  
  /**
   * Check for players in aggro range
   * @param {Object} gameWorld - The game world
   */
  checkForPlayers(gameWorld) {
    // Look for closest player within aggro range
    let closestPlayer = null;
    let closestDistance = Infinity;
    
    for (const player of gameWorld.players.values()) {
      const distance = this.getDistanceToPoint(player.position);
      
      if (distance < this.aggroRange && distance < closestDistance) {
        closestPlayer = player;
        closestDistance = distance;
      }
    }
    
    // If we found a player, start chasing
    if (closestPlayer) {
      this.target = closestPlayer;
      
      // If we're very close, attack directly
      if (closestDistance <= this.attackRange) {
        this.changeState('attack');
      } else {
        this.changeState('chase');
      }
    }
  }
  
  /**
   * Check if monster is too far from spawn point
   */
  checkLeashRange() {
    const distanceFromSpawn = Math.sqrt(
      Math.pow(this.position.x - this.spawnPosition.x, 2) +
      Math.pow(this.position.y - this.spawnPosition.y, 2)
    );
    
    if (distanceFromSpawn > this.leashRange) {
      // Too far from spawn, return to spawn point
      this.target = null;
      this.changeState('idle');
      // For a smoother return, we could create a "return" state
      // that moves back to spawn before going idle
    }
  }
  
  /**
   * Get normalized direction vector to a point
   * @param {Object} point - Target point {x, y}
   * @returns {Object} Normalized direction vector
   */
  getDirectionToPoint(point) {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      return { x: 0, y: 0 };
    }
    
    return {
      x: dx / length,
      y: dy / length
    };
  }
  
  /**
   * Get distance to a point
   * @param {Object} point - Target point {x, y}
   * @returns {number} Distance in pixels
   */
  getDistanceToPoint(point) {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Update the facing direction based on velocity
   */
  updateFacingDirection() {
    if (this.velocity.x === 0 && this.velocity.y === 0) {
      return; // No change if not moving
    }
    
    // Determine primary direction
    if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
      this.facingDirection = this.velocity.x > 0 ? 'right' : 'left';
    } else {
      this.facingDirection = this.velocity.y > 0 ? 'down' : 'up';
    }
  }
  
  /**
   * Perform an attack
   */
  attack() {
    this.isAttacking = true;
    this.attackDirection = this.facingDirection;
    
    // Set attack duration and cooldown
    this.attackDuration = 300; // 300ms
    this.attackCooldown = this.attackSpeed;
  }
  
  /**
   * Apply damage to the monster
   * @param {number} damage - Amount of damage
   * @returns {boolean} True if killed
   */
  takeDamage(damage) {
    this.health = Math.max(0, this.health - damage);
    
    // If health is low and not already fleeing, maybe flee
    if (this.health < this.maxHealth * 0.2 && this.state !== 'flee') {
      // 30% chance to flee when low health
      if (Math.random() < 0.3) {
        this.changeState('flee');
      }
    }
    
    // If killed
    if (this.health <= 0) {
      this.velocity = { x: 0, y: 0 };
      this.deathTime = Date.now();
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the monster's attack range
   * @returns {number} Attack range
   */
  getAttackRange() {
    return this.attackRange;
  }
  
  /**
   * Get the monster's base damage
   * @returns {number} Base damage
   */
  getBaseDamage() {
    return this.damage;
  }
  
  /**
   * Get the monster's defense value
   * @returns {number} Defense value
   */
  getDefense() {
    return this.defense;
  }
  
  /**
   * Get the monster's XP value when killed
   * @returns {number} XP value
   */
  getXpValue() {
    return this.xpValue;
  }
  
  /**
   * Generate loot when killed
   * @returns {Object|null} Loot item or null
   */
  generateLoot() {
    // 25% chance to drop nothing
    if (Math.random() < 0.25) {
      return null;
    }
    
    // Define possible item types that can drop
    const possibleTypes = ['weapon', 'helmet', 'chest', 'legs', 'boots', 'gloves', 'ring', 'amulet', 'potion'];
    
    // Generate a random item
    const itemType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    
    // Rarity chance
    let rarity = 'common'; // Default white
    const rarityRoll = Math.random();
    
    if (rarityRoll < 0.01) {
      rarity = 'legendary'; // 1% gold
    } else if (rarityRoll < 0.15) {
      rarity = 'rare'; // 14% blue
    }
    
    // Generate item stats based on monster level and rarity
    const stats = this.generateItemStats(itemType, rarity);
    
    // Return the loot item
    return {
      type: itemType,
      rarity: rarity,
      stats: stats
    };
  }
  
  /**
   * Generate random stats for an item
   * @param {string} itemType - Type of item
   * @param {string} rarity - Rarity of item
   * @returns {Object} Item stats
   */
  generateItemStats(itemType, rarity) {
    // Base stats
    const stats = {};
    
    // Stat multiplier based on rarity
    let statMultiplier = 1;
    let statCount = 1;
    
    switch (rarity) {
      case 'common':
        statMultiplier = 1;
        statCount = 1;
        break;
      case 'rare':
        statMultiplier = 2;
        statCount = 2;
        break;
      case 'legendary':
        statMultiplier = 3;
        statCount = 3;
        break;
    }
    
    // Add base stats based on item type
    if (itemType === 'weapon') {
      stats.damage = Math.floor(this.level * 2 * statMultiplier + Math.random() * 5);
    } else if (itemType === 'potion') {
      stats.potency = Math.floor(20 * statMultiplier + Math.random() * 10);
      stats.effect = 'healing';
      return stats;
    } else {
      // Armor items
      stats.defense = Math.floor(this.level * statMultiplier + Math.random() * 3);
    }
    
    // Add random bonus stats
    const possibleStats = ['strength', 'intelligence', 'dexterity', 'vitality', 'health', 'speed'];
    
    for (let i = 0; i < statCount - 1; i++) {
      const statType = possibleStats[Math.floor(Math.random() * possibleStats.length)];
      const statValue = Math.floor(this.level * 0.5 * statMultiplier + Math.random() * 2);
      
      if (!stats[statType]) {
        stats[statType] = statValue;
      } else {
        stats[statType] += statValue;
      }
    }
    
    return stats;
  }
  
  /**
   * Get the monster's primary stat
   * @returns {number} The value of its primary stat
   */
  getPrimaryStat() {
    return this.damage; // For monsters, damage is their primary stat
  }
  
  /**
   * Serialize monster data for network transmission
   * @returns {Object} Serialized monster data
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      facingDirection: this.facingDirection,
      health: this.health,
      maxHealth: this.maxHealth,
      isAttacking: this.isAttacking,
      attackDirection: this.attackDirection,
      state: this.state,
      width: this.width,
      height: this.height,
      isRanged: this.isRanged,
      isDead: this.isDead()
    };
  }
}

module.exports = Monster; 