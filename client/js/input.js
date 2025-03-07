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
    this.movementThrottle = 100; // ms
    
    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
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
    
    // Store key state
    this.keys[event.key.toLowerCase()] = true;
    
    // Handle special keys
    switch (event.key.toLowerCase()) {
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
          const skillId = parseInt(event.key);
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
    
    // Check if this was a movement key
    const key = event.key.toLowerCase();
    const wasMovementKey = (key === 'w' || key === 's' || key === 'a' || key === 'd' || 
                           key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright');
    
    // Get old movement direction for comparison
    const oldDirX = this.movementDirection.x;
    const oldDirY = this.movementDirection.y;
    
    // Update key state
    this.keys[key] = false;
    
    // Update movement direction
    this.updateMovementDirection();
    
    // If movement changed to zero, immediately send stop command
    if (wasMovementKey && 
        (oldDirX !== 0 || oldDirY !== 0) && 
        (this.movementDirection.x === 0 && this.movementDirection.y === 0)) {
      // Force immediate stop command
      this.lastMovementTime = 0; // Reset throttle
      this.game.network.sendMovementInput(0, 0);
    }
  }
  
  /**
   * Handle mouse move event
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    // Update mouse position
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
    
    // Update world position if renderer exists
    if (this.game.renderer) {
      this.mouseWorldPosition = this.game.renderer.screenToWorld(this.mousePosition.x, this.mousePosition.y);
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
    
    // WASD movement
    if (this.keys['w'] || this.keys['arrowup']) {
      dirY = -1;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      dirY = 1;
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      dirX = -1;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      dirX = 1;
    }
    
    // Update movement direction
    this.movementDirection.x = dirX;
    this.movementDirection.y = dirY;
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
      
      // Send movement input to server (always send, even if zero - ensures consistent stops)
      this.game.network.sendMovementInput(this.movementDirection.x, this.movementDirection.y);
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