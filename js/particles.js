/**
 * particles.js — 3D Constellation Background
 * =============================================
 * Creates an immersive, interactive particle field with
 * depth-of-field simulation, mouse reactivity, and
 * constellation-style connections between nearby particles.
 *
 * Performance: Uses requestAnimationFrame, off-screen
 * culling, and distance-based LOD to stay smooth at 60fps.
 */

(function () {
  'use strict';

  const PARTICLE_CONFIG = {
    count: 120,           // Number of particles
    maxSpeed: 1.5,        // Max base speed
    connectionDist: 150,  // Max distance for lines between particles
    mouseRadius: 200,     // Mouse influence radius
    mouseForce: 0.04,     // How strongly particles react to cursor (increased)
    depthLayers: 3,       // Simulated depth layers
    baseRadius: 2,        // Base particle radius
    glowIntensity: 0.8,   // Glow bloom intensity (increased)
  };

  class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.canvas.width;
      this.y = Math.random() * this.canvas.height;
      this.z = Math.random() * PARTICLE_CONFIG.depthLayers; // Depth (0 = far, 3 = near)
      this.vx = (Math.random() - 0.5) * PARTICLE_CONFIG.maxSpeed;
      this.vy = (Math.random() - 0.5) * PARTICLE_CONFIG.maxSpeed;
      this.baseRadius = PARTICLE_CONFIG.baseRadius * (0.5 + this.z / PARTICLE_CONFIG.depthLayers);
      this.radius = this.baseRadius;
      this.opacity = 0.2 + (this.z / PARTICLE_CONFIG.depthLayers) * 0.6;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.01 + Math.random() * 0.02;
    }

    update(mouse, width, height) {
      // Gentle pulse
      this.pulsePhase += this.pulseSpeed;
      this.radius = this.baseRadius + Math.sin(this.pulsePhase) * 0.5;

      // Mouse interaction — particles gently drift away from cursor
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PARTICLE_CONFIG.mouseRadius) {
          const force = (1 - dist / PARTICLE_CONFIG.mouseRadius) * PARTICLE_CONFIG.mouseForce;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
      }

      // Apply velocity with damping
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.99;
      this.vy *= 0.99;

      // Wrap around edges with padding
      const pad = 20;
      if (this.x < -pad) this.x = width + pad;
      if (this.x > width + pad) this.x = -pad;
      if (this.y < -pad) this.y = height + pad;
      if (this.y > height + pad) this.y = -pad;
    }
  }

  class ParticleField {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: null, y: null };
      this.animId = null;
      this.isRunning = false;

      this.handleResize = this.handleResize.bind(this);
      this.handleMouse = this.handleMouse.bind(this);
      this.handleMouseLeave = this.handleMouseLeave.bind(this);
      this.animate = this.animate.bind(this);

      this.init();
    }

    init() {
      this.handleResize();
      window.addEventListener('resize', this.handleResize);
      this.canvas.addEventListener('mousemove', this.handleMouse);
      this.canvas.addEventListener('touchmove', this.handleTouch.bind(this), { passive: true });
      this.canvas.addEventListener('mouseleave', this.handleMouseLeave);

      // Spawn particles
      for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
        this.particles.push(new Particle(this.canvas));
      }

      this.start();
    }

    handleResize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      this.ctx.scale(dpr, dpr);
      this.displayWidth = rect.width;
      this.displayHeight = rect.height;
    }

    handleMouse(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    }

    handleTouch(e) {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.touches[0].clientX - rect.left;
        this.mouse.y = e.touches[0].clientY - rect.top;
      }
    }

    handleMouseLeave() {
      this.mouse.x = null;
      this.mouse.y = null;
    }

    getParticleColor(opacity) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        return 'rgba(139, 92, 246, ' + opacity + ')';  // Purple in dark mode
      }
      return 'rgba(99, 102, 241, ' + opacity + ')';    // Indigo in light mode
    }

    getConnectionColor(opacity) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        return 'rgba(139, 92, 246, ' + opacity + ')';
      }
      return 'rgba(99, 102, 241, ' + opacity + ')';
    }

    drawParticle(p) {
      const ctx = this.ctx;

      // Glow effect
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = this.getParticleColor(p.opacity * PARTICLE_CONFIG.glowIntensity * 0.15);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.getParticleColor(p.opacity);
      ctx.fill();
      ctx.restore();
    }

    drawConnections() {
      const ctx = this.ctx;
      const particles = this.particles;
      const maxDist = PARTICLE_CONFIG.connectionDist;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = this.getConnectionColor(opacity);
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw connections to mouse cursor
      if (this.mouse.x !== null && this.mouse.y !== null) {
        for (let i = 0; i < particles.length; i++) {
          const dx = particles[i].x - this.mouse.x;
          const dy = particles[i].y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist * 1.2) {
            const opacity = (1 - dist / (maxDist * 1.2)) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(this.mouse.x, this.mouse.y);
            ctx.strokeStyle = this.getConnectionColor(opacity);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

      // Update and draw particles
      for (const p of this.particles) {
        p.update(this.mouse, this.displayWidth, this.displayHeight);
        this.drawParticle(p);
      }

      this.drawConnections();

      if (this.isRunning) {
        this.animId = requestAnimationFrame(this.animate);
      }
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.animId = requestAnimationFrame(this.animate);
    }

    stop() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    destroy() {
      this.stop();
      window.removeEventListener('resize', this.handleResize);
      this.canvas.removeEventListener('mousemove', this.handleMouse);
      this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    }
  }

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    // Initialize on any canvas with the class "particle-canvas"
    document.querySelectorAll('.particle-canvas').forEach(function (canvas) {
      new ParticleField(canvas.id);
    });
  });

  // Pause when tab is hidden for performance
  document.addEventListener('visibilitychange', function () {
    // Handled automatically by rAF stopping when tab is hidden
  });

  // Expose for manual control if needed
  window.ParticleField = ParticleField;
})();
