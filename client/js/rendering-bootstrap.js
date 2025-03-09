/**
 * Rendering System Bootstrap
 * 
 * This file loads all the modular rendering components and initializes them.
 * It provides a compatibility layer to ensure the game works with the new 
 * modular renderer while the migration is in progress.
 */

// In a real project you'd use import statements, but for this example
// we're assuming script tags in HTML

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing modular rendering system...');

  // Fix for baseTexture width/height being 0
  window.fixBaseTextureWidthHeight = function(baseTexture, defaultWidth, defaultHeight) {
    if (!baseTexture) return baseTexture;
    
    // Create getters that return the default dimensions if the actual dimensions are 0
    Object.defineProperties(baseTexture, {
      width: {
        get: function() {
          return this._width && this._width > 0 ? this._width : (defaultWidth || 576);
        },
        set: function(value) {
          this._width = value;
        }
      },
      height: {
        get: function() {
          return this._height && this._height > 0 ? this._height : (defaultHeight || 256);
        },
        set: function(value) {
          this._height = value;
        }
      }
    });
    
    return baseTexture;
  };

  // COMPATIBILITY LAYER
  // This ensures that the old renderer.js will use TextureManager for player textures
  // when both systems are loaded during the transition
  window.setupRendererCompatibility = function(oldRenderer) {
    if (!oldRenderer || !oldRenderer.textureManager) return;
    
    // Override old renderer's playerTextures with a proxy that redirects to TextureManager
    Object.defineProperty(oldRenderer, 'playerTextures', {
      get: function() {
        console.log("Accessing playerTextures via compatibility layer");
        return oldRenderer.textureManager.playerTextures;
      },
      set: function(value) {
        console.log("Setting playerTextures via compatibility layer");
        // Don't actually set anything - the TextureManager manages textures now
        // This prevents accidental overrides
      }
    });
    
    // Add a helper method to the old renderer to load class textures through TextureManager
    oldRenderer.loadClassTexture = function(className, path) {
      return oldRenderer.textureManager.loadClassTexture(className, path);
    };
    
    // Patch the old renderer's sprite sheet loading to handle width=0 issues
    const originalLoadClassSpriteSheet = oldRenderer.loadClassSpriteSheet;
    if (typeof originalLoadClassSpriteSheet === 'function') {
      oldRenderer.loadClassSpriteSheet = function(className, path) {
        // If using the original method in renderer.js, patch it to fix dimensions
        if (path && path.baseTexture) {
          path.baseTexture = window.fixBaseTextureWidthHeight(path.baseTexture, 576, 256);
        }
        return originalLoadClassSpriteSheet.call(oldRenderer, className, path);
      };
    }
    
    console.log("Renderer compatibility layer established");
  };

  // SPRITE SHEET INTEGRATION GUIDE:
  //
  // For sprite sheet support:
  // 1. Create sprite sheets with dimensions 576x256 pixels
  // 2. Organize rows as follows:
  //    - Row 1 (top): Up animations (9 frames)
  //    - Row 2: Left animations (9 frames) 
  //    - Row 3: Down animations (9 frames)
  //    - Row 4 (bottom): Right animations (9 frames)
  // 3. Place sprite sheets in assets/sprites/characters/ directory
  // 4. Name sprite sheets after the character class (e.g., warrior.png, mage.png, ranger.png)
  // 5. Set CONFIG.USE_SPRITE_SHEETS = true in config.js
  
  // This would typically be in separate files, imported via <script> tags:
  // - client/js/rendering/Renderer.js
  // - client/js/rendering/TextureManager.js
  // - client/js/rendering/TerrainRenderer.js
  // - client/js/rendering/EntityRenderer.js
  // - client/js/rendering/AnimationManager.js
  // - client/js/rendering/UIRenderer.js
  // - client/js/rendering/MinimapRenderer.js
  // - client/js/rendering/EffectsRenderer.js
  
  // Add script tags to the HTML file in order:
  // 
  // <script src="js/rendering/AnimationManager.js"></script>
  // <script src="js/rendering/TextureManager.js"></script>
  // <script src="js/rendering/TerrainRenderer.js"></script>
  // <script src="js/rendering/EntityRenderer.js"></script>
  // <script src="js/rendering/UIRenderer.js"></script>
  // <script src="js/rendering/MinimapRenderer.js"></script>
  // <script src="js/rendering/EffectsRenderer.js"></script>
  // <script src="js/rendering/Renderer.js"></script>
  // 
  // Then update the main.js file to use the new Renderer class
  
  // Migration Path:
  // 
  // 1. Create all the renderer module files
  // 2. Add the script tags to index.html
  // 3. Update main.js to use the new Renderer class
  // 4. Verify it works and remove the old renderer.js
  
  console.log('Modular rendering system initialized!');
});

// Notes for updating the HTML file:
//
// Replace:
// <script src="js/renderer.js"></script>
//
// With:
// <script src="js/rendering/AnimationManager.js"></script>
// <script src="js/rendering/TextureManager.js"></script>
// <script src="js/rendering/TerrainRenderer.js"></script>
// <script src="js/rendering/EntityRenderer.js"></script>
// <script src="js/rendering/UIRenderer.js"></script>
// <script src="js/rendering/MinimapRenderer.js"></script>
// <script src="js/rendering/EffectsRenderer.js"></script>
// <script src="js/rendering/Renderer.js"></script>
//
// This ensures all required classes are available when the Renderer class is initialized. 