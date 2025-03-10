/**
 * Client-side Player class
 */
class Player {
  /**
   * Create a new player
   * @param {Object} data - Player data from server
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.characterClass = data.characterClass;
    this.position = data.position || { x: 0, y: 0 };
    this.facingDirection = data.facingDirection || 'down';
    this.level = data.level || 1;
    this.health = data.health || 100;
    this.maxHealth = data.maxHealth || 100;
    this.experience = data.experience || 0;
    this.experienceToNextLevel = data.experienceToNextLevel || 100;
    this.isAttacking = data.isAttacking || false;
    this.attackDirection = data.attackDirection || null;
    this.equipment = data.equipment || {
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
    
    // Local properties
    this.type = 'player';
    this.isLocalPlayer = false;
    this.inventory = [];
    this.width = CONFIG.PLAYER_SIZE;
    this.height = CONFIG.PLAYER_SIZE;
    this.skillCooldowns = {
      1: 0,
      2: 0,
      3: 0,
      4: 0
    };
    
    // Animation state
    this.animationState = 'idle';
    this.animationFrame = 0;
    this.animationTime = 0;
    
    // Interpolation
    this.targetPosition = { ...this.position };
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Update player state
   * @param {number} deltaTime - Time since last update in ms
   */
  update(deltaTime) {
    // Interpolate position
    this.interpolatePosition(deltaTime);
    
    // Update animation
    this.updateAnimation(deltaTime);
    
    // Update skill cooldowns
    for (const skillId in this.skillCooldowns) {
      if (this.skillCooldowns[skillId] > 0) {
        this.skillCooldowns[skillId] = Math.max(0, this.skillCooldowns[skillId] - deltaTime);
      }
    }
  }
  
  /**
   * Interpolate position for smooth movement
   * @param {number} deltaTime - Time since last update in ms
   */
  interpolatePosition(deltaTime) {
    // Skip interpolation for local player (controlled by input)
    if (this.isLocalPlayer) {
      return;
    }
    
    // Interpolate position
    const t = Math.min(1, deltaTime * 0.01); // Adjust speed as needed
    
    this.position.x += (this.targetPosition.x - this.position.x) * t;
    this.position.y += (this.targetPosition.y - this.position.y) * t;
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time since last update in ms
   */
  updateAnimation(deltaTime) {
    // Track previous direction to detect changes
    const previousDirection = this.facingDirection;
    
    // Update animation time
    this.animationTime += deltaTime;
    
    // Determine animation state
    if (this.isAttacking) {
      this.animationState = 'attack';
    } else if (this.position.x !== this.targetPosition.x || this.position.y !== this.targetPosition.y) {
      this.animationState = 'walk';
    } else {
      this.animationState = 'idle';
    }
    
    // CRITICAL FIX: Check if direction changed and reset animation
    if (previousDirection !== this.facingDirection && this.facingDirection) {
      // Direction changed, reset animation to ensure proper sync
      this.animationTime = 0;
      this.animationFrame = 0;
    }
    
    // Update animation frame
    if (this.animationTime >= 150) { // 150ms per frame
      this.animationTime = 0;
      this.animationFrame = (this.animationFrame + 1) % 4; // 4 frames per animation
    }
  }
  
  /**
   * Update player data from server
   * @param {Object} data - Player data from server
   */
  updateFromServer(data) {
    // Update basic properties
    this.name = data.name;
    this.characterClass = data.characterClass;
    this.facingDirection = data.facingDirection;
    this.level = data.level;
    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.experience = data.experience;
    this.experienceToNextLevel = data.experienceToNextLevel;
    this.isAttacking = data.isAttacking;
    this.attackDirection = data.attackDirection;
    
    // Update equipment
    this.equipment = data.equipment || this.equipment;
    
    // Update target position for interpolation
    if (data.position) {
      this.targetPosition = { ...data.position };
      
      // If position change is large, snap to new position
      const dx = Math.abs(this.position.x - data.position.x);
      const dy = Math.abs(this.position.y - data.position.y);
      
      if (dx > 100 || dy > 100) {
        this.position = { ...data.position };
      }
    }
    
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Add an item to inventory
   * @param {Object} item - Item to add
   */
  addItemToInventory(item) {
    this.inventory.push(item);
  }
} 