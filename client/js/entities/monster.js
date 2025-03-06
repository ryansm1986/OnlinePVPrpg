/**
 * Client-side Monster class
 */
class Monster {
  /**
   * Create a new monster
   * @param {Object} data - Monster data from server
   */
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.position = data.position || { x: 0, y: 0 };
    this.facingDirection = data.facingDirection || 'down';
    this.health = data.health || 100;
    this.maxHealth = data.maxHealth || 100;
    this.isAttacking = data.isAttacking || false;
    this.attackDirection = data.attackDirection || null;
    this.state = data.state || 'idle';
    this.width = data.width || CONFIG.MONSTER_SIZE;
    this.height = data.height || CONFIG.MONSTER_SIZE;
    this.isRanged = data.isRanged || false;
    this.isDead = data.isDead || false;
    
    // Local properties
    this.entityType = 'monster';
    
    // Animation state
    this.animationState = 'idle';
    this.animationFrame = 0;
    this.animationTime = 0;
    
    // Interpolation
    this.targetPosition = { ...this.position };
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Update monster state
   * @param {number} deltaTime - Time since last update in ms
   */
  update(deltaTime) {
    // Skip update if dead
    if (this.isDead) {
      return;
    }
    
    // Interpolate position
    this.interpolatePosition(deltaTime);
    
    // Update animation
    this.updateAnimation(deltaTime);
  }
  
  /**
   * Interpolate position for smooth movement
   * @param {number} deltaTime - Time since last update in ms
   */
  interpolatePosition(deltaTime) {
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
    // Update animation time
    this.animationTime += deltaTime;
    
    // Determine animation state
    if (this.isAttacking) {
      this.animationState = 'attack';
    } else if (this.state === 'chase' || this.state === 'patrol') {
      this.animationState = 'walk';
    } else {
      this.animationState = 'idle';
    }
    
    // Update animation frame
    if (this.animationTime >= 150) { // 150ms per frame
      this.animationTime = 0;
      this.animationFrame = (this.animationFrame + 1) % 4; // 4 frames per animation
    }
  }
  
  /**
   * Update monster data from server
   * @param {Object} data - Monster data from server
   */
  updateFromServer(data) {
    // Update basic properties
    this.type = data.type;
    this.facingDirection = data.facingDirection;
    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.isAttacking = data.isAttacking;
    this.attackDirection = data.attackDirection;
    this.state = data.state;
    this.width = data.width || this.width;
    this.height = data.height || this.height;
    this.isRanged = data.isRanged || this.isRanged;
    this.isDead = data.isDead || false;
    
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
} 