(() => {
  'use strict';

  /* -------------------------------------------------------------------
     CONFIG
     ------------------------------------------------------------------- */
  const MAGIC_WORD = 'wonder';
  const NEXT_CHAPTER_URL = 'chapter2.html';
  const HAS_GSAP = typeof window.gsap !== 'undefined';
  
  const unlockSound = new Audio("audio/magic.mp3");
  unlockSound.preload = "auto";
  unlockSound.volume = 0.7;

  /* -------------------------------------------------------------------
     ELEMENT REFERENCES
     ------------------------------------------------------------------- */
  const starField = document.getElementById('starField');
  const fireflyField = document.getElementById('fireflyField');
  const chapterStage = document.getElementById('chapterStage');
  const glassCard = document.getElementById('glassCard');
  const lockIcon = document.querySelector('.lock-icon');
  const form = document.getElementById('passwordForm');
  const inputWrap = document.getElementById('inputWrap');
  const input = document.getElementById('magicWord');
  const errorMessage = document.getElementById('errorMessage');
  const unlockBtn = document.getElementById('unlockBtn');
  const successOverlay = document.getElementById('successOverlay');
  const goldenLight = document.getElementById('goldenLight');
  const heartsContainer = document.getElementById('heartsContainer');
  const flash = document.getElementById('flash');

  let wrongMessageTimer = null;
  let isUnlocking = false;

  /* =====================================================================
     BACKGROUND GENERATION
     ===================================================================== */

  function buildStars(count = 90) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement('span');
      star.className = 'star';
      const size = (Math.random() * 2 + 1).toFixed(1);
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${(Math.random() * 100).toFixed(2)}%`;
      star.style.top = `${(Math.random() * 100).toFixed(2)}%`;
      star.style.setProperty('--o', (Math.random() * 0.5 + 0.4).toFixed(2));
      star.style.setProperty('--dur', `${(Math.random() * 3 + 3).toFixed(1)}s`);
      star.style.setProperty('--delay', `${(Math.random() * 5).toFixed(1)}s`);
      fragment.appendChild(star);
    }
    starField.appendChild(fragment);
  }

  function buildFireflies(count = 14) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const fly = document.createElement('span');
      fly.className = 'firefly';
      fly.style.left = `${(Math.random() * 90 + 5).toFixed(2)}%`;
      fly.style.top = `${(Math.random() * 70 + 20).toFixed(2)}%`;
      fly.style.setProperty('--dur', `${(Math.random() * 6 + 9).toFixed(1)}s`);
      fly.style.setProperty('--delay', `${(Math.random() * 8).toFixed(1)}s`);
      fly.style.setProperty('--dx', `${(Math.random() * 80 - 40).toFixed(0)}px`);
      fly.style.setProperty('--dy', `${(Math.random() * -80 - 20).toFixed(0)}px`);
      fly.style.setProperty('--dx2', `${(Math.random() * 100 - 50).toFixed(0)}px`);
      fly.style.setProperty('--dy2', `${(Math.random() * -160 - 40).toFixed(0)}px`);
      fragment.appendChild(fly);
    }
    fireflyField.appendChild(fragment);
  }

  /* =====================================================================
     SOUND — lightweight synth for errors
     ===================================================================== */

  function playTone(frequencies, { duration = 0.5, type = 'sine', gain = 0.05 } = {}) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        const start = now + index * 0.09;
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(gain, start + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gainNode).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.05);
      });
      setTimeout(() => ctx.close(), (duration + frequencies.length * 0.09) * 1000 + 200);
    } catch (err) {}
  }

  function playErrorTone() {
    playTone([196, 174.6], { duration: 0.35, type: 'sine', gain: 0.04 });
  }

  /* =====================================================================
     PASSWORD SEQUENCES
     ===================================================================== */

  function showWrongPassword() {
    playErrorTone();
    inputWrap.classList.remove('is-wrong');
    void inputWrap.offsetWidth;
    inputWrap.classList.add('is-wrong');
    errorMessage.textContent = "Hmm... That doesn't feel like the right word...";
    errorMessage.classList.add('is-visible');
    if (HAS_GSAP) {
      gsap.fromTo(glassCard, { x: 0 }, { x: 6, duration: 0.06, repeat: 6, yoyo: true, ease: 'power1.inOut', clearProps: 'x' });
    }
    clearTimeout(wrongMessageTimer);
    wrongMessageTimer = setTimeout(() => {
      errorMessage.classList.remove('is-visible');
      inputWrap.classList.remove('is-wrong');
    }, 3000);
  }

  function spawnHearts(count = 22) {
    for (let i = 0; i < count; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.innerHTML = `<img src="images/heart.png" class="heart-img" alt=""><img src="images/spark.png" class="spark-img" alt="">`;
      const size = 18 + Math.random() * 22;
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 220 + 80;
      heart.style.setProperty('--hx', `${Math.cos(angle) * distance}px`);
      heart.style.setProperty('--hy', `${Math.sin(angle) * distance}px`);
      heart.style.animationDelay = `${i * 0.03}s`;
      heartsContainer.appendChild(heart);
      setTimeout(() => heart.remove(), 1600);
    }
  }

  function goToNextChapter() { window.location.href = NEXT_CHAPTER_URL; }

  function playSuccessSequence() {
    if (isUnlocking) return;
    isUnlocking = true;
    input.disabled = true;
    unlockBtn.disabled = true;
    unlockBtn.style.animation = "none";
    document.body.style.pointerEvents = "none";
    errorMessage.classList.remove('is-visible');

    unlockSound.currentTime = 0;
    unlockSound.volume = 0.7;
    unlockSound.play().catch(() => {});

    if (HAS_GSAP) {
      gsap.timeline()
        .to(glassCard, { x: -5, duration: 0.05, repeat: 5, yoyo: true, ease: 'power1.inOut' })
        .to(glassCard, { scale: 1.03, duration: 0.3, ease: 'back.out(2)' }, '+=0.05')
        .to(glassCard, { opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.45');
    } else {
      glassCard.classList.add('is-wrong');
      setTimeout(() => {
        glassCard.style.transition = 'opacity .5s ease, transform .5s ease';
        glassCard.style.transform = 'scale(1.03)';
      }, 300);
      setTimeout(() => glassCard.style.opacity = '0', 800);
    }

    successOverlay.classList.add('is-active');
    setTimeout(() => lockIcon.classList.add('is-unlocking'), 300);
    setTimeout(() => {
      goldenLight.classList.add('is-expanding');
      spawnHearts();
    }, 700);
    setTimeout(() => flash.classList.add('is-flashing'), 1900);
    setTimeout(() => chapterStage.classList.add('is-zooming'), 2100);
    
    // Audio Fade out
    if (HAS_GSAP) {
      gsap.to(unlockSound, {
        volume: 0,
        duration: 0.9,
        ease: "none",
        delay: 2.4
      });
    } else {
      setTimeout(() => { unlockSound.volume = 0.5; }, 2400);
      setTimeout(() => { unlockSound.volume = 0.3; }, 2700);
      setTimeout(() => { unlockSound.volume = 0.1; }, 3000);
    }
    
    setTimeout(() => {
        unlockSound.pause();
        unlockSound.currentTime = 0;
        goToNextChapter();
    }, 3300);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isUnlocking) return;
    const value = input.value.trim().toLowerCase();
    if (value === MAGIC_WORD) playSuccessSequence();
    else showWrongPassword();
  }

  function init() {
    buildStars();
    buildFireflies();
    unlockSound.load();
    form.addEventListener('submit', handleSubmit);
    input.addEventListener('input', () => inputWrap.classList.remove('is-wrong'));
    if (HAS_GSAP) gsap.from('.card', { duration: 0, opacity: 1 });
  }

  document.addEventListener('DOMContentLoaded', init);
})();