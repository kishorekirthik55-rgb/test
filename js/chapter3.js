/* ==========================================================================
   THE MEMORY GALLERY — Chapter Three
   Production JavaScript (GSAP-powered)
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 0. STATE & CONSTANTS
   * ------------------------------------------------------------------ */
  const STATE = {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    musicPlaying: false,
    modalOpen: false,
    lastFocusedElement: null,
    hasGSAP: typeof window.gsap !== 'undefined',
    redirectUrl: 'chapter4.html',
    finaleTriggered: false
  };

  const REDUCED_PARTICLE_COUNT = 10;
  const FULL_PARTICLE_COUNT = 34;
  const REDUCED_FIREFLY_COUNT = 6;
  const FULL_FIREFLY_COUNT = 16;

  /* ------------------------------------------------------------------ *
   * 1. DOM REFERENCES
   * ------------------------------------------------------------------ */
  const dom = {
    body: document.body,
    loadingOverlay: document.getElementById('loadingOverlay'),
    flashOverlay: document.getElementById('flashOverlay'),
    mainContent: document.getElementById('mainContent'),
    particleField: document.getElementById('particleField'),
    fireflyField: document.getElementById('fireflyField'),
    fairyLines: document.querySelectorAll('.fairy-strand__line'),
    photoTriggers: document.querySelectorAll('.photo-trigger'),
    musicToggle: document.getElementById('musicToggle'),
    bgMusic: document.getElementById('bgMusic'),
    clickSound: document.getElementById('clickSound'),
    chimeSound: document.getElementById('chimeSound'),
    modal: document.getElementById('photoModal'),
    modalPopup: document.querySelector('.glass-popup'),
    modalImage: document.getElementById('modalImage'),
    modalTitle: document.getElementById('modalTitle'),
    modalDate: document.getElementById('modalDate'),
    modalCaption: document.getElementById('modalCaption'),
    modalClose: document.querySelectorAll('[data-close-modal]'),
    continueLink: document.getElementById('continueLink')
  };

  /* ------------------------------------------------------------------ *
   * 2. UTILITIES
   * ------------------------------------------------------------------ */
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function safePlay(audioEl, volume) {
    if (!audioEl) return;
    try {
      if (typeof volume === 'number') audioEl.volume = volume;
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {
      /* autoplay restrictions or missing asset — fail silently */
    }
  }

  function tween(target, vars) {
    if (STATE.hasGSAP) {
      return window.gsap.to(target, vars);
    }
    // minimal CSS-transition fallback
    if (vars.onComplete) setTimeout(vars.onComplete, (vars.duration || 0.3) * 1000);
    return null;
  }

  /* ------------------------------------------------------------------ *
   * 3. LOADING SEQUENCE
   * ------------------------------------------------------------------ */
  function initLoading() {
    const minimumDisplay = 900;
    const start = Date.now();

    function finishLoading() {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, minimumDisplay - elapsed);
      setTimeout(() => {
        dom.loadingOverlay.classList.add('is-hidden');
        dom.body.classList.remove('is-loading');
        setTimeout(() => {
          dom.loadingOverlay.setAttribute('hidden', '');
        }, 700);
        revealGallery();
      }, wait);
    }

    if (document.readyState === 'complete') {
      finishLoading();
    } else {
      window.addEventListener('load', finishLoading, { once: true });
      // safety fallback in case 'load' is delayed by placeholder assets
      setTimeout(finishLoading, 2500);
    }
  }

  function revealGallery() {
    if (!STATE.hasGSAP || STATE.prefersReducedMotion) return;
    window.gsap.fromTo(
      '.fairy-strand',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.18, ease: 'power2.out' }
    );
  }

  /* ------------------------------------------------------------------ *
   * 4. AMBIENT PARTICLES
   * ------------------------------------------------------------------ */
  function createParticles() {
    if (!dom.particleField) return;
    const count = STATE.prefersReducedMotion ? REDUCED_PARTICLE_COUNT : FULL_PARTICLE_COUNT;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const size = rand(2, 5);
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = rand(0, 100) + 'vw';
      p.style.top = rand(0, 100) + 'vh';
      p.style.opacity = String(rand(0.15, 0.55));
      fragment.appendChild(p);
      animateParticle(p);
    }
    dom.particleField.appendChild(fragment);
  }

  function animateParticle(el) {
    if (!STATE.hasGSAP) return;
    const duration = rand(10, 22);
    const driftX = rand(-40, 40);
    const driftY = rand(-60, -120);

    window.gsap.to(el, {
      x: driftX,
      y: driftY,
      opacity: 0,
      duration: STATE.prefersReducedMotion ? duration * 1.6 : duration,
      ease: 'sine.inOut',
      repeat: -1,
      delay: rand(0, 6),
      onRepeat: () => {
        gsap.set(el, {
          x: 0,
          y: 0,
          left: rand(0, 100) + 'vw',
          top: rand(40, 100) + 'vh',
          opacity: rand(0.15, 0.55)
        });
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. FIREFLIES
   * ------------------------------------------------------------------ */
  function createFireflies() {
    if (!dom.fireflyField) return;
    const count = STATE.prefersReducedMotion ? REDUCED_FIREFLY_COUNT : FULL_FIREFLY_COUNT;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const f = document.createElement('img');
      f.src = 'images/glowing.png';
      f.className = 'firefly';
      f.style.left = rand(0, 100) + 'vw';
      f.style.top = rand(30, 92) + 'vh';
      fragment.appendChild(f);
      animateFirefly(f);
    }
    dom.fireflyField.appendChild(fragment);
  }

  function animateFirefly(el) {
    if (!STATE.hasGSAP) return;

    const wander = () => {
      window.gsap.to(el, {
        x: rand(-80, 80),
        y: rand(-60, 60),
        duration: rand(4, 9),
        ease: 'sine.inOut',
        onComplete: wander
      });
    };

    window.gsap.to(el, {
      opacity: rand(0.5, 1),
      duration: rand(1.2, 2.4),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: rand(0, 3)
    });

    wander();
  }

  /* ------------------------------------------------------------------ *
   * 6. FAIRY LIGHT GLOW ORCHESTRATION
   * ------------------------------------------------------------------ */
  function animateFairyLights() {
    if (!STATE.hasGSAP || STATE.prefersReducedMotion) return;
    dom.fairyLines.forEach((line, i) => {
      const bulbs = line.querySelectorAll('.bulb');
      window.gsap.to(bulbs, {
        opacity: 0.75,
        duration: 1.6,
        stagger: { each: 0.12, repeat: -1, yoyo: true },
        ease: 'sine.inOut',
        delay: i * 0.3
      });
    });
  }

  function brightenAllFairyLights() {
    dom.fairyLines.forEach((line) => line.classList.add('is-glowing'));
  }

  /* ------------------------------------------------------------------ *
   * 7. SPARKLE BURST
   * ------------------------------------------------------------------ */
  function sparkleBurst(x, y, count) {
    const total = count || 14;
    for (let i = 0; i < total; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      document.body.appendChild(s);

      const angle = (Math.PI * 2 * i) / total + rand(-0.2, 0.2);
      const distance = rand(40, 140);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      if (STATE.hasGSAP) {
        window.gsap.to(s, {
          x: dx,
          y: dy,
          opacity: 0,
          scale: rand(0.3, 1.4),
          duration: rand(0.6, 1.1),
          ease: 'power2.out',
          onComplete: () => s.remove()
        });
      } else {
        setTimeout(() => s.remove(), 900);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * 8. PHOTO MODAL
   * ------------------------------------------------------------------ */
  function openModal(trigger, originEvent) {
    if (STATE.modalOpen) return;
    STATE.modalOpen = true;
    STATE.lastFocusedElement = document.activeElement;

    const data = trigger.dataset;

    dom.modalImage.src = data.full || '';
    dom.modalImage.alt = data.title ? `Enlarged memory: ${data.title}` : 'Enlarged memory photo';
    dom.modalTitle.textContent = data.title || '';
    dom.modalDate.textContent = data.date || '';
    dom.modalCaption.textContent = data.caption || '';

    dom.modal.removeAttribute('hidden');
    // force reflow so the transition runs
    void dom.modal.offsetWidth;
    dom.modal.classList.add('is-active');
    dom.mainContent.classList.add('is-blurred');
    dom.body.classList.add('modal-open');

    safePlay(dom.clickSound, 0.6);

    const originX = originEvent ? originEvent.clientX : window.innerWidth / 2;
    const originY = originEvent ? originEvent.clientY : window.innerHeight / 2;
    sparkleBurst(originX, originY, 16);

    if (STATE.hasGSAP && !STATE.prefersReducedMotion) {
      window.gsap.fromTo(
        dom.modalPopup,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }
      );
    }

    // focus management
    dom.modalPopup.setAttribute('tabindex', '-1');
    dom.modalPopup.focus();

    // final photo check
    const index = parseInt(data.index, 10);
    const total = parseInt(data.total, 10);
    if (index && total && index === total) {
      scheduleFinale();
    }
  }

  function closeModal() {
    if (!STATE.modalOpen) return;
    STATE.modalOpen = false;

    const finish = () => {
      dom.modal.classList.remove('is-active');
      dom.modal.setAttribute('hidden', '');
      dom.mainContent.classList.remove('is-blurred');
      dom.body.classList.remove('modal-open');
      dom.modalImage.src = '';

      if (STATE.lastFocusedElement && typeof STATE.lastFocusedElement.focus === 'function') {
        STATE.lastFocusedElement.focus();
      }
    };

    if (STATE.hasGSAP && !STATE.prefersReducedMotion) {
      window.gsap.to(dom.modalPopup, {
        scale: 0.92,
        opacity: 0,
        duration: 0.32,
        ease: 'power2.in',
        onComplete: finish
      });
    } else {
      finish();
    }
  }

  function bindModalEvents() {
    dom.photoTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => openModal(trigger, e));
    });

    dom.modalClose.forEach((el) => {
      el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
      if (!STATE.modalOpen) return;
      if (e.key === 'Escape') {
        closeModal();
      }
      if (e.key === 'Tab') {
        trapFocus(e);
      }
    });
  }

  function trapFocus(e) {
    const focusable = dom.modalPopup.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------------ *
   * 9. FINALE SEQUENCE
   * ------------------------------------------------------------------ */
  function scheduleFinale() {
    if (STATE.finaleTriggered) return;
    STATE.finaleTriggered = true;

    setTimeout(runFinale, 2600);
  }

  function runFinale() {
    // golden sparkle explosion across viewport center
    sparkleBurst(window.innerWidth / 2, window.innerHeight / 2, 40);
    brightenAllFairyLights();
    safePlay(dom.chimeSound, 0.8);

    const zoomTarget = dom.mainContent;

    const proceed = () => {
      dom.flashOverlay.classList.add('is-active');
      setTimeout(() => {
        window.location.href = STATE.redirectUrl;
      }, 1200);
    };

    if (STATE.hasGSAP && !STATE.prefersReducedMotion) {
      window.gsap.to(zoomTarget, {
        scale: 1.06,
        filter: 'brightness(1.25)',
        duration: 1.1,
        ease: 'power1.inOut',
        onComplete: proceed
      });
    } else {
      setTimeout(proceed, 900);
    }
  }

  /* ------------------------------------------------------------------ *
   * 10. MUSIC TOGGLE
   * ------------------------------------------------------------------ */
  function bindMusicToggle() {
    if (!dom.musicToggle || !dom.bgMusic) return;

    dom.musicToggle.addEventListener('click', () => {
      STATE.musicPlaying = !STATE.musicPlaying;
      dom.musicToggle.setAttribute('aria-pressed', String(STATE.musicPlaying));
      dom.musicToggle.setAttribute(
        'aria-label',
        STATE.musicPlaying ? 'Pause ambient piano music' : 'Play ambient piano music'
      );

      if (STATE.musicPlaying) {
        dom.bgMusic.volume = 0;
        safePlay(dom.bgMusic);
        tween(dom.bgMusic, { volume: 0.45, duration: 1.4 });
      } else {
        if (STATE.hasGSAP) {
          window.gsap.to(dom.bgMusic, {
            volume: 0,
            duration: 0.8,
            onComplete: () => dom.bgMusic.pause()
          });
        } else {
          dom.bgMusic.pause();
        }
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 11. INIT
   * ------------------------------------------------------------------ */
  function init() {
    createParticles();
    createFireflies();
    animateFairyLights();
    bindModalEvents();
    bindMusicToggle();
    initLoading();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();