/**
 * Game Configuration
 * Contains constants and settings for the game
 */
const CONFIG = {
  // Game settings
  GAME_WIDTH: window.innerWidth,
  GAME_HEIGHT: window.innerHeight,
  WORLD_WIDTH: 4000,  // Doubled from 2000
  WORLD_HEIGHT: 4000, // Doubled from 2000
  
  // Network settings
  SERVER_URL: window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin,
  UPDATE_RATE: 50, // ms between server updates
  
  // Player settings
  PLAYER_SPEED: {
    warrior: 140,
    mage: 150,
    ranger: 170
  },
  PLAYER_SIZE: 48,
  
  // CRITICAL FIX: Add class-specific player sprite sizes
  // This allows us to adjust the display size for each class to ensure they look consistent
  PLAYER_SPRITE_SIZE: {
    warrior: 60,
    mage: 60,
    ranger: 124  // Increased ranger size to make it match other classes visually
  },
  
  // Combat settings
  ATTACK_RANGE: {
    warrior: 40,
    mage: 200,
    ranger: 150
  },
  ATTACK_DURATION: {
    warrior: 500,
    mage: 300,
    ranger: 200
  },
  ATTACK_COOLDOWN: {
    warrior: 500,
    mage: 800,
    ranger: 600
  },
  
  // Skill settings
  SKILL_COOLDOWNS: {
    warrior: {
      1: 5000 // Cleave: 5 seconds
    },
    mage: {
      1: 8000 // Fireball: 8 seconds
    },
    ranger: {
      1: 6000 // Multi-shot: 6 seconds
    }
  },
  
  // Monster settings
  MONSTER_SIZE: 32,
  
  // Item settings
  ITEM_SIZE: 24,
  ITEM_PICKUP_RANGE: 30,
  
  // UI settings
  MINIMAP_SCALE: 0.1, // Scale factor for minimap
  
  // Rendering settings
  CAMERA_LERP: 0.1, // Camera smoothing factor (0-1)
  RENDER_DISTANCE: 1000, // Only render entities within this distance
  USE_SPRITE_SHEETS: true, // Enable sprite sheet animations
  SPRITE_SHEET_DEBUG: true, // Enable sprite sheet debugging info
  
  // Biome colors
  BIOME_COLORS: {
    forest: 0x228B22, // Forest green
    swamp: 0x2F4F4F, // Dark slate gray
    ruins: 0x8B4513, // Saddle brown
    mountains: 0xA9A9A9 // Dark gray
  },
  
  // Item rarity colors
  RARITY_COLORS: {
    common: 0xFFFFFF, // White
    rare: 0x4169E1, // Royal blue
    legendary: 0xFFD700 // Gold
  },
  
  // Terrain settings
  TERRAIN: {
    MAX_TREES: 120,        // Reduced from 300 to help with memory issues
    MAX_ROCKS: 80,         // Reduced from 180 to help with memory issues
    TREE_SIZE: {
      min: 60,  // Increased from 20 to 60 (300% of original)
      max: 96   // Increased from 32 to 96 (300% of original)
    },
    ROCK_SIZE: {
      min: 10,
      max: 20
    }
  },
  
  // Debug settings
  DEBUG: {
    SHOW_HITBOXES: false,
    SHOW_PATHS: false,
    LOG_NETWORK: false
  }
}; 