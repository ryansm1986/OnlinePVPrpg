/**
 * EffectsRenderer class
 * Handles rendering of visual effects
 */
class EffectsRenderer {
  /**
   * Create a new EffectsRenderer
   * @param {Renderer} renderer - Reference to the renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.effectsPool = new Map();
    this.textPool = new Map();
  }
  
  /**
   * Show an explosion effect at the given position
   * @param {Object} position - Position {x, y} for the explosion
   * @param {number} radius - Radius of the explosion
   * @param {number} duration - Duration in ms (default: 500)
   */
  showExplosionEffect(position, radius, duration = 500) {
    if (!position || !this.renderer.app) return;
    
    // Create an explosion sprite using the explosion textures
    const explosionTextures = this.renderer.textureManager.textures.effect.explosion;
    
    if (!explosionTextures || explosionTextures.length === 0) {
      console.warn("No explosion textures available");
      return;
    }
    
    // Create container for the explosion
    const container = new PIXI.Container();
    container.position.set(position.x, position.y);
    this.renderer.effectLayer.addChild(container);
    
    // Create the explosion sprite
    const explosion = new PIXI.Sprite(explosionTextures[0]);
    explosion.anchor.set(0.5, 0.5);
    explosion.scale.set(radius / 50, radius / 50); // Adjust based on texture size
    container.addChild(explosion);
    
    // Add glow effect
    const glow = new PIXI.Sprite(explosionTextures[0]);
    glow.anchor.set(0.5, 0.5);
    glow.scale.set(1.5, 1.5);
    glow.alpha = 0.5;
    glow.blendMode = PIXI.BLEND_MODES.ADD;
    container.addChild(glow);
    
    // Animate the explosion
    let startTime = Date.now();
    let frame = 0;
    
    // Create animation
    const animation = {
      target: `explosion_${Date.now()}`,
      completed: false,
      update: () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
          // Animation complete
          this.renderer.effectLayer.removeChild(container);
          container.destroy({ children: true });
          animation.completed = true;
          return;
        }
        
        // Update frame based on progress
        const newFrame = Math.min(
          Math.floor(progress * explosionTextures.length),
          explosionTextures.length - 1
        );
        
        if (newFrame !== frame) {
          frame = newFrame;
          explosion.texture = explosionTextures[frame];
          glow.texture = explosionTextures[frame];
        }
        
        // Scale down as the explosion fades
        const remainingScale = 1 - progress * 0.5;
        explosion.scale.set(radius / 50 * remainingScale, radius / 50 * remainingScale);
        
        // Fade out
        explosion.alpha = 1 - progress;
        glow.alpha = (1 - progress) * 0.5;
      }
    };
    
    this.renderer.animationManager.trackAnimation(animation);
  }
  
  /**
   * Show damage text at the given position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number|string} damage - Damage amount or text to show
   * @param {Object} options - Display options
   */
  showDamageText(x, y, damage, options = {}) {
    const style = {
      fontFamily: options.fontFamily || 'Arial',
      fontSize: options.fontSize || 16,
      fontWeight: options.fontWeight || 'bold',
      fill: options.color || 0xFF0000,
      stroke: options.stroke || 0x000000,
      strokeThickness: options.strokeThickness || 4,
      align: 'center'
    };
    
    const text = new PIXI.Text(String(damage), style);
    text.anchor.set(0.5, 0.5);
    text.position.set(x, y);
    
    this.renderer.effectLayer.addChild(text);
    
    // Animate the text floating up and fading out
    const animation = {
      target: `damage_text_${Date.now()}`,
      completed: false,
      startTime: Date.now(),
      duration: options.duration || 1000,
      update: () => {
        const elapsed = Date.now() - animation.startTime;
        const progress = elapsed / animation.duration;
        
        if (progress >= 1) {
          // Animation complete
          this.renderer.effectLayer.removeChild(text);
          text.destroy();
          animation.completed = true;
          return;
        }
        
        // Move up
        text.position.y = y - 40 * progress;
        
        // Fade out in the second half of the animation
        if (progress > 0.5) {
          text.alpha = 1 - (progress - 0.5) * 2;
        }
      }
    };
    
    this.renderer.animationManager.trackAnimation(animation);
  }
  
  /**
   * Play a hit animation on the target
   * @param {Object} target - Target to play animation on
   */
  playHitAnimation(target) {
    if (!target || !target.sprite) return;
    
    // Flash the target white
    const originalTint = target.sprite.tint;
    target.sprite.tint = 0xFFFFFF;
    
    // Create animation to restore tint
    const animation = {
      target: `hit_${target.id || Date.now()}`,
      completed: false,
      startTime: Date.now(),
      duration: 200,
      update: () => {
        const elapsed = Date.now() - animation.startTime;
        const progress = elapsed / animation.duration;
        
        if (progress >= 1) {
          // Animation complete
          target.sprite.tint = originalTint;
          animation.completed = true;
          return;
        }
        
        // Flash between white and original color
        if (Math.floor(progress * 6) % 2 === 0) {
          target.sprite.tint = 0xFFFFFF;
        } else {
          target.sprite.tint = originalTint;
        }
      }
    };
    
    this.renderer.animationManager.trackAnimation(animation);
  }
  
  /**
   * Clean up resources when renderer is destroyed
   */
  destroy() {
    this.effectsPool.clear();
    this.textPool.clear();
    console.log("EffectsRenderer destroyed");
  }
} 