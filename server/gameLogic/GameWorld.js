const { v4: uuidv4 } = require('uuid');
const Player = require('./entities/Player');
const Monster = require('./entities/Monster');
const Boss = require('./entities/Boss');
const Item = require('./items/Item');
const WorldGenerator = require('./WorldGenerator');

class GameWorld {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // Map of player objects by socket ID
    this.monsters = new Map(); // Map of monster objects by UUID
    this.items = new Map(); // Map of dropped items by UUID
    this.bosses = new Map(); // Map of boss objects by UUID
    
    // World properties
    this.width = 2000;
    this.height = 2000;
    this.biomes = []; // Will be populated by WorldGenerator
    
    // Initialize the world
    this.worldGenerator = new WorldGenerator(this.width, this.height);
    this.generateWorld();
    
    // Game timers
    this.lastBossSpawnCheck = Date.now();
    this.bossSpawnCheckInterval = 10 * 60 * 1000; // 10 minutes
    this.bossSpawnChance = 0.05; // 5% chance
  }
  
  generateWorld() {
    const world = this.worldGenerator.generate();
    this.biomes = world.biomes;
    this.exits = world.exits;
    this.landmarks = world.landmarks;
    
    // Spawn initial monsters
    this.spawnInitialMonsters();
  }
  
  spawnInitialMonsters() {
    // Spawn monsters in each biome
    for (const biome of this.biomes) {
      const monsterCount = biome.getMonsterSpawnCount();
      
      for (let i = 0; i < monsterCount; i++) {
        const monsterType = biome.getRandomMonsterType();
        const position = biome.getRandomPosition();
        
        this.spawnMonster(monsterType, position);
      }
    }
  }
  
  spawnMonster(type, position) {
    const monsterId = uuidv4();
    const monster = new Monster(monsterId, type, position);
    this.monsters.set(monsterId, monster);
    return monster;
  }
  
  checkBossSpawn() {
    const now = Date.now();
    
    // Check if it's time to possibly spawn a boss
    if (now - this.lastBossSpawnCheck >= this.bossSpawnCheckInterval) {
      this.lastBossSpawnCheck = now;
      
      // Roll for boss spawn
      if (Math.random() < this.bossSpawnChance) {
        this.spawnBoss();
      }
    }
  }
  
  spawnBoss() {
    // Get a random landmark for boss spawn
    const landmark = this.landmarks[Math.floor(Math.random() * this.landmarks.length)];
    const bossId = uuidv4();
    const bossType = this.getBossTypeForLandmark(landmark);
    
    const boss = new Boss(bossId, bossType, landmark.position);
    this.bosses.set(bossId, boss);
    
    // Broadcast boss spawn to all players
    this.broadcastMessage('bossSpawn', {
      bossId: boss.id,
      type: boss.type,
      position: boss.position,
      landmarkName: landmark.name
    });
    
    console.log(`Boss ${bossType} spawned at ${landmark.name}`);
    return boss;
  }
  
  getBossTypeForLandmark(landmark) {
    // This would have more logic based on landmark type
    const bossTypes = ['dragon', 'lich', 'giant', 'demon'];
    return bossTypes[Math.floor(Math.random() * bossTypes.length)];
  }
  
  addPlayer(socketId, playerData) {
    // Find a spawn point
    const spawnPoint = this.getRandomSpawnPoint();
    
    // Create new player
    const player = new Player(
      socketId, 
      playerData.name, 
      playerData.characterClass,
      spawnPoint
    );
    
    this.players.set(socketId, player);
    return player;
  }
  
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    
    if (player) {
      // Drop player's items on death if they have any
      this.dropPlayerItems(player);
      this.players.delete(socketId);
    }
  }
  
  dropPlayerItems(player) {
    if (!player.equipment) return;
    
    // Create dropped items from player's equipment
    for (const [slot, item] of Object.entries(player.equipment)) {
      if (item) {
        const droppedItemId = uuidv4();
        const droppedItem = new Item(
          droppedItemId,
          item.type,
          item.rarity,
          item.stats,
          player.position
        );
        
        this.items.set(droppedItemId, droppedItem);
      }
    }
  }
  
  getRandomSpawnPoint() {
    // For now, just a random position away from edges
    return {
      x: 100 + Math.random() * (this.width - 200),
      y: 100 + Math.random() * (this.height - 200)
    };
  }
  
  update() {
    // Update all entities
    this.updateMonsters();
    this.updateBosses();
    this.checkBossSpawn();
    this.checkCollisions();
  }
  
  updateMonsters() {
    for (const monster of this.monsters.values()) {
      monster.update(this);
      
      // Respawn monsters if needed
      if (monster.isDead() && monster.canRespawn()) {
        this.monsters.delete(monster.id);
        
        // Find a biome to spawn in
        const biome = this.getRandomBiome();
        const monsterType = biome.getRandomMonsterType();
        const position = biome.getRandomPosition();
        
        this.spawnMonster(monsterType, position);
      }
    }
  }
  
  updateBosses() {
    for (const boss of this.bosses.values()) {
      boss.update(this);
      
      // Remove dead bosses
      if (boss.isDead()) {
        this.bosses.delete(boss.id);
      }
    }
  }
  
  checkCollisions() {
    // Check player-monster collisions (attacks)
    for (const player of this.players.values()) {
      // Only check for active attacks
      if (player.isAttacking) {
        // Check against monsters
        for (const monster of this.monsters.values()) {
          if (this.checkAttackCollision(player, monster)) {
            this.handleCombat(player, monster);
          }
        }
        
        // Check against bosses
        for (const boss of this.bosses.values()) {
          if (this.checkAttackCollision(player, boss)) {
            this.handleCombat(player, boss);
          }
        }
        
        // Check against other players (PVP)
        for (const otherPlayer of this.players.values()) {
          if (player.id !== otherPlayer.id && this.checkAttackCollision(player, otherPlayer)) {
            this.handlePvpCombat(player, otherPlayer);
          }
        }
      }
      
      // Check item pickups
      for (const [itemId, item] of this.items.entries()) {
        if (this.checkItemPickup(player, item)) {
          player.addItemToInventory(item);
          this.items.delete(itemId);
          
          // Notify the player
          this.sendToPlayer(player.id, 'itemPickup', { 
            itemId: item.id,
            name: item.name,
            type: item.type,
            rarity: item.rarity,
            stats: item.stats
          });
        }
      }
    }
    
    // Check monster attacks against players
    for (const monster of this.monsters.values()) {
      if (monster.isAttacking) {
        for (const player of this.players.values()) {
          if (this.checkAttackCollision(monster, player)) {
            this.handleCombat(monster, player);
          }
        }
      }
    }
    
    // Check boss attacks against players
    for (const boss of this.bosses.values()) {
      if (boss.isAttacking) {
        for (const player of this.players.values()) {
          if (this.checkAttackCollision(boss, player)) {
            this.handleCombat(boss, player);
          }
        }
      }
    }
  }
  
  checkAttackCollision(attacker, target) {
    // Simple bounding box collision check
    const attackRange = attacker.getAttackRange();
    
    // Get attack box based on attacker position and direction
    const attackBox = this.getAttackBox(attacker, attackRange);
    
    // Get target's hitbox
    const targetHitbox = {
      x: target.position.x - target.width / 2,
      y: target.position.y - target.height / 2,
      width: target.width,
      height: target.height
    };
    
    // Check for overlap
    return !(
      attackBox.x + attackBox.width < targetHitbox.x ||
      attackBox.x > targetHitbox.x + targetHitbox.width ||
      attackBox.y + attackBox.height < targetHitbox.y ||
      attackBox.y > targetHitbox.y + targetHitbox.height
    );
  }
  
  getAttackBox(attacker, range) {
    let attackBox = {
      x: attacker.position.x - range / 2,
      y: attacker.position.y - range / 2,
      width: range,
      height: range
    };
    
    // Adjust based on attack direction for directional attacks
    if (attacker.attackDirection) {
      const dir = attacker.attackDirection;
      if (dir === 'right') {
        attackBox.x = attacker.position.x;
      } else if (dir === 'left') {
        attackBox.x = attacker.position.x - range;
      } else if (dir === 'down') {
        attackBox.y = attacker.position.y;
      } else if (dir === 'up') {
        attackBox.y = attacker.position.y - range;
      }
    }
    
    return attackBox;
  }
  
  handleCombat(attacker, target) {
    // Calculate damage
    const damage = this.calculateDamage(attacker, target);
    
    // Apply damage to target
    target.takeDamage(damage);
    
    // Send combat event to clients
    this.broadcastMessage('combatEvent', {
      attackerId: attacker.id,
      targetId: target.id,
      damage: damage,
      targetHealth: target.health,
      isCritical: false // Add critical hit logic later
    });
    
    // Check for kills
    if (target.health <= 0) {
      this.handleKill(attacker, target);
    }
  }
  
  handlePvpCombat(attacker, target) {
    // Only allow PVP outside safe zones
    if (this.isInSafeZone(target.position)) {
      return;
    }
    
    this.handleCombat(attacker, target);
  }
  
  isInSafeZone(position) {
    // Check if position is near any exit (safe zone)
    for (const exit of this.exits) {
      const distance = Math.sqrt(
        Math.pow(position.x - exit.position.x, 2) + 
        Math.pow(position.y - exit.position.y, 2)
      );
      
      if (distance < exit.safeZoneRadius) {
        return true;
      }
    }
    
    return false;
  }
  
  calculateDamage(attacker, target) {
    // Base damage calculation from spec:
    // Base Damage (weapon) + Primary Stat (Strength/Intelligence/Dexterity) × Modifier - Enemy Defense
    let baseDamage = attacker.getBaseDamage();
    let primaryStat = attacker.getPrimaryStat();
    let statModifier = 0.5; // Can be adjusted for balance
    let targetDefense = target.getDefense();
    
    let damage = baseDamage + (primaryStat * statModifier) - targetDefense;
    
    // Ensure minimum damage
    return Math.max(1, Math.floor(damage));
  }
  
  handleKill(attacker, target) {
    // Handle player killing a monster or boss
    if (attacker.type === 'player') {
      if (target.type === 'monster') {
        this.handleMonsterKill(attacker, target);
      } else if (target.type === 'boss') {
        this.handleBossKill(attacker, target);
      } else if (target.type === 'player') {
        this.handlePlayerKill(attacker, target);
      }
    }
    
    // Handle monster or boss killing a player
    if (target.type === 'player') {
      this.handlePlayerDeath(target);
    }
  }
  
  handleMonsterKill(player, monster) {
    // Award XP
    const xpGained = monster.getXpValue();
    player.addXp(xpGained);
    
    // Generate loot
    const loot = monster.generateLoot();
    if (loot) {
      const itemId = uuidv4();
      const droppedItem = new Item(
        itemId,
        loot.type,
        loot.rarity,
        loot.stats,
        monster.position
      );
      
      this.items.set(itemId, droppedItem);
    }
    
    // Notify player
    this.sendToPlayer(player.id, 'monsterKill', {
      monsterId: monster.id,
      monsterType: monster.type,
      xpGained: xpGained
    });
  }
  
  handleBossKill(player, boss) {
    // Award XP
    const xpGained = boss.getXpValue();
    player.addXp(xpGained);
    
    // Generate guaranteed loot (rare+)
    const loot = boss.generateLoot();
    
    // Create the dropped items
    for (const lootItem of loot) {
      const itemId = uuidv4();
      const droppedItem = new Item(
        itemId,
        lootItem.type,
        lootItem.rarity,
        lootItem.stats,
        boss.position
      );
      
      this.items.set(itemId, droppedItem);
    }
    
    // Notify all players
    this.broadcastMessage('bossKill', {
      bossId: boss.id,
      bossType: boss.type,
      killerName: player.name
    });
  }
  
  handlePlayerKill(killer, victim) {
    // Award XP for PVP kill
    const xpGained = 100; // Fixed XP for PVP kills
    killer.addXp(xpGained);
    
    // Notify both players
    this.sendToPlayer(killer.id, 'playerKill', {
      victimName: victim.name,
      xpGained: xpGained
    });
    
    this.sendToPlayer(victim.id, 'youWereKilled', {
      killerName: killer.name
    });
    
    // Handle victim death (drop items)
    this.handlePlayerDeath(victim);
  }
  
  handlePlayerDeath(player) {
    // Drop all equipped items
    this.dropPlayerItems(player);
    
    // Respawn player at a spawn point
    const spawnPoint = this.getRandomSpawnPoint();
    player.position = spawnPoint;
    player.health = player.getMaxHealth();
    
    // Notify the player
    this.sendToPlayer(player.id, 'youDied', {
      respawnPosition: spawnPoint
    });
  }
  
  checkItemPickup(player, item) {
    // Simple distance check for item pickup
    const pickupRange = 30; // Pixels
    const distance = Math.sqrt(
      Math.pow(player.position.x - item.position.x, 2) + 
      Math.pow(player.position.y - item.position.y, 2)
    );
    
    return distance <= pickupRange;
  }
  
  getRandomBiome() {
    return this.biomes[Math.floor(Math.random() * this.biomes.length)];
  }
  
  broadcastState(io) {
    // Prepare game state for clients
    const gameState = this.getGameState();
    
    // Send game state to all players in this game
    for (const playerId of this.players.keys()) {
      io.to(playerId).emit('gameState', gameState);
    }
  }
  
  getGameState() {
    // Prepare a serialized game state to send to clients
    return {
      players: Array.from(this.players.values()).map(player => player.serialize()),
      monsters: Array.from(this.monsters.values()).map(monster => monster.serialize()),
      bosses: Array.from(this.bosses.values()).map(boss => boss.serialize()),
      items: Array.from(this.items.values()).map(item => item.serialize())
    };
  }
  
  broadcastMessage(event, data) {
    // To be implemented with Socket.IO
  }
  
  sendToPlayer(playerId, event, data) {
    // To be implemented with Socket.IO
  }
}

module.exports = GameWorld; 