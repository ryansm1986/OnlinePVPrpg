/**
 * UI class
 * Handles user interface elements
 */
class UI {
  /**
   * Create a new UI instance
   * @param {Game} game - Reference to the game
   */
  constructor(game) {
    this.game = game;
    
    // UI elements
    this.healthBar = null;
    this.healthText = null;
    this.xpBar = null;
    this.xpText = null;
    this.skillCooldowns = {};
    this.inventorySlots = [];
    this.equipmentSlots = {};
    this.notificationContainer = null;
    this.notifications = [];
    this.maxNotifications = 5;
    this.notificationDuration = 3000;
    this.loadingOverlay = null;
    this.errorOverlay = null;
    
    // Bind methods - only bind methods that are defined in the class
    this.updatePlayerStats = this.updatePlayerStats.bind(this);
    this.updateInventory = this.updateInventory.bind(this);
    this.showNotification = this.showNotification.bind(this);
    
    // Define the missing methods to prevent errors
  }
  
  /**
   * Initialize UI
   */
  init() {
    try {
      console.log("Initializing UI elements...");
      
      // Get UI elements safely
      this.healthBar = document.querySelector('.health-fill');
      this.healthText = document.querySelector('.health-text');
      this.xpBar = document.querySelector('.xp-fill');
      this.xpText = document.querySelector('.xp-text');
      
      // Get skill cooldown elements
      const skillElements = document.querySelectorAll('.skill');
      skillElements.forEach(element => {
        const skillId = parseInt(element.getAttribute('data-skill'));
        this.skillCooldowns[skillId] = element.querySelector('.cooldown-overlay');
      });
      
      // Get game container safely
      const gameContainer = document.getElementById('game-container');
      if (!gameContainer) {
        console.warn("Game container not found, creating fallback container");
        // Create a fallback container if needed
        const fallbackContainer = document.createElement('div');
        fallbackContainer.id = 'game-container';
        document.body.appendChild(fallbackContainer);
      }
      
      // Create notification container
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.className = 'notification-container';
      this.notificationContainer.style.position = 'absolute';
      this.notificationContainer.style.top = '20px';
      this.notificationContainer.style.right = '20px';
      this.notificationContainer.style.width = '300px';
      this.notificationContainer.style.zIndex = '100';
      
      // Safely append to game container
      const containerTarget = document.getElementById('game-container') || document.body;
      containerTarget.appendChild(this.notificationContainer);
      
      // Create loading overlay
      this.loadingOverlay = document.createElement('div');
      this.loadingOverlay.className = 'loading-overlay hidden';
      this.loadingOverlay.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-message">Loading...</div>
        </div>
      `;
      document.body.appendChild(this.loadingOverlay);
      
      // Create error overlay
      this.errorOverlay = document.createElement('div');
      this.errorOverlay.className = 'error-overlay hidden';
      this.errorOverlay.innerHTML = `
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <div class="error-message"></div>
          <button class="error-close">OK</button>
        </div>
      `;
      document.body.appendChild(this.errorOverlay);
      
      // Add click handler to close error overlay
      const closeButton = this.errorOverlay.querySelector('.error-close');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.errorOverlay.classList.add('hidden');
        });
      }
      
      // Bind methods that weren't bound in constructor
      this.removeNotification = this.removeNotification.bind(this);
      this.showLoading = this.showLoading.bind(this);
      this.hideLoading = this.hideLoading.bind(this);
      this.showError = this.showError.bind(this);
      
      // Set up inventory
      this.setupInventory();
      
      // Set up equipment slots
      this.setupEquipmentSlots();
      
      console.log("UI initialized successfully");
    } catch (error) {
      console.error("Error initializing UI:", error);
      // Create at least a minimal error display capability
      alert("Error initializing game interface: " + error.message);
    }
  }
  
  /**
   * Set up inventory grid
   */
  setupInventory() {
    const inventoryGrid = document.querySelector('.inventory-grid');
    
    // Create inventory slots
    for (let i = 0; i < 20; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.setAttribute('data-slot', i);
      
      // Add click event
      slot.addEventListener('click', (event) => {
        this.handleInventorySlotClick(event, i);
      });
      
      inventoryGrid.appendChild(slot);
      this.inventorySlots.push(slot);
    }
  }
  
  /**
   * Set up equipment slots
   */
  setupEquipmentSlots() {
    const equipmentSlots = document.querySelectorAll('.equipment-slot');
    
    equipmentSlots.forEach(slot => {
      const slotName = slot.getAttribute('data-slot');
      this.equipmentSlots[slotName] = slot;
      
      // Add click event
      slot.addEventListener('click', (event) => {
        this.handleEquipmentSlotClick(event, slotName);
      });
    });
  }
  
  /**
   * Update player stats display
   * @param {Player} [player] - The player (if not provided, will use game.player)
   */
  updatePlayerStats(player) {
    // Use provided player or get from game
    player = player || this.game.player;
    
    // Check if player exists
    if (!player) {
      console.warn('Cannot update player stats: Player is undefined');
      return;
    }
    
    // Update health bar
    const healthPercent = (player.health / player.maxHealth) * 100;
    this.healthBar.style.width = `${healthPercent}%`;
    this.healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;
    
    // Update XP bar
    const xpPercent = (player.experience / player.experienceToNextLevel) * 100;
    this.xpBar.style.width = `${xpPercent}%`;
    this.xpText.textContent = `Level ${player.level}`;
    
    // Update skill cooldowns
    for (const [skillId, cooldown] of Object.entries(player.skillCooldowns)) {
      const cooldownOverlay = this.skillCooldowns[skillId];
      
      if (cooldownOverlay) {
        if (cooldown > 0) {
          // Calculate cooldown percentage
          const maxCooldown = CONFIG.SKILL_COOLDOWNS[player.characterClass][skillId];
          const cooldownPercent = (cooldown / maxCooldown) * 100;
          
          // Update cooldown overlay
          cooldownOverlay.style.height = `${cooldownPercent}%`;
        } else {
          // Reset cooldown overlay
          cooldownOverlay.style.height = '0%';
        }
      }
    }
  }
  
  /**
   * Update inventory display
   */
  updateInventory() {
    // Skip if no player
    if (!this.game.player) {
      return;
    }
    
    // Clear all slots
    this.inventorySlots.forEach(slot => {
      slot.innerHTML = '';
    });
    
    // Clear all equipment slots
    for (const slot in this.equipmentSlots) {
      this.equipmentSlots[slot].innerHTML = '';
      this.equipmentSlots[slot].appendChild(document.createElement('div')).className = 'slot-label';
      this.equipmentSlots[slot].querySelector('.slot-label').textContent = slot.charAt(0).toUpperCase() + slot.slice(1);
    }
    
    // Add items to inventory slots
    this.game.player.inventory.forEach((item, index) => {
      if (index < this.inventorySlots.length) {
        const slot = this.inventorySlots[index];
        this.createItemElement(item, slot);
      }
    });
    
    // Add items to equipment slots
    for (const [slot, item] of Object.entries(this.game.player.equipment)) {
      if (item && this.equipmentSlots[slot]) {
        this.createItemElement(item, this.equipmentSlots[slot]);
      }
    }
  }
  
  /**
   * Create an item element
   * @param {Object} item - The item
   * @param {HTMLElement} container - The container element
   */
  createItemElement(item, container) {
    // Create item element
    const itemElement = document.createElement('div');
    itemElement.className = 'item';
    itemElement.setAttribute('data-item-id', item.id);
    
    // Set background color based on rarity
    let backgroundColor;
    switch (item.rarity) {
      case 'rare':
        backgroundColor = '#4169E1'; // Royal blue
        break;
      case 'legendary':
        backgroundColor = '#FFD700'; // Gold
        break;
      default:
        backgroundColor = '#FFFFFF'; // White
    }
    
    // Set item style
    itemElement.style.backgroundColor = backgroundColor;
    
    // Add item to container
    container.appendChild(itemElement);
    
    // Add hover event for tooltip
    itemElement.addEventListener('mouseover', (event) => {
      this.showItemTooltip(item, event.clientX, event.clientY);
    });
    
    itemElement.addEventListener('mouseout', () => {
      this.hideItemTooltip();
    });
  }
  
  /**
   * Show item tooltip
   * @param {Object} item - The item
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  showItemTooltip(item, x, y) {
    const tooltip = document.querySelector('.item-tooltip');
    
    // Set tooltip content
    tooltip.innerHTML = `
      <div class="item-name" style="color: ${item.color || '#FFFFFF'}">${item.name}</div>
      <div class="item-type">${item.type}</div>
      <div class="item-stats">
        ${this.formatItemStats(item.stats)}
      </div>
    `;
    
    // Position tooltip
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y + 10}px`;
    
    // Show tooltip
    tooltip.classList.remove('hidden');
  }
  
  /**
   * Hide item tooltip
   */
  hideItemTooltip() {
    const tooltip = document.querySelector('.item-tooltip');
    tooltip.classList.add('hidden');
  }
  
  /**
   * Format item stats for display
   * @param {Object} stats - Item stats
   * @returns {string} Formatted stats HTML
   */
  formatItemStats(stats) {
    if (!stats) return '';
    
    let html = '';
    
    // Add damage stat
    if (stats.damage) {
      html += `<div class="item-stat">Damage: ${stats.damage}</div>`;
    }
    
    // Add defense stat
    if (stats.defense) {
      html += `<div class="item-stat">Defense: ${stats.defense}</div>`;
    }
    
    // Add other stats
    const statNames = {
      strength: 'Strength',
      intelligence: 'Intelligence',
      dexterity: 'Dexterity',
      vitality: 'Vitality',
      health: 'Health',
      speed: 'Speed'
    };
    
    for (const [stat, value] of Object.entries(stats)) {
      if (stat !== 'damage' && stat !== 'defense' && statNames[stat]) {
        html += `<div class="item-stat">${statNames[stat]}: +${value}</div>`;
      }
    }
    
    // Add potion effect
    if (stats.effect === 'healing') {
      html += `<div class="item-stat">Heals ${stats.potency || 20} health</div>`;
    }
    
    return html;
  }
  
  /**
   * Handle inventory slot click
   * @param {Event} event - Click event
   * @param {number} slotIndex - Inventory slot index
   */
  handleInventorySlotClick(event, slotIndex) {
    // Skip if no player
    if (!this.game.player) {
      return;
    }
    
    // Get item in slot
    const item = this.game.player.inventory[slotIndex];
    
    if (item) {
      // Show context menu
      this.showItemContextMenu(item, event.clientX, event.clientY);
    }
  }
  
  /**
   * Handle equipment slot click
   * @param {Event} event - Click event
   * @param {string} slotName - Equipment slot name
   */
  handleEquipmentSlotClick(event, slotName) {
    // Skip if no player
    if (!this.game.player) {
      return;
    }
    
    // Get item in slot
    const item = this.game.player.equipment[slotName];
    
    if (item) {
      // Show context menu
      this.showItemContextMenu(item, event.clientX, event.clientY, true);
    }
  }
  
  /**
   * Show item context menu
   * @param {Object} item - The item
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {boolean} isEquipped - Whether the item is equipped
   */
  showItemContextMenu(item, x, y, isEquipped = false) {
    // Remove existing context menu
    this.hideItemContextMenu();
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'item-context-menu';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    contextMenu.style.border = '1px solid #444';
    contextMenu.style.borderRadius = '5px';
    contextMenu.style.padding = '5px';
    contextMenu.style.zIndex = '200';
    
    // Add actions
    if (isEquipped) {
      // Unequip action
      const unequipAction = document.createElement('div');
      unequipAction.textContent = 'Unequip';
      unequipAction.style.padding = '5px 10px';
      unequipAction.style.cursor = 'pointer';
      unequipAction.addEventListener('click', () => {
        // Send unequip action to server
        this.game.network.sendItemInteraction('unequip', item.id);
        this.hideItemContextMenu();
      });
      contextMenu.appendChild(unequipAction);
    } else {
      // Equip action (if equippable)
      if (item.type !== 'potion') {
        const equipAction = document.createElement('div');
        equipAction.textContent = 'Equip';
        equipAction.style.padding = '5px 10px';
        equipAction.style.cursor = 'pointer';
        equipAction.addEventListener('click', () => {
          // Determine slot based on item type
          let slot;
          switch (item.type) {
            case 'weapon':
              slot = 'weapon';
              break;
            case 'helmet':
              slot = 'head';
              break;
            case 'chest':
              slot = 'body';
              break;
            case 'legs':
              slot = 'legs';
              break;
            case 'boots':
              slot = 'feet';
              break;
            case 'gloves':
              slot = 'hands';
              break;
            case 'ring':
              // Check if ring1 is empty, otherwise use ring2
              slot = this.game.player.equipment.ring1 ? 'ring2' : 'ring1';
              break;
            case 'amulet':
              slot = 'amulet';
              break;
          }
          
          // Send equip action to server
          if (slot) {
            this.game.network.sendItemInteraction('equip', item.id, slot);
          }
          
          this.hideItemContextMenu();
        });
        contextMenu.appendChild(equipAction);
      }
      
      // Use action (for potions)
      if (item.type === 'potion') {
        const useAction = document.createElement('div');
        useAction.textContent = 'Use';
        useAction.style.padding = '5px 10px';
        useAction.style.cursor = 'pointer';
        useAction.addEventListener('click', () => {
          // Send use action to server
          this.game.network.sendItemInteraction('use', item.id);
          this.hideItemContextMenu();
        });
        contextMenu.appendChild(useAction);
      }
      
      // Drop action
      const dropAction = document.createElement('div');
      dropAction.textContent = 'Drop';
      dropAction.style.padding = '5px 10px';
      dropAction.style.cursor = 'pointer';
      dropAction.addEventListener('click', () => {
        // Send drop action to server
        this.game.network.sendItemInteraction('drop', item.id);
        this.hideItemContextMenu();
      });
      contextMenu.appendChild(dropAction);
    }
    
    // Add to document
    document.body.appendChild(contextMenu);
    
    // Add click outside listener
    setTimeout(() => {
      window.addEventListener('click', this.hideItemContextMenu);
    }, 0);
  }
  
  /**
   * Hide item context menu
   */
  hideItemContextMenu() {
    // Remove existing context menu
    const contextMenu = document.querySelector('.item-context-menu');
    if (contextMenu) {
      contextMenu.remove();
    }
    
    // Remove click outside listener
    window.removeEventListener('click', this.hideItemContextMenu);
  }
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (default, boss, boss-kill)
   */
  showNotification(message, type = 'default') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Set notification style
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = '#FFFFFF';
    notification.style.padding = '10px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '5px';
    notification.style.transition = 'opacity 0.5s';
    
    // Set type-specific styles
    if (type === 'boss') {
      notification.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
      notification.style.fontWeight = 'bold';
    } else if (type === 'boss-kill') {
      notification.style.backgroundColor = 'rgba(255, 215, 0, 0.7)';
      notification.style.color = '#000000';
      notification.style.fontWeight = 'bold';
    }
    
    // Add to notification container
    this.notificationContainer.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      
      // Remove from DOM after fade out
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000);
  }
  
  /**
   * Show pause menu
   */
  showPauseMenu() {
    // Create pause menu if it doesn't exist
    let pauseMenu = document.getElementById('pause-menu');
    
    if (!pauseMenu) {
      pauseMenu = document.createElement('div');
      pauseMenu.id = 'pause-menu';
      pauseMenu.style.position = 'absolute';
      pauseMenu.style.top = '0';
      pauseMenu.style.left = '0';
      pauseMenu.style.width = '100%';
      pauseMenu.style.height = '100%';
      pauseMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      pauseMenu.style.display = 'flex';
      pauseMenu.style.flexDirection = 'column';
      pauseMenu.style.justifyContent = 'center';
      pauseMenu.style.alignItems = 'center';
      pauseMenu.style.zIndex = '100';
      
      // Add title
      const title = document.createElement('h1');
      title.textContent = 'Game Paused';
      title.style.color = '#FFFFFF';
      title.style.marginBottom = '2rem';
      pauseMenu.appendChild(title);
      
      // Create button container for layout
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.gap = '1rem';
      buttonContainer.style.minWidth = '200px';
      
      // Add resume button
      const resumeButton = document.createElement('button');
      resumeButton.textContent = 'Resume';
      resumeButton.style.padding = '1rem 2rem';
      resumeButton.style.fontSize = '1.2rem';
      resumeButton.style.backgroundColor = '#4a90e2';
      resumeButton.style.color = 'white';
      resumeButton.style.border = 'none';
      resumeButton.style.borderRadius = '4px';
      resumeButton.style.cursor = 'pointer';
      resumeButton.addEventListener('click', () => {
        this.game.togglePause();
      });
      buttonContainer.appendChild(resumeButton);
      
      // Add restart button
      const restartButton = document.createElement('button');
      restartButton.textContent = 'Restart Game';
      restartButton.style.padding = '1rem 2rem';
      restartButton.style.fontSize = '1.2rem';
      restartButton.style.backgroundColor = '#e67e22'; // Orange
      restartButton.style.color = 'white';
      restartButton.style.border = 'none';
      restartButton.style.borderRadius = '4px';
      restartButton.style.cursor = 'pointer';
      restartButton.addEventListener('click', () => {
        // Show confirmation dialog
        const confirmRestart = confirm('Are you sure you want to restart the game? All progress will be lost.');
        if (confirmRestart) {
          this.restartGame();
        }
      });
      buttonContainer.appendChild(restartButton);
      
      pauseMenu.appendChild(buttonContainer);
      
      // Add to game container
      document.getElementById('game-container').appendChild(pauseMenu);
    } else {
      pauseMenu.style.display = 'flex';
    }
  }
  
  /**
   * Restart the game
   */
  restartGame() {
    // Hide the pause menu
    this.hidePauseMenu();
    
    // Clean up existing game state
    if (this.game.network && this.game.network.socket) {
      this.game.network.socket.disconnect();
    }
    
    // Reset game state
    this.game.isRunning = false;
    this.game.isPaused = false;
    this.game.gameStarted = false;
    
    // Clear any existing game objects
    this.game.player = null;
    this.game.players.clear();
    this.game.monsters.clear();
    this.game.bosses.clear();
    this.game.items.clear();
    
    // Reset UI
    document.getElementById('game-ui').classList.add('hidden');
    
    // Show character selection screen again
    document.getElementById('character-select').classList.remove('hidden');
    
    // Reset character selection if needed
    const selectedClass = document.querySelector('.character-option.selected');
    if (selectedClass) {
      selectedClass.classList.remove('selected');
    }
    
    // Reset player name
    const playerNameInput = document.getElementById('player-name');
    if (playerNameInput) {
      playerNameInput.value = '';
    }
    
    // Important: Reconnect to the server
    try {
      // Wait a short time to ensure the previous connection is fully closed
      setTimeout(() => {
        console.log("Reinitializing network connection...");
        if (this.game.network) {
          this.game.network.init(); // Reconnect to the server
        }
      }, 500);
    } catch (error) {
      console.error("Error reconnecting to server:", error);
    }
    
    console.log('Game restarted');
  }
  
  /**
   * Hide pause menu
   */
  hidePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    
    if (pauseMenu) {
      pauseMenu.style.display = 'none';
    }
  }
  
  /**
   * Show a loading overlay with a message
   * @param {string} message - The message to display
   */
  showLoading(message = 'Loading...') {
    if (this.loadingOverlay) {
      const messageElement = this.loadingOverlay.querySelector('.loading-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
      this.loadingOverlay.classList.remove('hidden');
    }
  }
  
  /**
   * Hide the loading overlay
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
    }
  }
  
  /**
   * Show an error message
   * @param {string} message - The error message to display
   */
  showError(message) {
    if (this.errorOverlay) {
      const messageElement = this.errorOverlay.querySelector('.error-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
      this.errorOverlay.classList.remove('hidden');
    } else {
      // Fallback to use the global error overlay if available
      const globalErrorMessage = document.getElementById('error-message');
      const globalErrorOverlay = document.getElementById('error-overlay');
      
      if (globalErrorMessage && globalErrorOverlay) {
        globalErrorMessage.textContent = message;
        globalErrorOverlay.classList.remove('hidden');
      } else {
        // Last resort: alert
        alert('Error: ' + message);
      }
    }
  }
  
  /**
   * Remove a notification
   * @param {HTMLElement} notification - The notification element to remove
   */
  removeNotification(notification) {
    if (this.notificationContainer && notification && notification.parentNode === this.notificationContainer) {
      this.notificationContainer.removeChild(notification);
      
      // Find and remove from the notifications array
      const index = this.notifications.indexOf(notification);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    }
  }
  
  /**
   * Show or hide the loading screen
   * @param {boolean} show - Whether to show or hide the loading screen
   * @param {string} message - Optional message to display
   */
  showLoadingScreen(show, message = 'Loading...') {
    try {
      const loadingScreen = document.getElementById('loading-screen');
      if (!loadingScreen) return;
      
      const loadingText = loadingScreen.querySelector('.loading-text');
      if (loadingText && message) {
        loadingText.textContent = message;
      }
      
      if (show) {
        loadingScreen.classList.remove('hidden');
        console.log("Loading screen displayed:", message);
      } else {
        loadingScreen.classList.add('hidden');
        console.log("Loading screen hidden");
      }
    } catch (error) {
      console.error("Error toggling loading screen:", error);
    }
  }
  
  /**
   * Show or hide the character selection screen
   * @param {boolean} show - Whether to show or hide the character selection
   */
  showCharacterSelect(show) {
    try {
      console.log(`UI: ${show ? 'Displaying' : 'Hiding'} character selection screen...`);
      
      const characterSelect = document.getElementById('character-select');
      if (!characterSelect) {
        console.warn("UI: Character select element not found in DOM");
        
        // Debug info about the document
        console.log("UI: Document state:", {
          body: document.body ? "exists" : "missing",
          readyState: document.readyState,
          elements: document.querySelectorAll('*').length
        });
        
        // Try to find any container that might hold the character select
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
          console.log("UI: Game container found, contents:", gameContainer.innerHTML.substring(0, 200) + "...");
        }
        
        // Force unhide character select by adding it if missing
        if (show && !characterSelect) {
          this.forceShowCharacterSelect();
        }
        return;
      }
      
      // Debug info before changing visibility
      console.log(`UI: Character select before change:`, {
        display: window.getComputedStyle(characterSelect).display,
        visibility: window.getComputedStyle(characterSelect).visibility,
        hasHiddenClass: characterSelect.classList.contains('hidden')
      });
      
      if (show) {
        // Make sure all loading indicators are hidden
        const loadingElements = document.querySelectorAll('#loading-indicator, #loading-screen, .loading-indicator, .loading-screen');
        loadingElements.forEach(el => {
          if (el) {
            el.style.display = 'none';
            el.classList.add('hidden');
            console.log(`UI: Hiding loading element: ${el.id || el.className}`);
          }
        });
        
        // Try multiple ways to make character select visible
        characterSelect.classList.remove('hidden');
        characterSelect.style.display = 'block';
        characterSelect.style.visibility = 'visible';
        
        console.log("UI: Character selection screen displayed");
        
        // Focus the name input field for better UX
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
          setTimeout(() => {
            nameInput.focus();
            console.log("UI: Name input focused");
          }, 100);
        } else {
          console.warn("UI: Name input element not found");
        }
      } else {
        characterSelect.classList.add('hidden');
        characterSelect.style.display = 'none';
        console.log("UI: Character selection screen hidden");
      }
      
      // Debug info after changing visibility
      console.log(`UI: Character select after change:`, {
        display: window.getComputedStyle(characterSelect).display,
        visibility: window.getComputedStyle(characterSelect).visibility,
        hasHiddenClass: characterSelect.classList.contains('hidden')
      });
    } catch (error) {
      console.error("UI: Error toggling character select screen:", error);
    }
  }
  
  /**
   * Forcibly create and show character select screen if it's missing
   * This is a fallback used when there are DOM issues
   */
  forceShowCharacterSelect() {
    try {
      console.log("UI: Attempting to force-create character select...");
      
      const gameContainer = document.getElementById('game-container');
      if (!gameContainer) {
        console.error("UI: Cannot force show character select - no game container");
        return;
      }
      
      // Create a simple character select screen with minimal options
      const characterSelect = document.createElement('div');
      characterSelect.id = 'character-select';
      characterSelect.style.position = 'absolute';
      characterSelect.style.top = '0';
      characterSelect.style.left = '0';
      characterSelect.style.width = '100%';
      characterSelect.style.height = '100%';
      characterSelect.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      characterSelect.style.color = 'white';
      characterSelect.style.display = 'flex';
      characterSelect.style.flexDirection = 'column';
      characterSelect.style.justifyContent = 'center';
      characterSelect.style.alignItems = 'center';
      characterSelect.style.zIndex = '1000';
      characterSelect.style.padding = '20px';
      
      // Add title
      const title = document.createElement('h1');
      title.textContent = 'Choose Your Character';
      title.style.marginBottom = '30px';
      characterSelect.appendChild(title);
      
      // Add character options
      const options = document.createElement('div');
      options.style.display = 'flex';
      options.style.justifyContent = 'center';
      options.style.gap = '20px';
      options.style.marginBottom = '30px';
      options.className = 'character-options';
      
      // Add Warrior, Mage, Ranger options
      ['warrior', 'mage', 'ranger'].forEach(className => {
        const option = document.createElement('div');
        option.className = 'character-option';
        option.dataset.class = className;
        option.style.padding = '15px';
        option.style.border = '2px solid #444';
        option.style.borderRadius = '5px';
        option.style.cursor = 'pointer';
        option.style.textAlign = 'center';
        option.style.width = '120px';
        
        const name = document.createElement('h2');
        name.textContent = className.charAt(0).toUpperCase() + className.slice(1);
        
        option.appendChild(name);
        options.appendChild(option);
        
        // Add click handler
        option.addEventListener('click', () => {
          document.querySelectorAll('.character-option').forEach(o => 
            o.style.border = '2px solid #444');
          option.style.border = '2px solid gold';
          
          // Update start button state
          if (this.game && this.game.checkStartButtonState) {
            this.game.checkStartButtonState();
          }
        });
      });
      
      characterSelect.appendChild(options);
      
      // Add name input
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.id = 'player-name';
      nameInput.placeholder = 'Enter name...';
      nameInput.style.padding = '10px';
      nameInput.style.marginBottom = '20px';
      nameInput.style.width = '200px';
      characterSelect.appendChild(nameInput);
      
      // Add start button
      const startButton = document.createElement('button');
      startButton.id = 'start-game';
      startButton.textContent = 'Enter the World';
      startButton.style.padding = '10px 20px';
      startButton.style.backgroundColor = '#444';
      startButton.style.border = 'none';
      startButton.style.color = 'white';
      startButton.style.cursor = 'pointer';
      startButton.addEventListener('click', () => {
        if (this.game && this.game.startGame) {
          this.game.startGame();
        }
      });
      characterSelect.appendChild(startButton);
      
      // Add to game container
      gameContainer.appendChild(characterSelect);
      
      console.log("UI: Force-created character select screen");
      
      // Focus name input
      setTimeout(() => {
        nameInput.focus();
      }, 100);
    } catch (error) {
      console.error("UI: Error force-creating character select:", error);
    }
  }
} 