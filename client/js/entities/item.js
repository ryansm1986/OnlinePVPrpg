/**
 * Client-side Item class
 */
class Item {
  /**
   * Create a new item
   * @param {Object} data - Item data from server
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.rarity = data.rarity;
    this.stats = data.stats || {};
    this.position = data.position || { x: 0, y: 0 };
    this.color = data.color || '#FFFFFF';
    
    // Local properties
    this.width = CONFIG.ITEM_SIZE;
    this.height = CONFIG.ITEM_SIZE;
    
    // Animation
    this.animationTime = 0;
    this.floatOffset = 0;
    
    // Interpolation
    this.targetPosition = { ...this.position };
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Update item state
   * @param {number} deltaTime - Time since last update in ms
   */
  update(deltaTime) {
    // Interpolate position
    this.interpolatePosition(deltaTime);
    
    // Update floating animation
    this.updateFloatingAnimation(deltaTime);
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
   * Update floating animation
   * @param {number} deltaTime - Time since last update in ms
   */
  updateFloatingAnimation(deltaTime) {
    // Update animation time
    this.animationTime += deltaTime * 0.002; // Adjust speed as needed
    
    // Calculate floating offset using sine wave
    this.floatOffset = Math.sin(this.animationTime) * 3; // 3 pixels up/down
  }
  
  /**
   * Update item data from server
   * @param {Object} data - Item data from server
   */
  updateFromServer(data) {
    // Update basic properties
    this.name = data.name;
    this.type = data.type;
    this.rarity = data.rarity;
    this.stats = data.stats || this.stats;
    this.color = data.color || this.color;
    
    // Update target position for interpolation
    if (data.position) {
      this.targetPosition = { ...data.position };
      
      // If position change is large, snap to new position
      const dx = Math.abs(this.position.x - data.position.x);
      const dy = Math.abs(this.position.y - data.position.y);
      
      if (dx > 50 || dy > 50) {
        this.position = { ...data.position };
      }
    }
    
    this.lastUpdateTime = Date.now();
  }
  
  /**
   * Get the item's rarity color
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
} 