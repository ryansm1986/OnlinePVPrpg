/**
 * Represents an exit point in the game world
 */
class Exit {
  /**
   * Create a new exit
   * @param {string} id - Unique ID
   * @param {string} name - Exit name (e.g., "North Exit")
   * @param {Object} position - Position {x, y}
   * @param {number} safeZoneRadius - Radius of safe zone around exit
   */
  constructor(id, name, position, safeZoneRadius) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.safeZoneRadius = safeZoneRadius;
    this.interactionRadius = 50; // How close a player needs to be to use the exit
  }
  
  /**
   * Check if a point is within the safe zone
   * @param {Object} point - The point to check {x, y}
   * @returns {boolean} True if point is in safe zone
   */
  isInSafeZone(point) {
    const distance = Math.sqrt(
      Math.pow(point.x - this.position.x, 2) + 
      Math.pow(point.y - this.position.y, 2)
    );
    
    return distance <= this.safeZoneRadius;
  }
  
  /**
   * Check if a player can interact with this exit
   * @param {Object} playerPosition - Player position {x, y}
   * @returns {boolean} True if player can interact
   */
  canInteract(playerPosition) {
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - this.position.x, 2) + 
      Math.pow(playerPosition.y - this.position.y, 2)
    );
    
    return distance <= this.interactionRadius;
  }
  
  /**
   * Serialize exit data for client
   * @returns {Object} Serialized exit
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      safeZoneRadius: this.safeZoneRadius,
      interactionRadius: this.interactionRadius
    };
  }
}

module.exports = Exit; 