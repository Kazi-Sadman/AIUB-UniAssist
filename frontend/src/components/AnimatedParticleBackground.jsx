import React, { useEffect, useRef } from "react";

// Colours are stored as "r, g, b" so we can add our own opacity when drawing.
// They match the app palette: gold, sky blue and a soft grey.
const PARTICLE_COLORS = ["228, 195, 78", "62, 123, 166", "139, 149, 163"];

// Two particles closer than this (in pixels) are joined by a faint line.
const MAX_LINK_DISTANCE = 140;

// One particle for roughly every this-many square pixels of screen.
// A bigger number means fewer particles.
const PIXELS_PER_PARTICLE = 24000;
const MIN_PARTICLE_COUNT = 24;
const MAX_PARTICLE_COUNT = 70;

// How many particles fit on this screen size (more on desktop, fewer on phones).
function getTargetParticleCount(width, height) {
  const countForScreen = Math.round((width * height) / PIXELS_PER_PARTICLE);
  return Math.min(MAX_PARTICLE_COUNT, Math.max(MIN_PARTICLE_COUNT, countForScreen));
}

// Create one particle at a random position with a slow random drift.
function createParticle(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    // Speeds are in pixels per 1/60th of a second. Small numbers = gentle drift.
    speedX: (Math.random() - 0.5) * 0.35,
    speedY: (Math.random() - 0.5) * 0.35,
    radius: 1 + Math.random() * 1.6,
    opacity: 0.25 + Math.random() * 0.35,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
  };
}

// Draws slow-moving dots behind the whole app.
// - pointer-events-none means the canvas never blocks clicks or typing.
// - aria-hidden hides it from screen readers because it is only decoration.
export default function AnimatedParticleBackground({ enabled = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let particleList = [];
    let canvasWidth = 0;
    let canvasHeight = 0;
    let animationFrameId = null;
    let previousTimestamp = 0;

    // Match the canvas size to the window. We multiply by the device pixel ratio
    // so the dots stay sharp on high-density (retina) screens.
    function resizeCanvas() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      canvas.width = canvasWidth * pixelRatio;
      canvas.height = canvasHeight * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      // Keep the particles we already have and only add or remove the difference.
      // This avoids a visual "reset" when a phone's address bar hides on scroll.
      const targetCount = getTargetParticleCount(canvasWidth, canvasHeight);
      while (particleList.length < targetCount) {
        particleList.push(createParticle(canvasWidth, canvasHeight));
      }
      particleList.length = Math.min(particleList.length, targetCount);

      drawFrame();
    }

    // Move every particle. `timeScale` is 1 at 60fps, so motion looks the same
    // speed on 60Hz and 144Hz monitors.
    function moveParticles(timeScale) {
      particleList.forEach((particle) => {
        particle.x += particle.speedX * timeScale;
        particle.y += particle.speedY * timeScale;

        // When a particle leaves one edge, bring it back in on the opposite edge.
        if (particle.x < -10) particle.x = canvasWidth + 10;
        if (particle.x > canvasWidth + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvasHeight + 10;
        if (particle.y > canvasHeight + 10) particle.y = -10;
      });
    }

    function drawFrame() {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      // Faint lines between nearby particles. Closer particles get a stronger line.
      for (let first = 0; first < particleList.length; first++) {
        for (let second = first + 1; second < particleList.length; second++) {
          const distanceX = particleList[first].x - particleList[second].x;
          const distanceY = particleList[first].y - particleList[second].y;
          const distance = Math.hypot(distanceX, distanceY);

          if (distance < MAX_LINK_DISTANCE) {
            const lineOpacity = 0.1 * (1 - distance / MAX_LINK_DISTANCE);
            context.strokeStyle = `rgba(139, 149, 163, ${lineOpacity})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particleList[first].x, particleList[first].y);
            context.lineTo(particleList[second].x, particleList[second].y);
            context.stroke();
          }
        }
      }

      // The dots themselves.
      particleList.forEach((particle) => {
        context.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
    }

    // The animation loop: browsers call this before each screen repaint.
    function animate(timestamp) {
      // Clamp the time gap so a long pause (like switching tabs) cannot make
      // particles jump across the screen.
      const elapsedFrames = Math.min((timestamp - previousTimestamp) / 16.67, 3);
      previousTimestamp = timestamp;

      moveParticles(elapsedFrames);
      drawFrame();
      animationFrameId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (animationFrameId !== null) return; // already running
      previousTimestamp = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
      if (animationFrameId === null) return;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Animate only when the person allows motion and the tab is visible.
    // With reduced motion on, we draw one still frame and never animate.
    function updateAnimationState() {
      if (reducedMotionQuery.matches || document.hidden) {
        stopAnimation();
        drawFrame();
      } else {
        startAnimation();
      }
    }

    resizeCanvas();
    updateAnimationState();

    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", updateAnimationState);
    reducedMotionQuery.addEventListener("change", updateAnimationState);

    // Cleanup: runs when the background is turned off or the app unmounts.
    return () => {
      stopAnimation();
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("visibilitychange", updateAnimationState);
      reducedMotionQuery.removeEventListener("change", updateAnimationState);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none" />
  );
}
