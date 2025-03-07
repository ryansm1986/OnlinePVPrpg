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
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);
  }
  
  /**
   * Initialize the network
   */
  init() {
    this.connect();
  }
  
  /**
   * Connect to the server
   */
  connect() {
    // Create socket connection
    this.socket = io(CONFIG.SERVER_URL);
    
    // Set up connection events
    this.socket.on('connect', () => {
      this.connected = true;
    });
    
    this.socket.on('disconnect', () => {
      this.connected = false;
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Set up game events
    this.setupEvents();
  }
  
  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
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
   * @param {string} playerName - Player name
   * @param {string} characterClass - Character class
   */
  joinGame(playerName, characterClass) {
    this.emit('joinGame', {
      name: playerName,
      characterClass: characterClass
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
   */
  sendMovementInput(directionX, directionY) {
    this.sendInput({
      type: 'movement',
      directionX: directionX,
      directionY: directionY
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