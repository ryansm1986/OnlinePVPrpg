// Player connection and input handlers

/**
 * Handle a new player connection
 * @param {Object} socket - Socket.IO socket object
 * @param {Object} game - GameWorld instance
 */
function handlePlayerConnection(socket, game) {
  // Listen for player join event
  socket.on('joinGame', (playerData) => {
    // Validate player data
    if (!playerData.name || !playerData.characterClass) {
      socket.emit('error', { message: 'Invalid player data. Name and class are required.' });
      return;
    }
    
    // Validate character class
    const validClasses = ['warrior', 'mage', 'ranger'];
    if (!validClasses.includes(playerData.characterClass.toLowerCase())) {
      socket.emit('error', { message: 'Invalid character class. Choose warrior, mage, or ranger.' });
      return;
    }
    
    // Create new player
    const player = game.addPlayer(socket.id, {
      name: playerData.name,
      characterClass: playerData.characterClass.toLowerCase()
    });
    
    // Join this game's room for broadcasts
    socket.join(game.id);
    
    // Send initial game state to player
    socket.emit('gameJoined', {
      playerId: socket.id,
      player: player.serialize(),
      gameId: game.id,
      worldSize: {
        width: game.width,
        height: game.height
      }
    });
    
    // Broadcast new player to others
    socket.to(game.id).emit('playerJoined', {
      playerId: socket.id,
      player: player.serialize()
    });
  });
  
  // Listen for world data request
  socket.on('requestWorldData', () => {
    // Send biomes, exits, landmarks
    socket.emit('worldData', {
      biomes: game.biomes.map(biome => biome.serialize()),
      exits: game.exits.map(exit => exit.serialize()),
      landmarks: game.landmarks.map(landmark => landmark.serialize())
    });
  });
}

/**
 * Handle player input
 * @param {Object} socket - Socket.IO socket object
 * @param {Object} game - GameWorld instance
 * @param {Object} inputData - Input data from client
 */
function handlePlayerInput(socket, game, inputData) {
  // Get player
  const player = game.players.get(socket.id);
  if (!player) {
    return;
  }
  
  // Process input based on type
  switch (inputData.type) {
    case 'movement':
      handleMovementInput(player, game, inputData);
      break;
      
    case 'attack':
      handleAttackInput(player, game);
      break;
      
    case 'skill':
      handleSkillInput(player, game, inputData);
      break;
      
    case 'item':
      handleItemInteraction(player, inputData);
      break;
      
    case 'exit':
      handleExitInteraction(socket, player, inputData, game);
      break;
      
    default:
      // Unknown input type
      break;
  }
}

/**
 * Process player movement input
 * @param {Object} player - Player object
 * @param {Object} game - GameWorld instance
 * @param {Object} data - Movement data
 */
function handleMovementInput(player, game, data) {
  // Update player velocity based on input
  const { directionX, directionY } = data;
  
  // Log movement for debugging
  const oldPos = { ...player.position };
  
  // Calculate movement speed
  const speed = player.getMovementSpeed();
  
  // Set player velocity
  player.velocity = {
    x: directionX * speed,
    y: directionY * speed
  };
  
  // Check for stop command
  const isStopping = (directionX === 0 && directionY === 0);
  if (isStopping) {
    console.log(`Player ${player.id} stopping at (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})`);
  } else {
    // Update player position directly for testing
    player.position.x += player.velocity.x * 0.05; // Assume 50ms delta time
    player.position.y += player.velocity.y * 0.05;
    
    // Update player facing direction
    if (directionX !== 0 || directionY !== 0) {
      if (Math.abs(directionX) > Math.abs(directionY)) {
        player.facingDirection = directionX > 0 ? 'right' : 'left';
      } else {
        player.facingDirection = directionY > 0 ? 'down' : 'up';
      }
    }
    
    // Log position change
    console.log(`Player ${player.id} moved from (${oldPos.x.toFixed(1)}, ${oldPos.y.toFixed(1)}) to (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})`);
  }
}

/**
 * Process player attack input
 * @param {Object} player - Player object
 * @param {Object} game - GameWorld instance
 */
function handleAttackInput(player, game) {
  // Handle basic attack
  if (player.attackCooldown <= 0) {
    // For mage and ranger, create projectile attacks
    if (player.characterClass === 'mage' || player.characterClass === 'ranger') {
      const projectile = player.fireProjectile();
      
      if (projectile) {
        // Broadcast projectile creation
        game.broadcastMessage('projectileCreated', {
          id: projectile.id,
          ownerId: player.id,
          type: projectile.type,
          position: projectile.position,
          velocity: projectile.velocity,
          angle: projectile.angle
        });
      }
    } else {
      // For warrior and other melee classes
      // Set player as attacking
      player.isAttacking = true;
      player.attackDirection = player.facingDirection;
      
      // Set attack duration and cooldown
      player.attackDuration = player.getAttackDuration();
      player.attackCooldown = player.getAttackCooldown();
    }
  }
}

/**
 * Process player skill input
 * @param {Object} player - Player object
 * @param {Object} game - GameWorld instance
 * @param {Object} data - Skill data
 */
function handleSkillInput(player, game, data) {
  const { skillId } = data;
  
  // Check if skill is on cooldown
  if (player.skillCooldowns[skillId] > 0) {
    return;
  }
  
  // Use the skill based on character class
  if (player.characterClass === 'warrior') {
    if (skillId === 1) {
      // Cleave (multi-target melee attack)
      useWarriorCleave(player, game);
    }
  } 
  else if (player.characterClass === 'mage') {
    if (skillId === 1) {
      // Enhanced fireball (larger and more damage)
      useMageFireball(player, game, data);
    }
  } 
  else if (player.characterClass === 'ranger') {
    if (skillId === 1) {
      // Multi-shot (multiple arrows)
      useRangerMultishot(player, game);
    }
  }
}

/**
 * Warrior's cleave skill
 * @param {Object} player - Player object
 * @param {Object} game - GameWorld instance
 */
function useWarriorCleave(player, game) {
  // Set cleave cooldown
  player.skillCooldowns[1] = 5000; // 5 seconds
  
  // Implement cleave effect
  // This would actually be implemented in the game world's collision detection
  player.isUsingCleave = true;
  player.cleaveDirection = player.facingDirection;
  player.cleaveRange = 1.5 * player.getAttackRange(); // Wider attack
  
  // Set duration
  player.cleaveTimer = 500; // 0.5 seconds
}

/**
 * Mage's fireball skill
 * @param {Object} player - Player object
 * @param {Object} game - GameWorld instance
 * @param {Object} data - Skill data with target position
 */
function useMageFireball(player, game, data) {
  // Set fireball cooldown
  player.skillCooldowns[1] = 8000; // 8 seconds
  
  // Create an enhanced fireball projectile
  const projectile = player.createProjectile();
  
  if (projectile) {
    // Enhance the projectile for skill version
    projectile.damage *= 2; // Double damage
    projectile.explosionRadius *= 1.5; // 50% larger explosion
    projectile.width *= 1.5; // 50% larger size
    projectile.height *= 1.5;
    
    // Add to player's projectiles
    player.projectiles.push(projectile);
    
    // Broadcast projectile creation
    game.broadcastMessage('projectileCreated', {
      id: projectile.id,
      ownerId: player.id,
      type: projectile.type,
      position: projectile.position,
      velocity: projectile.velocity,
      angle: projectile.angle,
      isSkill: true,
      width: projectile.width,
      height: projectile.height
    });
  }
}

/**
 * Ranger's multishot skill
 * @param {Object} player - Player object
 * @param {Object} game - GameWorld instance
 */
function useRangerMultishot(player, game) {
  // Set multishot cooldown
  player.skillCooldowns[1] = 6000; // 6 seconds
  
  // Create multiple arrows
  const arrowCount = 3;
  const spreadAngle = 15; // degrees between arrows
  
  // Store original facing direction
  const originalDirection = player.facingDirection;
  
  // Create center arrow first
  const centerArrow = player.createProjectile();
  
  if (centerArrow) {
    // Add to player's projectiles
    player.projectiles.push(centerArrow);
    
    // Broadcast projectile creation
    game.broadcastMessage('projectileCreated', {
      id: centerArrow.id,
      ownerId: player.id,
      type: centerArrow.type,
      position: centerArrow.position,
      velocity: centerArrow.velocity,
      angle: centerArrow.angle,
      isSkill: true
    });
    
    // Create side arrows with angle spread
    for (let i = 1; i <= arrowCount / 2; i++) {
      // Calculate angles for side arrows
      const leftAngle = centerArrow.angle - (spreadAngle * i);
      const rightAngle = centerArrow.angle + (spreadAngle * i);
      
      // Create left arrow
      const leftArrow = { ...centerArrow };
      leftArrow.id = `${player.id}_proj_${Date.now()}_L${i}`;
      
      // Calculate velocity based on angle
      const leftRadians = (leftAngle * Math.PI) / 180;
      leftArrow.velocity = {
        x: Math.cos(leftRadians) * centerArrow.speed * 0.001,
        y: Math.sin(leftRadians) * centerArrow.speed * 0.001
      };
      leftArrow.angle = leftAngle;
      
      // Create right arrow
      const rightArrow = { ...centerArrow };
      rightArrow.id = `${player.id}_proj_${Date.now()}_R${i}`;
      
      // Calculate velocity based on angle
      const rightRadians = (rightAngle * Math.PI) / 180;
      rightArrow.velocity = {
        x: Math.cos(rightRadians) * centerArrow.speed * 0.001,
        y: Math.sin(rightRadians) * centerArrow.speed * 0.001
      };
      rightArrow.angle = rightAngle;
      
      // Add to player's projectiles
      player.projectiles.push(leftArrow);
      player.projectiles.push(rightArrow);
      
      // Broadcast left arrow creation
      game.broadcastMessage('projectileCreated', {
        id: leftArrow.id,
        ownerId: player.id,
        type: leftArrow.type,
        position: leftArrow.position,
        velocity: leftArrow.velocity,
        angle: leftArrow.angle,
        isSkill: true
      });
      
      // Broadcast right arrow creation
      game.broadcastMessage('projectileCreated', {
        id: rightArrow.id,
        ownerId: player.id,
        type: rightArrow.type,
        position: rightArrow.position,
        velocity: rightArrow.velocity,
        angle: rightArrow.angle,
        isSkill: true
      });
    }
  }
}

/**
 * Handle item interactions (equip, use, drop)
 * @param {Object} player - Player object
 * @param {Object} data - Item interaction data
 */
function handleItemInteraction(player, data) {
  const { action, itemId, slot } = data;
  
  switch (action) {
    case 'equip':
      player.equipItem(itemId, slot);
      break;
    case 'unequip':
      player.unequipItem(slot);
      break;
    case 'drop':
      player.dropItem(itemId);
      break;
    case 'use':
      player.useItem(itemId);
      break;
    default:
      // Invalid action
      break;
  }
}

/**
 * Handle player interaction with an exit point
 * @param {Object} socket - Socket.IO socket
 * @param {Object} player - Player object
 * @param {Object} data - Exit data
 * @param {Object} game - GameWorld instance
 */
function handleExitInteraction(socket, player, data, game) {
  const { exitId } = data;
  
  // Find the exit
  const exit = game.exits.find(e => e.id === exitId);
  
  if (!exit) {
    socket.emit('error', { message: 'Exit not found' });
    return;
  }
  
  // Check if player is close enough to the exit
  const distance = Math.sqrt(
    Math.pow(player.position.x - exit.position.x, 2) + 
    Math.pow(player.position.y - exit.position.y, 2)
  );
  
  if (distance <= exit.interactionRadius) {
    // Save player's inventory/equipment to persistent storage
    // This would actually interact with a database or other storage
    
    // Send confirmation to client
    socket.emit('exitSuccess', {
      exitId: exitId,
      exitName: exit.name,
      inventory: player.inventory,
      equipment: player.equipment
    });
    
    // Remove player from game
    game.removePlayer(socket.id);
    
    // Leave the game room
    socket.leave(game.id);
  } else {
    socket.emit('error', { message: 'Too far from exit' });
  }
}

module.exports = {
  handlePlayerConnection,
  handlePlayerInput
}; 