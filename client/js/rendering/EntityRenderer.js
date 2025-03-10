/**
 * EntityRenderer class
 * Handles rendering of all game entities (players, monsters, items, projectiles)
 */
class EntityRenderer {
  /**
   * Create a new EntityRenderer
   * @param {Renderer} renderer - Reference to the renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    
    // Sprite caches to prevent memory leaks and improve performance
    this._playerSpriteCache = new Map();
    this._monsterSpriteCache = new Map();
    this._bossSpriteCache = new Map();
    this._itemSpriteCache = new Map();
    this._projectileSpriteCache = new Map();
    
    // Text label caches
    this._playerTextCache = new Map();
    this._monsterTextCache = new Map();
  }
  
  /**
   * Render all game entities
   */
  renderEntities() {
    if (!this.renderer.app || !this.renderer.game) return;
    
    try {
      // Clear entity layers to prevent duplicates
      this.clearEntityLayers();
      
      // Render the local player
      if (this.renderer.game.player) {
        this.renderPlayerSprite(this.renderer.game.player, true);
      }
      
      // Render other players
      this.renderer.game.players.forEach(player => {
        if (player !== this.renderer.game.player) {
          this.renderPlayerSprite(player, false);
        }
      });
      
      // Render monsters
      this.renderer.game.monsters.forEach(monster => {
        this.renderMonsterSprite(monster);
      });
      
      // Render bosses
      this.renderer.game.bosses.forEach(boss => {
        this.renderBossSprite(boss);
      });
      
      // Render items
      this.renderer.game.items.forEach(item => {
        this.renderItemSprite(item);
      });
    } catch (error) {
      console.error("Error rendering entities:", error);
    }
  }
  
  /**
   * Clear entity layers to prevent duplicates
   */
  clearEntityLayers() {
    // Keep sprites in memory caches but remove them from the stage
    this.renderer.entityLayer.removeChildren();
    this.renderer.itemLayer.removeChildren();
  }
  
  /**
   * Render a player sprite
   * @param {Object} player - The player to render
   * @param {boolean} isLocalPlayer - Whether this is the local player
   */
  renderPlayerSprite(player, isLocalPlayer) {
    // Comprehensive null checks to prevent errors
    if (!player) {
      console.warn("Cannot render player: player is undefined");
      return;
    }
    
    if (!player.position || typeof player.position.x !== 'number' || typeof player.position.y !== 'number') {
      console.warn("Cannot render player: invalid position", player.id, player.position);
      return;
    }
    
    const charClass = player.characterClass || 'warrior';
    const playerId = player.id || 'local-player';
    
    try {
      // Get textures for this character class from the TextureManager
      const textures = this.renderer.textureManager.getPlayerTextures(charClass);
      
      // Debug information about sprite textures
      if (CONFIG.SPRITE_SHEET_DEBUG && isLocalPlayer && !this._debugLogged) {
        console.group('Sprite Sheet Debug Info');
        console.log(`Class: ${charClass}`);
        console.log(`Directions available:`, Object.keys(textures));
        
        // Log dimensions of one frame
        if (textures.down && textures.down[0]) {
          const frame = textures.down[0].frame;
          console.log(`Frame dimensions: ${frame.width}x${frame.height}`);
          console.log(`Frame position: (${frame.x}, ${frame.y})`);
          console.log(`Total frames:`, {
            'up': textures.up?.length || 0,
            'down': textures.down?.length || 0,
            'left': textures.left?.length || 0,
            'right': textures.right?.length || 0
          });
          
          // Log base texture dimensions if available
          const baseTexture = textures.down[0].baseTexture;
          if (baseTexture) {
            console.log(`Base texture dimensions: ${baseTexture.width}x${baseTexture.height}`);
            console.log(`Base texture URL:`, baseTexture.cacheId);
          }
        }
        
        console.groupEnd();
        this._debugLogged = true;
      }
      
      // Create or reuse sprite
      let sprite = this._playerSpriteCache.get(playerId);
      
      // Calculate animation parameters
      let direction = this.getPlayerDirection(player);
      let frames = textures[direction] || textures.down;
      
      // Calculate animation frame based on player's state and time
      const frameIndex = this.getAnimationFrameIndex(player, frames.length);
      const currentTexture = frames[frameIndex];
      
      // Create sprite if it doesn't exist, or update texture if it does
      if (!sprite) {
        // Create new sprite
        sprite = new PIXI.Sprite(currentTexture);
        this._playerSpriteCache.set(playerId, sprite);
        
        // Set the anchor to center the sprite on the player's position
        sprite.anchor.set(0.5, 0.5);
        
        // Set the size if we're not using sprite sheets
        if (!CONFIG.USE_SPRITE_SHEETS) {
          sprite.width = CONFIG.PLAYER_SIZE;
          sprite.height = CONFIG.PLAYER_SIZE;
        }
      } else {
        // Update existing sprite texture
        sprite.texture = currentTexture;
      }
      
      // Update sprite position
      sprite.position.set(player.position.x, player.position.y);
      
      // Add effects for attacking state
      if (player.isAttacking) {
        sprite.tint = 0xFFCCCC; // Slight red tint while attacking
      } else {
        sprite.tint = 0xFFFFFF; // Normal color
      }
      
      // Add to entity layer
      this.renderer.entityLayer.addChild(sprite);
      
      // Render player name
      this.renderPlayerName(player);
      
      // Render player health bar
      this.renderPlayerHealth(player);
      
    } catch (error) {
      console.error("Error rendering player sprite:", error);
    }
  }
  
  /**
   * Get player movement direction
   * @param {Object} player - The player entity
   * @returns {string} - Direction: 'up', 'down', 'left', or 'right'
   */
  getPlayerDirection(player) {
    // Always prioritize the player's facing direction if available
    if (player.facingDirection) {
      return player.facingDirection;
    }
    
    // Fallback options if facingDirection is not set
    
    // If player has movement data, determine direction from velocity
    if (player.velocity && (player.velocity.x !== 0 || player.velocity.y !== 0)) {
      if (Math.abs(player.velocity.x) > Math.abs(player.velocity.y)) {
        // Moving more horizontally than vertically
        return player.velocity.x > 0 ? 'right' : 'left';
      } else {
        // Moving more vertically than horizontally
        return player.velocity.y > 0 ? 'down' : 'up';
      }
    }
    
    // If no movement and no facing direction, use animation state or default to 'down'
    if (player.animationState && player.animationState !== 'idle') {
      return player.animationState;
    }
    
    return 'down'; // Default direction
  }
  
  /**
   * Get animation frame index based on player state and time
   * @param {Object} player - The player entity
   * @param {number} totalFrames - Total frames in the animation
   * @returns {number} - Frame index to display
   */
  getAnimationFrameIndex(player, totalFrames) {
    // If no animation data, use system time for continuous animation
    if (!player.animationTime) {
      // Animation speed: frames per second
      const animationSpeed = player.isAttacking ? 12 : // Faster during attack
                            (this.isMoving(player) ? 8 : 4); // Normal/idle speeds
      
      // Calculate frame based on current time
      return Math.floor(Date.now() / (1000 / animationSpeed)) % totalFrames;
    }
    
    // Use player's animation data if available
    return player.animationFrame % totalFrames;
  }
  
  /**
   * Check if player is moving
   * @param {Object} player - The player entity
   * @returns {boolean} - True if player is moving
   */
  isMoving(player) {
    // Check if player has velocity
    if (player.velocity) {
      return player.velocity.x !== 0 || player.velocity.y !== 0;
    }
    
    // Check if player's position is different from target position
    if (player.position && player.targetPosition) {
      return player.position.x !== player.targetPosition.x || 
             player.position.y !== player.targetPosition.y;
    }
    
    // Check animation state
    return player.animationState === 'walk';
  }
  
  /**
   * Render a monster sprite
   * @param {Object} monster - The monster to render
   */
  renderMonsterSprite(monster) {
    // Skip if monster is invalid
    if (!monster || !monster.position) return;
    
    try {
      // Get or create sprite
      let sprite = this._monsterSpriteCache.get(monster.id);
      
      if (!sprite) {
        // Determine texture based on monster type
        let texture;
        if (monster.type && this.renderer.textureManager.textures.monster[monster.type]) {
          texture = this.renderer.textureManager.textures.monster[monster.type];
        } else {
          // Fallback texture
          texture = this.renderer.textureManager.createColoredRectTexture(
            0xAAAAAA, CONFIG.MONSTER_SIZE, CONFIG.MONSTER_SIZE
          );
        }
        
        // Create sprite
        sprite = new PIXI.Sprite(texture);
        this._monsterSpriteCache.set(monster.id, sprite);
        
        // Configure sprite
        sprite.anchor.set(0.5, 0.5);
        sprite.width = CONFIG.MONSTER_SIZE;
        sprite.height = CONFIG.MONSTER_SIZE;
      }
      
      // Update position
      sprite.position.set(monster.position.x, monster.position.y);
      
      // Add visual effects for attacking/hit
      if (monster.isAttacking) {
        sprite.tint = 0xFF8888; // Red tint for attacking
      } else if (monster.isHit) {
        sprite.tint = 0xFFFFFF * Math.random(); // Flash when hit
      } else {
        sprite.tint = 0xFFFFFF; // Normal color
      }
      
      // Add to entity layer
      this.renderer.entityLayer.addChild(sprite);
      
      // Render monster health bar
      this.renderMonsterHealth(monster);
      
    } catch (error) {
      console.error("Error rendering monster sprite:", error);
    }
  }
  
  /**
   * Render a boss sprite
   * @param {Object} boss - The boss to render
   */
  renderBossSprite(boss) {
    // Skip if boss is invalid
    if (!boss || !boss.position) return;
    
    try {
      // Get or create sprite
      let sprite = this._bossSpriteCache.get(boss.id);
      
      if (!sprite) {
        // Determine texture based on boss type
        let texture;
        if (boss.type && this.renderer.textureManager.textures.boss[boss.type]) {
          texture = this.renderer.textureManager.textures.boss[boss.type];
        } else {
          // Fallback texture (larger than monsters)
          texture = this.renderer.textureManager.createColoredRectTexture(
            0xFF0000, CONFIG.MONSTER_SIZE * 2, CONFIG.MONSTER_SIZE * 2
          );
        }
        
        // Create sprite
        sprite = new PIXI.Sprite(texture);
        this._bossSpriteCache.set(boss.id, sprite);
        
        // Configure sprite
        sprite.anchor.set(0.5, 0.5);
        sprite.width = CONFIG.MONSTER_SIZE * 2;
        sprite.height = CONFIG.MONSTER_SIZE * 2;
      }
      
      // Update position
      sprite.position.set(boss.position.x, boss.position.y);
      
      // Add visual effects for attacking/hit
      if (boss.isAttacking) {
        sprite.tint = 0xFF0000; // Bright red for attacking
      } else if (boss.isHit) {
        sprite.tint = 0xFFFFFF * Math.random(); // Flash when hit
      } else {
        sprite.tint = 0xFF8888; // Slight reddish tint normally
      }
      
      // Add to entity layer
      this.renderer.entityLayer.addChild(sprite);
      
      // Render boss name and health
      this.renderBossHealth(boss);
      
    } catch (error) {
      console.error("Error rendering boss sprite:", error);
    }
  }
  
  /**
   * Render an item sprite
   * @param {Object} item - The item to render
   */
  renderItemSprite(item) {
    // Skip if item is invalid
    if (!item || !item.position) return;
    
    try {
      // Get or create sprite
      let sprite = this._itemSpriteCache.get(item.id);
      
      if (!sprite) {
        // Create a simple colored rectangle based on item rarity
        let color = 0xFFFFFF; // Default white for common items
        
        if (item.rarity === 'rare') {
          color = 0x4169E1; // Royal blue
        } else if (item.rarity === 'legendary') {
          color = 0xFFD700; // Gold
        }
        
        // Create texture and sprite
        const texture = this.renderer.textureManager.createColoredRectTexture(
          color, CONFIG.ITEM_SIZE, CONFIG.ITEM_SIZE
        );
        
        sprite = new PIXI.Sprite(texture);
        this._itemSpriteCache.set(item.id, sprite);
        
        // Configure sprite
        sprite.anchor.set(0.5, 0.5);
        sprite.width = CONFIG.ITEM_SIZE;
        sprite.height = CONFIG.ITEM_SIZE;
        
        // Add visual effects for rare/legendary items
        if (item.rarity === 'legendary') {
          // Pulsing glow effect
          const pulseEffect = () => {
            const time = Date.now() / 500;
            const scale = 1 + Math.sin(time) * 0.1;
            sprite.scale.set(scale, scale);
          };
          
          this.renderer.animationManager.trackAnimation({
            update: pulseEffect,
            target: item.id
          });
        }
      }
      
      // Update position
      sprite.position.set(item.position.x, item.position.y);
      
      // Add to item layer
      this.renderer.itemLayer.addChild(sprite);
      
    } catch (error) {
      console.error("Error rendering item sprite:", error);
    }
  }
  
  /**
   * Render player name and level
   * @param {Object} player - The player to render name for
   */
  renderPlayerName(player) {
    if (!player || !player.name) return;
    
    try {
      // Get or create text
      let text = this._playerTextCache.get(player.id);
      
      if (!text) {
        // Create text with player name and level
        text = new PIXI.Text(`${player.name} Lv${player.level || 1}`, {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xFFFFFF,
          align: 'center',
          stroke: 0x000000,
          strokeThickness: 3
        });
        
        text.anchor.set(0.5, 1);
        this._playerTextCache.set(player.id, text);
      } else {
        // Update text content in case name or level changed
        text.text = `${player.name} Lv${player.level || 1}`;
      }
      
      // Position above player
      text.position.set(
        player.position.x,
        player.position.y - CONFIG.PLAYER_SIZE/2 - 10
      );
      
      // Add to entity layer
      this.renderer.entityLayer.addChild(text);
      
    } catch (error) {
      console.error("Error rendering player name:", error);
    }
  }
  
  /**
   * Render player health bar
   * @param {Object} player - The player to render health for
   */
  renderPlayerHealth(player) {
    if (!player || !player.position) return;
    
    try {
      // Create a graphics object for the health bar
      const graphics = new PIXI.Graphics();
      
      // Health bar background
      graphics.beginFill(0x000000, 0.5);
      graphics.drawRect(
        player.position.x - 20,
        player.position.y - CONFIG.PLAYER_SIZE/2 - 20,
        40,
        5
      );
      graphics.endFill();
      
      // Calculate health percentage
      const healthPercent = player.health / (player.maxHealth || 100);
      
      // Determine color based on health
      let color = 0x00FF00; // Green for healthy
      
      if (healthPercent < 0.3) {
        color = 0xFF0000; // Red for low health
      } else if (healthPercent < 0.6) {
        color = 0xFFFF00; // Yellow for medium health
      }
      
      // Health bar foreground
      graphics.beginFill(color);
      graphics.drawRect(
        player.position.x - 20,
        player.position.y - CONFIG.PLAYER_SIZE/2 - 20,
        40 * healthPercent,
        5
      );
      graphics.endFill();
      
      // Add to entity layer
      this.renderer.entityLayer.addChild(graphics);
      
    } catch (error) {
      console.error("Error rendering player health:", error);
    }
  }
  
  /**
   * Render monster health bar
   * @param {Object} monster - The monster to render health for
   */
  renderMonsterHealth(monster) {
    // Similar to player health rendering but for monsters
    if (!monster || !monster.position) return;
    
    try {
      // Only show health if monster is damaged
      if (monster.health >= monster.maxHealth) return;
      
      // Create a graphics object for the health bar
      const graphics = new PIXI.Graphics();
      
      // Health bar background
      graphics.beginFill(0x000000, 0.5);
      graphics.drawRect(
        monster.position.x - 15,
        monster.position.y - CONFIG.MONSTER_SIZE/2 - 10,
        30,
        3
      );
      graphics.endFill();
      
      // Calculate health percentage
      const healthPercent = monster.health / (monster.maxHealth || 100);
      
      // Health bar foreground
      graphics.beginFill(0xFF0000);
      graphics.drawRect(
        monster.position.x - 15,
        monster.position.y - CONFIG.MONSTER_SIZE/2 - 10,
        30 * healthPercent,
        3
      );
      graphics.endFill();
      
      // Add to entity layer
      this.renderer.entityLayer.addChild(graphics);
      
    } catch (error) {
      console.error("Error rendering monster health:", error);
    }
  }
  
  /**
   * Render boss name and health
   * @param {Object} boss - The boss to render health for
   */
  renderBossHealth(boss) {
    if (!boss || !boss.position) return;
    
    try {
      // Create boss name text
      const nameText = new PIXI.Text(boss.name || "Boss", {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xFF0000,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 4
      });
      
      nameText.anchor.set(0.5, 1);
      nameText.position.set(
        boss.position.x,
        boss.position.y - CONFIG.MONSTER_SIZE - 15
      );
      
      // Create health bar graphics
      const graphics = new PIXI.Graphics();
      
      // Health bar background
      graphics.beginFill(0x000000, 0.7);
      graphics.drawRect(
        boss.position.x - 40,
        boss.position.y - CONFIG.MONSTER_SIZE - 10,
        80,
        8
      );
      graphics.endFill();
      
      // Calculate health percentage
      const healthPercent = boss.health / (boss.maxHealth || 1000);
      
      // Health bar foreground
      graphics.beginFill(0xFF0000);
      graphics.drawRect(
        boss.position.x - 40,
        boss.position.y - CONFIG.MONSTER_SIZE - 10,
        80 * healthPercent,
        8
      );
      graphics.endFill();
      
      // Add to entity layer
      this.renderer.entityLayer.addChild(nameText);
      this.renderer.entityLayer.addChild(graphics);
      
    } catch (error) {
      console.error("Error rendering boss health:", error);
    }
  }
  
  /**
   * Render all projectiles
   */
  renderProjectiles() {
    if (!this.renderer.app || !this.renderer.game) return;
    
    try {
      // Clear projectile layer to prevent duplicates
      this.renderer.projectileLayer.removeChildren();
      
      // Render player projectiles
      if (this.renderer.game.player && this.renderer.game.player.projectiles) {
        this.renderer.game.player.projectiles.forEach(projectile => {
          this.renderProjectile(projectile);
        });
      }
      
      // Render other players' projectiles
      this.renderer.game.players.forEach(player => {
        if (player !== this.renderer.game.player && player.projectiles) {
          player.projectiles.forEach(projectile => {
            this.renderProjectile(projectile);
          });
        }
      });
      
      // Render monster projectiles
      this.renderer.game.monsters.forEach(monster => {
        if (monster.projectiles) {
          monster.projectiles.forEach(projectile => {
            this.renderProjectile(projectile);
          });
        }
      });
      
      // Render boss projectiles
      this.renderer.game.bosses.forEach(boss => {
        if (boss.projectiles) {
          boss.projectiles.forEach(projectile => {
            this.renderProjectile(projectile);
          });
        }
      });
      
    } catch (error) {
      console.error("Error rendering projectiles:", error);
    }
  }
  
  /**
   * Render a single projectile
   * @param {Object} projectile - The projectile to render
   */
  renderProjectile(projectile) {
    // Skip if projectile is invalid
    if (!projectile || !projectile.position || !projectile.active) return;
    
    try {
      // Get or create sprite
      let sprite = this._projectileSpriteCache.get(projectile.id);
      
      if (!sprite) {
        // Determine texture based on projectile type
        let texture;
        
        if (projectile.type === 'fireball') {
          texture = this.renderer.textureManager.textures.projectile.fireball;
        } else if (projectile.type === 'arrow') {
          texture = this.renderer.textureManager.textures.projectile.arrow;
        } else if (projectile.type === 'slash') {
          texture = this.renderer.textureManager.textures.projectile.slash;
        } else {
          // Default texture
          texture = this.renderer.textureManager.textures.projectile.default;
        }
        
        // Create sprite
        sprite = new PIXI.Sprite(texture);
        this._projectileSpriteCache.set(projectile.id, sprite);
        
        // Configure sprite
        sprite.anchor.set(0.5, 0.5);
        sprite.width = projectile.width || 10;
        sprite.height = projectile.height || 10;
      }
      
      // Update position
      sprite.position.set(projectile.position.x, projectile.position.y);
      
      // Update rotation based on velocity
      if (projectile.velocity) {
        sprite.rotation = Math.atan2(projectile.velocity.y, projectile.velocity.x);
      }
      
      // Add to projectile layer
      this.renderer.projectileLayer.addChild(sprite);
      
    } catch (error) {
      console.error("Error rendering projectile:", error);
    }
  }
  
  /**
   * Clean up resources when renderer is destroyed
   */
  destroy() {
    // Clear sprite caches
    this._playerSpriteCache.forEach(sprite => sprite.destroy());
    this._monsterSpriteCache.forEach(sprite => sprite.destroy());
    this._bossSpriteCache.forEach(sprite => sprite.destroy());
    this._itemSpriteCache.forEach(sprite => sprite.destroy());
    this._projectileSpriteCache.forEach(sprite => sprite.destroy());
    
    // Clear text caches
    this._playerTextCache.forEach(text => text.destroy());
    this._monsterTextCache.forEach(text => text.destroy());
    
    // Clear cache maps
    this._playerSpriteCache.clear();
    this._monsterSpriteCache.clear();
    this._bossSpriteCache.clear();
    this._itemSpriteCache.clear();
    this._projectileSpriteCache.clear();
    this._playerTextCache.clear();
    this._monsterTextCache.clear();
    
    console.log("EntityRenderer destroyed");
  }
} 