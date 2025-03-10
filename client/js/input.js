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
    // Check for directional keys
    for (const direction in this.directionKeys) {
      if (this.directionKeys[direction].key.includes(key)) {
        this.directionKeys[direction].pressed = true;
        this.directionKeys[direction].lastPressed = now;
        this.lastDirection = direction;
        
        // Also update the player's facing direction immediately
        if (this.game && this.game.player) {
          this.game.player.facingDirection = direction;
        }
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
    
    // If we're moving, ensure player's facing direction matches movement
    if (this.game && this.game.player) {
      // Always maintain the correct facing direction, even when stopped
      this.game.player.facingDirection = this.lastDirection;
      
      // If we're actually moving, update the facing direction based on movement
      if (dirX !== 0 || dirY !== 0) {
        // Determine direction based on dominant axis
        if (Math.abs(dirX) > Math.abs(dirY)) {
          // Horizontal movement is dominant
          this.lastDirection = dirX > 0 ? 'right' : 'left';
        } else {
          // Vertical movement is dominant (or equal)
          this.lastDirection = dirY > 0 ? 'down' : 'up';
        }
        
        // Update player's facing direction
        this.game.player.facingDirection = this.lastDirection;
      }
    }
    
    // If movement changed to zero, immediately send stop command
    if (dirX === 0 && dirY === 0 && 
        (this.game && this.game.network && this.game.player)) {
      this.game.network.sendMovementInput(0, 0);
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
    
    // Send movement input if direction changed or throttle time passed
    const now = Date.now();
    if (now - this.lastMovementTime >= this.movementThrottle) {
      this.lastMovementTime = now;
      
      // Send movement input to server
      this.game.network.sendMovementInput(this.movementDirection.x, this.movementDirection.y);
      
      // Also update the facing direction based on our tracking system
      if (this.game.player) {
        this.game.player.facingDirection = this.lastDirection;
      }
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