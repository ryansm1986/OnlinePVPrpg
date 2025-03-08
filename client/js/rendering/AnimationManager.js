/**
 * AnimationManager
 * Handles tracking and management of animations
 */
class AnimationManager {
  /**
   * Create a new AnimationManager
   * @param {Renderer} renderer - Reference to the renderer
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.activeAnimations = [];
    this.animationCleanupInterval = null;
    
    // Animation frame tracking for debugging
    this.frameCounter = 0;
    this.lastFrameTimestamp = 0;
    this.frameTimes = [];
  }
  
  /**
   * Set up interval to clean up inactive animations
   */
  setupAnimationCleanup() {
    // Set up interval to clean up inactive animations
    this.animationCleanupInterval = setInterval(() => {
      this.cleanupAnimations();
    }, 5000); // Check every 5 seconds
    
    console.log("Animation cleanup interval set up");
  }
  
  /**
   * Track an animation
   * @param {Object} animation - Animation object with update method and target ID
   * @returns {Object} The tracked animation
   */
  trackAnimation(animation) {
    if (!animation.target) {
      console.warn("Animation missing target identifier");
      animation.target = "anim_" + Date.now() + "_" + Math.random();
    }
    
    this.activeAnimations.push(animation);
    return animation;
  }
  
  /**
   * Update tracked animations
   * @param {number} deltaTime - Time since last update
   */
  updateAnimations(deltaTime) {
    // Track frame rate for debugging
    const now = performance.now();
    if (this.lastFrameTimestamp) {
      this.frameTimes.push(now - this.lastFrameTimestamp);
      if (this.frameTimes.length > 60) { // Keep last 60 samples
        this.frameTimes.shift();
      }
    }
    this.lastFrameTimestamp = now;
    this.frameCounter++;
    
    // Log FPS every 300 frames
    if (this.frameCounter % 300 === 0) {
      const avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
      const fps = 1000 / avgFrameTime;
      console.log(`Current FPS: ${fps.toFixed(1)}`);
    }
    
    // Update all active animations
    for (const animation of this.activeAnimations) {
      if (!animation.completed && animation.update) {
        try {
          animation.update(deltaTime);
        } catch (error) {
          console.error("Error updating animation:", error);
          animation.completed = true;
        }
      }
    }
  }
  
  /**
   * Clean up completed animations
   */
  cleanupAnimations() {
    const initialCount = this.activeAnimations.length;
    this.activeAnimations = this.activeAnimations.filter(anim => !anim.completed);
    
    if (initialCount !== this.activeAnimations.length) {
      console.log(`Cleaned up ${initialCount - this.activeAnimations.length} completed animations, ${this.activeAnimations.length} remaining`);
    }
  }
  
  /**
   * Clear animation cleanup interval
   */
  clearAnimationCleanup() {
    if (this.animationCleanupInterval) {
      clearInterval(this.animationCleanupInterval);
      this.animationCleanupInterval = null;
      console.log("Animation cleanup interval cleared");
    }
  }
  
  /**
   * Create a sprite animation
   * @param {PIXI.Sprite} sprite - Sprite to animate
   * @param {Object} params - Animation parameters
   * @returns {Object} Animation handle
   */
  animateSprite(sprite, params) {
    if (!sprite) {
      console.error("Cannot animate undefined sprite");
      return null;
    }
    
    const duration = params.duration || 1000;
    const startTime = Date.now();
    const startProps = {
      x: params.startX !== undefined ? params.startX : sprite.x,
      y: params.startY !== undefined ? params.startY : sprite.y,
      alpha: params.startAlpha !== undefined ? params.startAlpha : sprite.alpha,
      scale: params.startScale !== undefined ? params.startScale : sprite.scale.x
    };
    
    const endProps = {
      x: params.endX !== undefined ? params.endX : startProps.x,
      y: params.endY !== undefined ? params.endY : startProps.y,
      alpha: params.endAlpha !== undefined ? params.endAlpha : startProps.alpha,
      scale: params.endScale !== undefined ? params.endScale : startProps.scale
    };
    
    const animation = {
      target: params.id || sprite.name || "sprite_" + Date.now(),
      completed: false,
      update: (delta) => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Calculate easing (simple easeOutQuad)
        const eased = params.easing ? 1 - Math.pow(1 - progress, 2) : progress;
        
        // Update properties
        if (params.x) sprite.x = startProps.x + (endProps.x - startProps.x) * eased;
        if (params.y) sprite.y = startProps.y + (endProps.y - startProps.y) * eased;
        if (params.alpha) sprite.alpha = startProps.alpha + (endProps.alpha - startProps.alpha) * eased;
        if (params.scale) sprite.scale.set(
          startProps.scale + (endProps.scale - startProps.scale) * eased
        );
        
        // Complete when done
        if (progress >= 1) {
          this.onAnimationComplete(animation, params);
        }
      },
      cancel: () => {
        animation.completed = true;
      }
    };
    
    return this.trackAnimation(animation);
  }
  
  /**
   * Handle animation completion
   * @param {Object} animation - The animation that completed
   * @param {Object} params - Original animation parameters
   */
  onAnimationComplete(animation, params) {
    animation.completed = true;
    
    // Fire onComplete callback if provided
    if (params.onComplete && typeof params.onComplete === 'function') {
      try {
        params.onComplete();
      } catch (error) {
        console.error("Error in animation onComplete callback:", error);
      }
    }
  }
  
  /**
   * Clean up resources when manager is destroyed
   */
  destroy() {
    this.clearAnimationCleanup();
    this.activeAnimations = [];
    console.log("AnimationManager destroyed");
  }
} 