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
    
    // Simple world properties
    this.width = 1000;
    this.height = 1000;
    
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
    // Create a single monster in the center of the map
    const monsterId = uuidv4();
    const position = {
      x: this.width / 2 + 50, // 50 pixels to the right of center
      y: this.height / 2
    };
    
    const monster = new Monster(monsterId, 'wolf', position);
    monster.health = 50; // Make it easier to kill
    monster.maxHealth = 50;
    monster.aggroRange = 150; // Smaller aggro range for testing
    
    // Add to monsters map
    this.monsters.set(monsterId, monster);
    console.log(`Test monster spawned at ${position.x}, ${position.y}`);
  }
  
  addPlayer(socketId, playerData) {
    // Create player at center of the map
    const position = { x: this.width / 2, y: this.height / 2 };
    
    const player = new Player(
      socketId,
      playerData.name,
      playerData.characterClass,
      position
    );
    
    // Add to players map
    this.players.set(socketId, player);
    console.log(`Player ${playerData.name} joined as ${playerData.characterClass}`);
    
    return player;
  }
  
  removePlayer(socketId) {
    if (this.players.has(socketId)) {
      const player = this.players.get(socketId);
      console.log(`Player ${player.name} left the game`);
      this.players.delete(socketId);
    }
  }
  
  getRandomSpawnPoint() {
    // Always spawn in the center for testing
    return { x: this.width / 2, y: this.height / 2 };
  }
  
  update() {
    // Update players' positions based on velocity
    this.players.forEach(player => {
      // Only apply movement if velocity is non-zero
      if (player.velocity.x !== 0 || player.velocity.y !== 0) {
        // Apply velocity to position
        player.position.x += player.velocity.x * 0.05; // Assume 50ms update rate
        player.position.y += player.velocity.y * 0.05;
        
        // Boundary checking to keep players in the world
        player.position.x = Math.max(0, Math.min(this.width, player.position.x));
        player.position.y = Math.max(0, Math.min(this.height, player.position.y));
      }
    });
    
    // Update monsters
    this.monsters.forEach(monster => {
      if (!monster.isDead()) {
        monster.update(this);
      } else if (monster.canRespawn()) {
        monster.respawn();
      }
    });
    
    // Check collisions
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
}

module.exports = TestWorld; 