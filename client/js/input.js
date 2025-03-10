/**
 * Input class
 * Handles user input (keyboard, mouse)
 */
class Input {
  /**
   * Create a new Input instance
   * @param {Game} game - Reference to the game
   */
  constructor(game) {
    this.game = game;
    
    // Input state
    this.keys = {};
    this.mousePosition = { x: 0, y: 0 };
    this.mouseWorldPosition = { x: 0, y: 0 };
    this.mouseDown = false;
    
    // Movement direction
    this.movementDirection = { x: 0, y: 0 };
    
    // Last input time for throttling
    this.lastMovementTime = 0;
    this.movementThrottle = 50; // ms
    
    // Directional key tracking
    this.directionKeys = {
      up: { key: ['w', 'arrowup'], pressed: false, lastPressed: 0 },
      down: { key: ['s', 'arrowdown'], pressed: false, lastPressed: 0 },
      left: { key: ['a', 'arrowleft'], pressed: false, lastPressed: 0 },
      right: { key: ['d', 'arrowright'], pressed: false, lastPressed: 0 }
    };
    this.lastDirection = 'down'; // Default facing direction
    
    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.updateMovementDirection = this.updateMovementDirection.bind(this);
    this.processInput = this.processInput.bind(this);
  }
  
  /**
   * Initialize input handlers
   */
  init() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Mouse events
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('contextmenu', this.handleContextMenu);
    
    // Set up input processing interval
    setInterval(() => this.processInput(), 16); // ~60fps
  }
  
  /**
   * Handle key down event
   * @param {KeyboardEvent} event - Key event
   */
  handleKeyDown(event) {
    // Safety check to ensure event.key exists
    if (!event || event.key === undefined) return;
    
    const key = event.key.toLowerCase();
    
    // Store key state
    this.keys[key] = true;
    
    // Track direction keys with timestamp
    const now = Date.now();
    
    // Old direction for comparison
    const oldDirection = this.lastDirection;
    
    // Check for directional keys
    for (const direction in this.directionKeys) {
      if (this.directionKeys[direction].key.includes(key)) {
        this.directionKeys[direction].pressed = true;
        this.directionKeys[direction].lastPressed = now;
        
        // CRITICAL FIX: If the key corresponds directly to a direction, use it immediately
        if (['up', 'down', 'left', 'right'].includes(direction)) {
          this.lastDirection = direction;
        }
      }
    }
    
    // Log the direction change if it changed
    if (oldDirection !== this.lastDirection && CONFIG.SPRITE_SHEET_DEBUG) {
      console.log(`[KEY DOWN] Direction changed from "${oldDirection}" to "${this.lastDirection}"`);
    }
    
    // CRITICAL FIX: Immediately update the player's facing direction
    if (this.game && this.game.player && oldDirection !== this.lastDirection) {
      this.game.player.facingDirection = this.lastDirection;
      
      if (CONFIG.SPRITE_SHEET_DEBUG) {
        console.log(`[KEY DOWN] Set player.facingDirection to "${this.lastDirection}"`);
      }
    }
    
    // Handle special keys
    switch (key) {
      case 'i':
        // Toggle inventory
        if (!this.game.isPaused && this.game.gameStarted) {
          this.game.toggleInventory();
        }
        break;
        
      case 'escape':
        // Toggle pause
        if (this.game.gameStarted) {
          this.game.togglePause();
        }
        break;
        
      case '1':
      case '2':
      case '3':
      case '4':
        // Use skill
        if (!this.game.isPaused && this.game.gameStarted && this.game.player) {
          const skillId = parseInt(key);
          this.game.network.sendSkillInput(skillId, this.mouseWorldPosition);
        }
        break;
    }
    
    // Update movement direction
    this.updateMovementDirection();
  }
  
  /**
   * Handle key up event
   * @param {KeyboardEvent} event - Key event
   */
  handleKeyUp(event) {
    // Safety check to ensure event.key exists
    if (!event || event.key === undefined) return;
    
    const key = event.key.toLowerCase();
    
    // Update key state
    this.keys[key] = false;
    
    // Update direction key state
    for (const direction in this.directionKeys) {
      if (this.directionKeys[direction].key.includes(key)) {
        this.directionKeys[direction].pressed = false;
      }
    }
    
    // Find the most recently pressed direction that's still active
    let latestDirection = null;
    let latestTime = 0;
    
    for (const direction in this.directionKeys) {
      if (this.directionKeys[direction].pressed && 
          this.directionKeys[direction].lastPressed > latestTime) {
        latestTime = this.directionKeys[direction].lastPressed;
        latestDirection = direction;
      }
    }
    
    // Update last direction if we found an active key
    if (latestDirection) {
      this.lastDirection = latestDirection;
      
      // Update player's facing direction
      if (this.game && this.game.player) {
        this.game.player.facingDirection = latestDirection;
      }
    }
    
    // Update movement direction
    this.updateMovementDirection();
  }
  
  /**
   * Handle mouse move event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    // Update mouse position
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
    
    // Update world position if renderer exists and has the screenToWorld method
    if (this.game.renderer) {
      try {
        if (typeof this.game.renderer.screenToWorld === 'function') {
          this.mouseWorldPosition = this.game.renderer.screenToWorld(this.mousePosition.x, this.mousePosition.y);
        } else {
          // Fallback if screenToWorld isn't available yet
          console.warn("screenToWorld method not available on renderer - using fallback");
          
          // Simple fallback conversion (assumes camera at center with no zoom)
          const centerX = CONFIG.GAME_WIDTH / 2;
          const centerY = CONFIG.GAME_HEIGHT / 2;
          
          // Convert screen to world using the player position as reference
          if (this.game.player) {
            this.mouseWorldPosition = {
              x: this.game.player.position.x + (this.mousePosition.x - centerX),
              y: this.game.player.position.y + (this.mousePosition.y - centerY)
            };
          } else {
            // If no player, just use screen coordinates
            this.mouseWorldPosition = { ...this.mousePosition };
          }
        }
      } catch (err) {
        console.error("Error in handleMouseMove:", err);
        // Ensure mouseWorldPosition always has a valid value
        this.mouseWorldPosition = { ...this.mousePosition };
      }
    }
  }
  
  /**
   * Handle mouse down event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    // Set mouse down state
    this.mouseDown = true;
    
    // Handle left click (attack)
    if (event.button === 0) {
      if (!this.game.isPaused && this.game.gameStarted && this.game.player) {
        this.game.network.sendAttackInput();
      }
    }
    
    // Handle right click (toggle inventory)
    if (event.button === 2) {
      if (!this.game.isPaused && this.game.gameStarted) {
        this.game.toggleInventory();
      }
    }
  }
  
  /**
   * Handle mouse up event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    // Clear mouse down state
    this.mouseDown = false;
  }
  
  /**
   * Handle context menu event (prevent right-click menu)
   * @param {MouseEvent} event - Mouse event
   */
  handleContextMenu(event) {
    event.preventDefault();
  }
  
  /**
   * Update movement direction based on key state
   */
  updateMovementDirection() {
    // Reset direction
    let dirX = 0;
    let dirY = 0;
    
    // Check each direction
    if (this.directionKeys.up.pressed) {
      dirY = -1;
    }
    if (this.directionKeys.down.pressed) {
      dirY = 1;
    }
    if (this.directionKeys.left.pressed) {
      dirX = -1;
    }
    if (this.directionKeys.right.pressed) {
      dirX = 1;
    }
    
    // Update movement direction
    this.movementDirection.x = dirX;
    this.movementDirection.y = dirY;
    
    // CRITICAL FIX: Make sure the facing direction is one of the valid values
    const validDirections = ['up', 'down', 'left', 'right'];
    if (!validDirections.includes(this.lastDirection)) {
      this.lastDirection = 'down'; // Default to down if invalid
      console.warn(`[INPUT FIX] Invalid lastDirection: "${this.lastDirection}", forced to "down"`);
    }
    
    // Update direction based on combined key presses (handle diagonal movement)
    if (dirX !== 0 || dirY !== 0) {
      // Determine dominant direction (prioritize the most recent key press when in diagonals)
      let newDirection = this.lastDirection;
      
      // When two keys are pressed, use the most recently pressed one
      // But if only one is pressed, use that one
      const upPressed = this.directionKeys.up.pressed;
      const downPressed = this.directionKeys.down.pressed;
      const leftPressed = this.directionKeys.left.pressed;
      const rightPressed = this.directionKeys.right.pressed;
      
      if ((upPressed || downPressed) && !(leftPressed || rightPressed)) {
        // Only vertical keys are pressed
        newDirection = upPressed ? 'up' : 'down';
      } 
      else if ((leftPressed || rightPressed) && !(upPressed || downPressed)) {
        // Only horizontal keys are pressed
        newDirection = leftPressed ? 'left' : 'right';
      }
      else if (upPressed && leftPressed) {
        // Up+Left: use the most recent
        newDirection = this.directionKeys.up.lastPressed > this.directionKeys.left.lastPressed ? 'up' : 'left';
      }
      else if (upPressed && rightPressed) {
        // Up+Right: use the most recent
        newDirection = this.directionKeys.up.lastPressed > this.directionKeys.right.lastPressed ? 'up' : 'right';
      }
      else if (downPressed && leftPressed) {
        // Down+Left: use the most recent
        newDirection = this.directionKeys.down.lastPressed > this.directionKeys.left.lastPressed ? 'down' : 'left';
      }
      else if (downPressed && rightPressed) {
        // Down+Right: use the most recent
        newDirection = this.directionKeys.down.lastPressed > this.directionKeys.right.lastPressed ? 'down' : 'right';
      }
      
      // Validate the new direction
      if (!validDirections.includes(newDirection)) {
        console.warn(`[INPUT FIX] Invalid newDirection: "${newDirection}", keeping "${this.lastDirection}"`);
      } else {
        this.lastDirection = newDirection;
      }
    }
    
    // If we have a game and player, always update facing direction
    if (this.game && this.game.player) {

      
      // CRITICAL FIX: Always set a valid value
      this.game.player.facingDirection = this.lastDirection;
    }
  }
  
  /**
   * Process input and send to server
   */
  processInput() {
    // Skip if game is not running
    if (!this.game.isRunning || this.game.isPaused || !this.game.gameStarted || !this.game.player) {
      return;
    }
    
    // CRITICAL FIX: Ensure we always have a valid facing direction
    if (!['up', 'down', 'left', 'right'].includes(this.lastDirection)) {
      this.lastDirection = 'down'; // Default to down if invalid
      
      if (CONFIG.SPRITE_SHEET_DEBUG) {
        console.warn(`[PROCESS INPUT] Invalid lastDirection, forced to "down"`);
      }
    }
    
    // Send movement input if direction changed or throttle time passed
    const now = Date.now();
    if (now - this.lastMovementTime >= this.movementThrottle) {
      this.lastMovementTime = now;
      
      // CRITICAL FIX: Make sure player has the correct facing direction before sending to server
      if (this.game.player) {
        this.game.player.facingDirection = this.lastDirection;
      }
      
      // Send movement input to server with facing direction
      this.game.network.sendMovementInput(
        this.movementDirection.x, 
        this.movementDirection.y,
        this.lastDirection  // Always send the current direction
      );
      

    }
    
    // Auto-attack if mouse is held down
    if (this.mouseDown) {
      // Only send if player is not already attacking
      if (!this.game.player.isAttacking) {
        this.game.network.sendAttackInput();
      }
    }
  }
  
  /**
   * Check if a key is pressed
   * @param {string} key - Key to check
   * @returns {boolean} True if key is pressed
   */
  isKeyPressed(key) {
    return this.keys[key.toLowerCase()] === true;
  }
  
  /**
   * Get current movement direction
   * @returns {Object} Movement direction {x, y}
   */
  getMovementDirection() {
    return { ...this.movementDirection };
  }
  
  /**
   * Get mouse position
   * @returns {Object} Mouse position {x, y}
   */
  getMousePosition() {
    return { ...this.mousePosition };
  }
  
  /**
   * Get mouse world position
   * @returns {Object} Mouse world position {x, y}
   */
  getMouseWorldPosition() {
    return { ...this.mouseWorldPosition };
  }
  
  /**
   * Check if mouse is down
   * @returns {boolean} True if mouse is down
   */
  isMouseDown() {
    return this.mouseDown;
  }
} 