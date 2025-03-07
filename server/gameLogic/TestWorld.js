const { v4: uuidv4 } = require('uuid');
const Player = require('./entities/Player');
const Monster = require('./entities/Monster');
const Item = require('./items/Item');
const Biome = require('./world/Biome');
const Exit = require('./world/Exit');

class TestWorld {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // Map of player objects by socket ID
    this.monsters = new Map(); // Map of monster objects by UUID
    this.items = new Map(); // Map of dropped items by UUID
    this.bosses = new Map(); // Empty for test world
    
    // Projectiles collection
    this.projectiles = new Map(); // Map of projectiles by ID
    
    // Updated world properties to match client's expanded size
    this.width = 4000;
    this.height = 4000;
    
    // Create a single biome for the entire world
    this.biomes = [
      new Biome('forest', {
        x: 0,
        y: 0
      }, this.width, this.height, {
        monsterTypes: ['wolf', 'bear', 'spider'],
        baseMonsterDensity: 0.00001 // Very low density
      })
    ];
    
    // Create exits for navigation reference
    this.exits = [
      new Exit('north', { x: this.width / 2, y: 10 }),
      new Exit('south', { x: this.width / 2, y: this.height - 10 })
    ];
    
    // No landmarks in test world
    this.landmarks = [];
    
    // Spawn a single test monster near the center
    this.spawnTestMonster();
  }
  
  spawnTestMonster() {
    const monsterId = uuidv4();
    const position = {
      x: this.width / 2 + 50,
      y: this.height / 2
    };
    
    const monster = new Monster(monsterId, 'wolf', position);
    monster.health = 50;
    monster.maxHealth = 50;
    monster.aggroRange = 150;
    
    this.monsters.set(monsterId, monster);
  }
  
  addPlayer(socketId, playerData) {
    const position = { x: this.width / 2, y: this.height / 2 };
    
    const player = new Player(
      socketId,
      playerData.name,
      playerData.characterClass,
      position
    );
    
    this.players.set(socketId, player);
    
    return player;
  }
  
  removePlayer(socketId) {
    if (this.players.has(socketId)) {
      const player = this.players.get(socketId);
      this.players.delete(socketId);
    }
  }
  
  getRandomSpawnPoint() {
    // Spawn players in the center area of the map for the larger world
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    
    // Add some randomness but keep them near the center (within 500 units)
    return { 
      x: centerX + (Math.random() * 1000 - 500),
      y: centerY + (Math.random() * 1000 - 500)
    };
  }
  
  update() {
    // Update players' positions based on velocity
    this.players.forEach(player => {
      // Only apply movement if velocity is non-zero
      if (player.velocity.x !== 0 || player.velocity.y !== 0) {
        // Apply velocity to position
        player.position.x += player.velocity.x * 0.05; // Assume 50ms update rate
        player.position.y += player.velocity.y * 0.05;
        
        // Constrain player to world bounds
        player.position.x = Math.max(0, Math.min(this.width, player.position.x));
        player.position.y = Math.max(0, Math.min(this.height, player.position.y));
      }
      
      // Decrement cooldowns
      if (player.attackCooldown > 0) {
        player.attackCooldown -= 50; // Decrease by update interval
      }
      
      if (player.attackDuration > 0) {
        player.attackDuration -= 50;
        if (player.attackDuration <= 0) {
          player.isAttacking = false;
          player.attackDirection = null;
        }
      }
      
      // Update projectiles
      const expiredProjectiles = player.updateProjectiles(50);
      
      // Handle any explosions
      expiredProjectiles.forEach(projectile => {
        if (projectile.isExplosion) {
          this.handleExplosion(projectile);
        }
      });
      
      // Update skill cooldowns
      for (const skillId in player.skillCooldowns) {
        if (player.skillCooldowns[skillId] > 0) {
          player.skillCooldowns[skillId] -= 50;
        }
      }
    });
    
    // Update projectile positions and check collisions
    this.updateProjectiles();
    
    // Check for collisions
    this.checkCollisions();
  }
  
  checkCollisions() {
    // Check player-monster combat collisions
    for (const player of this.players.values()) {
      // Skip collision checks for dead players
      if (player.isDead()) continue;
      
      // Check if player can pick up items
      for (const item of this.items.values()) {
        this.checkItemPickup(player, item);
      }
      
      // Check player attacks against monsters
      if (player.isAttacking) {
        const attackBox = this.getAttackBox(player, player.getAttackRange());
        
        // Check against monsters
        for (const monster of this.monsters.values()) {
          if (!monster.isDead() && this.checkAttackCollision(attackBox, monster)) {
            this.handleCombat(player, monster);
          }
        }
      }
      
      // Check monster attacks against player
      for (const monster of this.monsters.values()) {
        if (!monster.isDead() && monster.isAttacking) {
          const attackBox = this.getAttackBox(monster, monster.getAttackRange());
          
          if (this.checkAttackCollision(attackBox, player)) {
            this.handleCombat(monster, player);
          }
        }
      }
    }
  }
  
  checkAttackCollision(attacker, target) {
    // If attacker is an attack box
    if (attacker.isAttackBox) {
      return this.rectIntersect(
        attacker.x, attacker.y, attacker.width, attacker.height,
        target.position.x - target.width / 2, target.position.y - target.height / 2, 
        target.width, target.height
      );
    }
    
    // If attacker is an entity, use its attack box
    const attackBox = this.getAttackBox(attacker, attacker.getAttackRange());
    
    return this.rectIntersect(
      attackBox.x, attackBox.y, attackBox.width, attackBox.height,
      target.position.x - target.width / 2, target.position.y - target.height / 2, 
      target.width, target.height
    );
  }
  
  getAttackBox(attacker, range) {
    let x = attacker.position.x;
    let y = attacker.position.y;
    let width = attacker.width;
    let height = attacker.height;
    
    // Adjust position based on facing direction
    switch (attacker.facingDirection) {
      case 'up':
        y -= range / 2;
        height += range;
        break;
      case 'down':
        height += range;
        break;
      case 'left':
        x -= range / 2;
        width += range;
        break;
      case 'right':
        width += range;
        break;
    }
    
    return {
      isAttackBox: true,
      x: x - width / 2,
      y: y - height / 2,
      width,
      height
    };
  }
  
  rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && 
           x1 + w1 > x2 && 
           y1 < y2 + h2 && 
           y1 + h1 > y2;
  }
  
  handleCombat(attacker, target) {
    // Skip if target is already dead
    if (target.isDead()) return;
    
    // Calculate damage
    const damage = this.calculateDamage(attacker, target);
    
    // Apply damage
    target.takeDamage(damage);
    
    // Broadcast combat event
    this.broadcastMessage('combatEvent', {
      attackerId: attacker.id,
      targetId: target.id,
      damage: damage,
      targetHealth: target.health,
      targetMaxHealth: target.maxHealth,
      isCritical: damage.isCritical || false
    });
    
    // Handle death
    if (target.health <= 0) {
      this.handleKill(attacker, target);
    }
  }
  
  calculateDamage(attacker, target) {
    // Base damage from attacker
    let damage = attacker.getBaseDamage();
    
    // Reduce by target defense
    const defense = target.getDefense();
    damage = Math.max(1, damage - defense);
    
    return Math.round(damage);
  }
  
  handleKill(attacker, target) {
    // Different handling based on target type
    if (target.entityType === 'monster') {
      this.handleMonsterKill(attacker, target);
    } else if (target.entityType === 'player') {
      this.handlePlayerDeath(target);
    }
  }
  
  handleMonsterKill(player, monster) {
    // Must be a player to get rewards
    if (player.entityType !== 'player') return;
    
    // Award XP
    const xpGain = monster.getXpValue();
    player.addExperience(xpGain);
    
    // Generate loot
    const loot = monster.generateLoot();
    
    // Drop items in the world
    if (loot.length > 0) {
      for (const itemData of loot) {
        const itemId = uuidv4();
        const item = new Item(
          itemId,
          itemData.name,
          itemData.type,
          itemData.rarity,
          monster.position,
          itemData.stats
        );
        
        this.items.set(itemId, item);
      }
    }
    
    // Set monster as dead (will respawn later)
    monster.deathTime = Date.now();
  }
  
  handlePlayerDeath(player) {
    // Drop all items
    this.dropPlayerItems(player);
    
    // Set death state
    player.death();
    
    // Notify player
    this.sendToPlayer(player.id, 'youDied', {});
  }
  
  dropPlayerItems(player) {
    // Drop equipped items
    for (const slot in player.equipment) {
      const equippedItem = player.equipment[slot];
      if (equippedItem) {
        const itemId = uuidv4();
        const item = new Item(
          itemId,
          equippedItem.name,
          equippedItem.type,
          equippedItem.rarity,
          player.position,
          equippedItem.stats
        );
        
        this.items.set(itemId, item);
        player.equipment[slot] = null;
      }
    }
    
    // Drop inventory items
    for (const inventoryItem of player.inventory) {
      if (inventoryItem) {
        const itemId = uuidv4();
        const item = new Item(
          itemId,
          inventoryItem.name,
          inventoryItem.type,
          inventoryItem.rarity,
          player.position,
          inventoryItem.stats
        );
        
        this.items.set(itemId, item);
      }
    }
    
    // Clear inventory
    player.inventory = [];
  }
  
  checkItemPickup(player, item) {
    // Skip if player is dead
    if (player.isDead()) return;
    
    // Calculate distance
    const dx = player.position.x - item.position.x;
    const dy = player.position.y - item.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if player is close enough to pick up
    if (distance <= 30) { // Pickup range
      // Check if player has room in inventory
      if (player.addToInventory(item)) {
        // Remove item from world
        this.items.delete(item.id);
        
        // Notify player
        this.sendToPlayer(player.id, 'itemPickup', {
          itemId: item.id,
          item: item.serialize()
        });
      }
    }
  }
  
  isInSafeZone(position) {
    // Check if position is near any exit (safe zone)
    for (const exit of this.exits) {
      const dx = position.x - exit.position.x;
      const dy = position.y - exit.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= 100) { // Safe zone radius
        return true;
      }
    }
    
    return false;
  }
  
  broadcastState(io) {
    io.to(this.id).emit('gameState', this.getGameState());
  }
  
  getGameState() {
    // Convert maps to objects for serialization
    const serializedPlayers = {};
    const serializedMonsters = {};
    const serializedItems = {};
    
    // Serialize players
    for (const [id, player] of this.players.entries()) {
      serializedPlayers[id] = player.serialize();
    }
    
    // Serialize monsters
    for (const [id, monster] of this.monsters.entries()) {
      serializedMonsters[id] = monster.serialize();
    }
    
    // Serialize items
    for (const [id, item] of this.items.entries()) {
      serializedItems[id] = item.serialize();
    }
    
    return {
      players: serializedPlayers,
      monsters: serializedMonsters,
      items: serializedItems
    };
  }
  
  broadcastMessage(event, data) {
    // This would use io.to(this.id).emit() in the actual implementation
    // Since we don't have direct access to io here, we'll handle it in the server
  }
  
  sendToPlayer(playerId, event, data) {
    // This would use io.to(playerId).emit() in the actual implementation
    // Since we don't have direct access to io here, we'll handle it in the server
  }
  
  /**
   * Update all projectiles and check for collisions
   */
  updateProjectiles() {
    // Process each player's projectiles
    this.players.forEach(player => {
      player.projectiles.forEach(projectile => {
        // Add to world projectiles map if not already there
        if (!this.projectiles.has(projectile.id)) {
          this.projectiles.set(projectile.id, projectile);
        }
        
        // Check for projectile collisions with monsters
        this.monsters.forEach(monster => {
          if (this.checkProjectileCollision(projectile, monster)) {
            // Handle hit
            this.handleProjectileHit(projectile, monster);
          }
        });
        
        // Check for projectile collisions with players (PvP would be enabled here)
        // Uncomment to enable PvP
        /* 
        this.players.forEach(otherPlayer => {
          if (projectile.ownerId !== otherPlayer.id) { // Don't hit self
            if (this.checkProjectileCollision(projectile, otherPlayer)) {
              // Handle hit
              this.handleProjectileHit(projectile, otherPlayer);
            }
          }
        });
        */
      });
    });
  }
  
  /**
   * Check collision between a projectile and target
   * @param {Object} projectile - The projectile object
   * @param {Object} target - The target object
   * @returns {boolean} True if collision detected
   */
  checkProjectileCollision(projectile, target) {
    // Skip if projectile is not active
    if (!projectile.active) return false;
    
    // Simple rectangle collision
    return this.rectIntersect(
      projectile.position.x - projectile.width / 2,
      projectile.position.y - projectile.height / 2,
      projectile.width,
      projectile.height,
      target.position.x - target.width / 2,
      target.position.y - target.height / 2,
      target.width,
      target.height
    );
  }
  
  /**
   * Handle a projectile hit on a target
   * @param {Object} projectile - The projectile object
   * @param {Object} target - The target hit
   */
  handleProjectileHit(projectile, target) {
    // Apply damage to target
    const damage = projectile.damage;
    target.takeDamage(damage);
    
    // Broadcast combat event
    this.broadcastMessage('combatEvent', {
      attackerId: projectile.ownerId,
      targetId: target.id,
      damage: damage,
      targetHealth: target.health,
      targetMaxHealth: target.maxHealth,
      projectileType: projectile.type
    });
    
    // Handle piercing projectiles
    if (projectile.piercing) {
      projectile.pierceCount++;
      if (projectile.pierceCount >= projectile.maxPierceCount) {
        projectile.active = false;
      }
    } else {
      // Non-piercing projectiles deactivate on hit
      projectile.active = false;
    }
    
    // Handle death
    if (target.health <= 0) {
      const attacker = this.players.get(projectile.ownerId);
      if (attacker) {
        this.handleKill(attacker, target);
      }
    }
    
    // Handle fireball explosion on impact
    if (projectile.type === 'fireball' && projectile.explodes) {
      this.handleExplosion(projectile);
    }
  }
  
  /**
   * Handle a fireball explosion
   * @param {Object} projectile - The exploding projectile
   */
  handleExplosion(projectile) {
    // Get all entities in explosion radius
    const explosionTargets = [];
    
    // Check monsters in explosion radius
    this.monsters.forEach(monster => {
      const distance = this.getDistance(projectile.position, monster.position);
      if (distance <= projectile.explosionRadius) {
        explosionTargets.push(monster);
      }
    });
    
    // Apply damage to each target in explosion
    const owner = this.players.get(projectile.ownerId);
    if (owner) {
      explosionTargets.forEach(target => {
        // Calculate damage (reduced by distance from center)
        const distance = this.getDistance(projectile.position, target.position);
        const damageMultiplier = 1 - (distance / projectile.explosionRadius);
        const damage = Math.floor(projectile.damage * damageMultiplier);
        
        // Apply damage
        target.takeDamage(damage);
        
        // Broadcast combat event for explosion damage
        this.broadcastMessage('combatEvent', {
          attackerId: projectile.ownerId,
          targetId: target.id,
          damage: damage,
          targetHealth: target.health,
          targetMaxHealth: target.maxHealth,
          isExplosion: true
        });
        
        // Handle death
        if (target.health <= 0) {
          this.handleKill(owner, target);
        }
      });
    }
    
    // Broadcast explosion effect
    this.broadcastMessage('effectEvent', {
      type: 'explosion',
      position: projectile.position,
      radius: projectile.explosionRadius
    });
  }
  
  /**
   * Calculate distance between two points
   * @param {Object} point1 - First point {x, y}
   * @param {Object} point2 - Second point {x, y}
   * @returns {number} Distance between points
   */
  getDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

module.exports = TestWorld; 