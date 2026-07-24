/* ==========================================================================
   A JOURNEY MADE JUST FOR YOU — Opening Scene
   Senior front-end build. Vanilla JS + GSAP. No jQuery, no frameworks.
   ========================================================================== */

(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     0. ELEMENT REFERENCES
   --------------------------------------------------------------------- */
  const canvas         = document.getElementById('space');
  const ctx            = canvas.getContext('2d');
  const moon           = document.getElementById('moon');
  const clouds         = document.querySelectorAll('.cloud');
  const fog            = document.getElementById('fog');
  const fireflyLayer   = document.getElementById('fireflies');
  const glassCard      = document.getElementById('glass-card');
  const eyebrow        = document.getElementById('eyebrow');
  const cardName       = document.getElementById('card-name');
  const sparkleField   = document.getElementById('sparkle-field');
  const typewriterWrap = document.getElementById('typewriter');
  const typewriterText = document.getElementById('typewriter-text');
  const beginPrompt    = document.getElementById('begin-prompt');
  const cursorGlow     = document.getElementById('cursor-glow');
  const transitionVeil = document.getElementById('transition-veil');
  const scene          = document.getElementById('opening-scene');

  /* ---------------------------------------------------------------------
     1. STARFIELD — drawn entirely on <canvas>, never as HTML/DOM nodes
   --------------------------------------------------------------------- */
  const STAR_COUNT = 300;
  let stars = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createStars() {
    stars = [];
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.4 + 0.3,         // random size
        baseAlpha: Math.random() * 0.6 + 0.25,       // random brightness
        blinkSpeed: Math.random() * 0.015 + 0.004,   // random blink rate
        blinkOffset: Math.random() * Math.PI * 2,    // random phase
        drift: Math.random() * 0.02 - 0.01           // barely-there parallax drift
      });
    }
  }

  let frame = 0;
  function drawStars() {
    frame++;
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (const star of stars) {
      const twinkle = Math.sin(frame * star.blinkSpeed + star.blinkOffset);
      const alpha = Math.max(0, star.baseAlpha + twinkle * 0.4);

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = star.radius * 2.5;
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();

      // gentle vertical drift for depth
      star.y += star.drift;
      if (star.y < 0) star.y = h;
      if (star.y > h) star.y = 0;
    }

    requestAnimationFrame(drawStars);
  }

  resizeCanvas();
  createStars();
  requestAnimationFrame(drawStars);

  window.addEventListener('resize', () => {
    resizeCanvas();
    createStars();
  });

  /* ---------------------------------------------------------------------
     2. FIREFLIES — generated in JS, appended as lightweight DOM nodes
   --------------------------------------------------------------------- */
  function createFireflies(count = 22) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const fly = document.createElement('div');
      fly.className = 'firefly';
      fly.style.left = Math.random() * w + 'px';
      fly.style.top = (h * 0.4 + Math.random() * h * 0.55) + 'px';
      const duration = 6 + Math.random() * 6;
      fly.style.animationDuration = `${duration}s, ${2 + Math.random() * 2}s`;
      fly.style.animationDelay = `${Math.random() * 4}s, ${Math.random() * 2}s`;
      frag.appendChild(fly);
    }
    fireflyLayer.appendChild(frag);
  }
  createFireflies();

  /* ---------------------------------------------------------------------
     3. CUSTOM GLOWING CURSOR — smooth trailing follow
   --------------------------------------------------------------------- */
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    glowX += (mouseX - glowX) * 0.16;
    glowY += (mouseY - glowY) * 0.16;
    cursorGlow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* ---------------------------------------------------------------------
     4. SPARKLES — tiny bursts of light around the name
   --------------------------------------------------------------------- */
  function spawnSparkles(count = 30) {
    const rect = cardName.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('span');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.animationDelay = `${Math.random() * 0.3}s`;
        sparkleField.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 2000);
      }, i * 90);
    }
  }

  /* ---------------------------------------------------------------------
     5. SHOOTING STAR — a single bright streak across the sky
   --------------------------------------------------------------------- */
  function fireShootingStar() {
    const streak = document.createElement('div');
    streak.className = 'shooting-star';
    scene.appendChild(streak);

    if (window.gsap) {
      gsap.fromTo(streak,
        { x: 0, y: 0, opacity: 0 },
        {
          x: window.innerWidth * 0.85,
          y: window.innerHeight * 0.35,
          opacity: 1,
          duration: 1.1,
          ease: 'power1.in',
          onComplete: () => {
            gsap.to(streak, { opacity: 0, duration: 0.3, onComplete: () => streak.remove() });
          }
        }
      );
    } else {
      streak.remove();
    }
  }

  /* ---------------------------------------------------------------------
     6. TYPEWRITER
   --------------------------------------------------------------------- */
  const TYPE_LINES = [
    'Someone spent countless hours...',
    'creating something...',
    'made only for you. ❤️'
  ];

  function typeWriter(lines, onDone) {
    let lineIndex = 0;
    let charIndex = 0;
    let output = '';

    function step() {
      if (lineIndex >= lines.length) {
        if (onDone) onDone();
        return;
      }
      const currentLine = lines[lineIndex];

      if (charIndex < currentLine.length) {
        output += currentLine.charAt(charIndex);
        typewriterText.innerHTML = output.replace(/\n/g, '<br>');
        charIndex++;
        setTimeout(step, 38 + Math.random() * 28);
      } else {
        output += '<br>';
        lineIndex++;
        charIndex = 0;
        setTimeout(step, 380);
      }
    }
    step();
  }

  /* ---------------------------------------------------------------------
     7. AUDIO — prepared, never autoplayed
   --------------------------------------------------------------------- */
  const backgroundMusic = new Audio('audio/background.mp3');
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.4;
  backgroundMusic.preload = 'auto';

  const clickSound = new Audio('audio/click.mp3');
  clickSound.volume = 0.6;
  clickSound.preload = 'auto';

  const magicSound = new Audio('audio/magic.mp3');
  magicSound.volume = 0.5;
  magicSound.preload = 'auto';

  function playSafely(audio) {
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        /* Autoplay was blocked — silently ignore until a real user gesture fires */
      });
    }
  }

  /* ---------------------------------------------------------------------
     8. CINEMATIC TIMELINE
   --------------------------------------------------------------------- */
  function runOpeningTimeline() {
    setTimeout(() => canvas.classList.add('is-visible'), 1000);

    setTimeout(() => {
      moon.classList.add('is-visible');
      fireShootingStar();
    }, 2000);

    // Recurring shooting star
    setTimeout(() => {
        setInterval(fireShootingStar, 25000);
    }, 5000);

    setTimeout(() => {
      clouds.forEach((c) => c.classList.add('is-visible'));
    }, 3000);

    setTimeout(() => {
      fog.classList.add('is-visible');
      fireflyLayer.classList.add('is-visible');
    }, 4000);

    setTimeout(() => {
      glassCard.classList.add('is-visible');
      eyebrow.classList.add('is-visible');
      cardName.classList.add('is-visible');
    }, 5000);

    setTimeout(() => {
      spawnSparkles();
      playSafely(magicSound);
    }, 6000);

    setTimeout(() => {
      typewriterWrap.classList.add('is-visible');
      typeWriter(TYPE_LINES);
    }, 7000);

    setTimeout(() => {
      beginPrompt.classList.add('is-visible');
    }, 14000);
  }

  runOpeningTimeline();

  /* ---------------------------------------------------------------------
     9. TAP TO BEGIN — click-out transition into the next chapter
   --------------------------------------------------------------------- */
  let hasEntered = false;

  function enterNextChapter(e) {
    if (hasEntered) return;
    hasEntered = true;

    playSafely(clickSound);
    playSafely(backgroundMusic);

    if (window.gsap) {
      const tl = gsap.timeline({
        onComplete: () => {
            window.location.href = "pass.html";
        }
      });

      tl.to(moon, { scale: 2.4, opacity: 0, duration: 1.6, ease: 'power2.in' }, 0)
        .to(glassCard, { opacity: 0, scale: 0.96, duration: 1, ease: 'power2.in' }, 0)
        .to(canvas, {
          opacity: 0,
          duration: 1.4,
          ease: 'power1.in',
          onStart: () => {
            // Stretch the stars outward before the canvas fades
            stars.forEach((s) => {
              s.driftBoost = 6;
            });
          }
        }, 0.2)
        .to(transitionVeil, { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, 0.6);
    } else {
      transitionVeil.style.transition = 'opacity 1.4s ease';
      transitionVeil.style.opacity = '1';
      setTimeout(() => {
          window.location.href = "pass.html";
      }, 1500);
    }
  }

  document.addEventListener('click', enterNextChapter, { once: false });

})();