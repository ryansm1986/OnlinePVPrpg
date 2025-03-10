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
  
  // SPRITE SHEET VALIDATOR
  window.validateSpriteSheet = function(img) {
    if (!img || !img.complete) {
      console.error("Image not loaded or incomplete");
      return false;
    }
    
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    console.log(`Sprite sheet dimensions: ${width}x${height}`);
    
    // Check dimensions - sheets must have 4 rows for directions
    // and each frame should be square (width/9 should equal height/4)
    const frameWidth = Math.floor(width / 9); // 9 potential frames per row
    const frameHeight = Math.floor(height / 4); // 4 rows (up, left, down, right)
    
    console.log(`Calculated frame size: ${frameWidth}x${frameHeight}`);
    
    // Check if frames have reasonable dimensions
    if (frameWidth < 16 || frameHeight < 16) {
      console.error("Frames are too small, need to be at least 16x16 pixels");
      return false;
    }
    
    // Check if sheet has proper aspect ratio for frame extraction
    if (Math.abs(frameWidth - frameHeight) > 8) {
      console.warn("Frames are not square - this may cause visual issues");
    }
    
    // Check how many complete frames fit horizontally
    const completeFrames = Math.floor(width / frameWidth);
    console.log(`Complete frames that fit horizontally: ${completeFrames}`);
    
    if (completeFrames < 3) {
      console.error("Not enough frames for animation (need at least 3)");
      return false;
    }
    
    // Provide specific guidance based on the image dimensions
    if (width === 365 && height === 497) {
      console.warn("====== DETECTED 365x497 SPRITE SHEET ======");
      console.warn("Your sprite sheet has unusual dimensions.");
      console.warn("For best results, resize to 576x256 with:");
      console.warn("- Width: 9 frames x 64px = 576px");
      console.warn("- Height: 4 rows x 64px = 256px");
      
      // Calculate max usable frames
      const usableWidth = completeFrames * frameWidth;
      console.log(`Usable width: ${usableWidth}px (${completeFrames} frames)`);
      
      // This is still usable, just with fewer frames
      console.log("This sheet is still usable with adaptations.");
    }
    
    return true;
  };
  
  // Helper function to test a sprite sheet
  window.testSpriteSheet = function(path) {
    const img = new Image();
    img.onload = function() {
      console.log(`Loaded sprite sheet: ${path}`);
      window.validateSpriteSheet(img);
    };
    img.onerror = function() {
      console.error(`Failed to load sprite sheet: ${path}`);
    };
    img.src = path;
    return img;
  };
  
  // Helper function to visualize sprite sheet layout
  window.visualizeSpriteSheet = function(path) {
    const img = new Image();
    img.onload = function() {
      console.log(`Loaded sprite sheet for visualization: ${path}`);
      
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      // Calculate frame dimensions
      const rows = 4; // up, left, down, right
      const cols = 9; // maximum columns
      const frameWidth = Math.floor(width / cols);
      const frameHeight = Math.floor(height / rows);
      
      // Create a canvas to visualize the sprite sheet
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Draw the sprite sheet
      ctx.drawImage(img, 0, 0);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      
      // Draw row dividers with labels
      const rowLabels = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
      for (let row = 0; row <= rows; row++) {
        const y = row * frameHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        // Add row label
        if (row < rows) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.font = '16px Arial';
          ctx.fillText(rowLabels[row], 5, y + 20);
        }
      }
      
      // Draw column dividers with numbers
      for (let col = 0; col <= cols; col++) {
        const x = col * frameWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Add column number
        if (col < cols) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.font = '16px Arial';
          ctx.fillText(col.toString(), x + 5, 16);
        }
      }
      
      // Display the canvas
      document.body.appendChild(canvas);
      canvas.style.position = 'fixed';
      canvas.style.top = '10px';
      canvas.style.right = '10px';
      canvas.style.border = '2px solid black';
      canvas.style.zIndex = '9999';
      canvas.style.background = 'white';
      canvas.style.maxWidth = '50%';
      canvas.style.maxHeight = '50%';
      
      // Add a close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '5px';
      closeBtn.style.right = '5px';
      closeBtn.onclick = function() {
        document.body.removeChild(canvas);
      };
      canvas.parentNode.appendChild(closeBtn);
      
      return canvas;
    };
    
    img.onerror = function() {
      console.error(`Failed to load sprite sheet for visualization: ${path}`);
    };
    
    img.src = path;
    return img;
  };
  
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