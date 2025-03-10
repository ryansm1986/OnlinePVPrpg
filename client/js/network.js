/**
 * Network class
 * Handles communication with the server
 */
class Network {
  /**
   * Create a new Network instance
   * @param {Game} game - Reference to the game
   */
  constructor(game) {
    this.game = game;
    this.socket = null;
    this.connected = false;
    this.events = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseReconnectDelay = 1000; // Start with 1 second delay
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);
    this.reconnect = this.reconnect.bind(this);
  }
  
  /**
   * Initialize the network
   */
  init() {
    this.reconnectAttempts = 0;
    this.connect();
  }
  
  /**
   * Connect to the server
   */
  connect() {
    try {
      // Create socket connection
      this.socket = io(CONFIG.SERVER_URL);
      
      // Set up connection events
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Notify game of successful connection
        if (this.events['connected']) {
          this.events['connected']();
        }
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
        
        // Attempt to reconnect
        this.reconnect();
        
        // Notify game of disconnection
        if (this.events['disconnected']) {
          this.events['disconnected']();
        }
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connected = false;
        
        // Attempt to reconnect
        this.reconnect();
      });
      
      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      // Set up game events
      this.setupEvents();
    } catch (error) {
      console.error('Error creating socket connection:', error);
      this.reconnect();
    }
  }
  
  /**
   * Attempt to reconnect with exponential backoff
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (this.events['connectionFailed']) {
        this.events['connectionFailed']();
      }
      return;
    }
    
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
  
  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEvents() {
    // Game state update
    this.socket.on('gameState', (data) => {
      if (this.events['gameState']) {
        this.events['gameState'](data);
      }
    });
    
    // Player joined
    this.socket.on('playerJoined', (data) => {
      if (this.events['playerJoined']) {
        this.events['playerJoined'](data);
      }
    });
    
    // Player left
    this.socket.on('playerLeft', (data) => {
      if (this.events['playerLeft']) {
        this.events['playerLeft'](data);
      }
    });
    
    // Combat event
    this.socket.on('combatEvent', (data) => {
      if (this.events['combatEvent']) {
        this.events['combatEvent'](data);
      }
    });
    
    // Item pickup
    this.socket.on('itemPickup', (data) => {
      if (this.events['itemPickup']) {
        this.events['itemPickup'](data);
      }
    });
    
    // Player death
    this.socket.on('youDied', (data) => {
      if (this.events['youDied']) {
        this.events['youDied'](data);
      }
    });
    
    // Boss spawn
    this.socket.on('bossSpawn', (data) => {
      if (this.events['bossSpawn']) {
        this.events['bossSpawn'](data);
      }
    });
    
    // Boss kill
    this.socket.on('bossKill', (data) => {
      if (this.events['bossKill']) {
        this.events['bossKill'](data);
      }
    });
    
    // World data
    this.socket.on('worldData', (data) => {
      if (this.events['worldData']) {
        this.events['worldData'](data);
      }
    });
    
    // Game joined
    this.socket.on('gameJoined', (data) => {
      if (this.events['gameJoined']) {
        this.events['gameJoined'](data);
      }
    });
    
    // Error
    this.socket.on('error', (data) => {
      console.error('Game error:', data.message);
      if (this.events['error']) {
        this.events['error'](data);
      }
    });
    
    // Projectile created
    this.socket.on('projectileCreated', (data) => {
      if (this.events['projectileCreated']) {
        this.events['projectileCreated'](data);
      }
    });
    
    // Effect event
    this.socket.on('effectEvent', (data) => {
      if (this.events['effectEvent']) {
        this.events['effectEvent'](data);
      }
    });
  }
  
  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    this.events[event] = callback;
  }
  
  /**
   * Send an event to the server
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.connected && this.socket) {
      this.socket.emit(event, data);
    }
  }
  
  /**
   * Join the game
   * @param {string} playerName - The player's name
   * @param {string} characterClass - The character class
   * @returns {Promise} Resolves when successfully joined, rejects on failure
   */
  joinGame(playerName, characterClass) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        console.error("Cannot join game: not connected to server");
        // Show a user-friendly error message
        reject(new Error("Cannot connect to game server. Please try again later."));
        return;
      }
      
      if (!playerName || !characterClass) {
        console.error("Cannot join game: missing player name or character class");
        reject(new Error("Missing player name or character class"));
        return;
      }
      
      console.log(`Joining game as ${playerName} (${characterClass})`);
      
      try {
        // Set up a one-time event listener for the join response
        this.socket.once('gameJoined', (data) => {
          console.log("Successfully joined game");
          resolve(data);
        });
        
        this.socket.once('joinError', (error) => {
          console.error("Error joining game:", error);
          reject(new Error(error.message || "Failed to join game"));
        });
        
        // Send join request
        this.emit('joinGame', {
          name: playerName,
          characterClass: characterClass
        });
        
        console.log("Join request sent to server");
      } catch (error) {
        console.error("Error joining game:", error);
        reject(new Error("An error occurred while joining the game"));
      }
    });
  }
  
  /**
   * Request world data from the server
   */
  requestWorldData() {
    this.emit('requestWorldData');
  }
  
  /**
   * Send player input to the server
   * @param {Object} inputData - Input data
   */
  sendInput(inputData) {
    this.emit('playerInput', inputData);
  }
  
  /**
   * Send movement input to the server
   * @param {number} directionX - X direction (-1, 0, 1)
   * @param {number} directionY - Y direction (-1, 0, 1)
   * @param {string} facingDirection - Direction the player is facing
   */
  sendMovementInput(directionX, directionY, facingDirection) {
    this.sendInput({
      type: 'movement',
      directionX: directionX,
      directionY: directionY,
      facingDirection: facingDirection
    });
  }
  
  /**
   * Send attack input to the server
   */
  sendAttackInput() {
    this.sendInput({
      type: 'attack'
    });
  }
  
  /**
   * Send skill input to the server
   * @param {number} skillId - Skill ID
   * @param {Object} targetPosition - Target position (for targeted skills)
   */
  sendSkillInput(skillId, targetPosition = null) {
    const data = {
      type: 'skill',
      skillId: skillId
    };
    
    if (targetPosition) {
      data.targetX = targetPosition.x;
      data.targetY = targetPosition.y;
    }
    
    this.sendInput(data);
  }
  
  /**
   * Send item interaction to the server
   * @param {string} action - Action (equip, unequip, drop, use)
   * @param {string} itemId - Item ID
   * @param {string} slot - Equipment slot (for equip)
   */
  sendItemInteraction(action, itemId, slot = null) {
    const data = {
      type: 'item',
      action: action,
      itemId: itemId
    };
    
    if (slot) {
      data.slot = slot;
    }
    
    this.sendInput(data);
  }
  
  /**
   * Send exit interaction to the server
   * @param {string} exitId - Exit ID
   */
  sendExitInteraction(exitId) {
    this.sendInput({
      type: 'exit',
      exitId: exitId
    });
  }
} 