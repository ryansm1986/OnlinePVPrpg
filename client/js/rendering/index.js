/**
 * Renderer Module System
 * This file brings together all renderer modules into a unified system
 */

// This file now only serves as documentation and initialization point for the rendering system
// The actual class implementations are in their respective files

// In a real production project with ES modules, this would export all components:
// export { Renderer, TextureManager, TerrainRenderer, EntityRenderer, ... };

console.log("Initializing modular rendering system...");

// DO NOT define classes here - they're defined in their individual files:
// - AnimationManager.js 
// - TextureManager.js
// - TerrainRenderer.js  
// - EntityRenderer.js
// - UIRenderer.js
// - MinimapRenderer.js
// - EffectsRenderer.js
// - Renderer.js

// Migration Notes:
// 1. All renderer classes are now split into individual files
// 2. Each file contains a single responsibility class
// 3. The HTML loads them in the correct dependency order
// 4. This maintains the codebase under 500 lines per file 