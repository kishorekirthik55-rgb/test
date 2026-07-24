/* =========================================================
   CHAPTER TWO — "A Sky Full of Us"
   Interaction & animation layer
   ========================================================= */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => Math.random() * (max - min) + min;

  /* =========================================================
     MEMORY CONTENT
     ========================================================= */

  const MEMORIES = {
    1: {
      eyebrow: 'Memory One',
      title: 'A Photograph',
      type: 'image',
      image: 'images/memory-1.jpg',
      desc: 'This is the moment I keep coming back to — the light was ordinary, but the way you laughed made it feel like it had been waiting all day just for us.'
    },
    2: {
      eyebrow: 'Memory Two',
      title: 'Something You Said',
      type: 'quote',
      desc: '"I don\u2019t know what it is about you, but everything feels lighter when you\u2019re around." You said it so quietly, like it wasn\u2019t supposed to be a big deal. It was.'
    },
    3: {
      eyebrow: 'Memory Three',
      title: 'A Voice, Kept Safe',
      type: 'audio',
      audioLabel: 'Play the message',
      desc: 'I saved this the day you left it. Some nights I still listen just to hear you say my name.'
    },
    4: {
      eyebrow: 'Memory Four',
      title: 'Somewhere We Haven\u2019t Been Yet',
      type: 'text',
      desc: 'A kitchen too small for both of us, arguing over which shelf the mugs go on. Mornings that start slow. A door that always opens to you. I\u2019m already homesick for it.'
    },
    5: {
      eyebrow: 'Memory Five',
      title: 'The One That Still Makes Me Laugh',
      type: 'text',
      desc: 'You will deny this story forever, and I will tell it forever, and somewhere in between is exactly where we live.'
    },
    6: {
      eyebrow: 'Memory Six',
      title: 'A Letter',
      type: 'text',
      desc: 'If I had to choose every star in this sky again, one by one, I would still choose the ones that led me to you. Thank you for being the softest place I know.'
    },
    7: {
      eyebrow: 'Memory Seven',
      title: 'A Hidden Surprise',
      type: 'text',
      desc: 'You found it. This one isn\u2019t a memory yet — it\u2019s a promise. Ask me about it tonight.'
    },
    8: {
      eyebrow: 'Final Star',
      title: 'The Chapter Ahead',
      type: 'final',
      desc: 'Every star you just touched was a page. This next one turns into something bigger. Are you ready?'
    }
  };

  /* =========================================================
     BACKGROUND: STARFIELD
     ========================================================= */

  function buildStarfield() {
    const field = document.getElementById('starfield');
    const frag = document.createDocumentFragment();
    const count = reduceMotion ? 60 : 150;

    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'star-point';
      const size = rand(1, 2.6);
      star.style.left = rand(0, 100) + '%';
      star.style.top = rand(0, 78) + '%';
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.opacity = rand(0.2, 0.9).toFixed(2);

      if (!reduceMotion) {
        const duration = rand(2, 6);
        star.animate(
          [
            { opacity: rand(0.15, 0.4) },
            { opacity: rand(0.6, 1) },
            { opacity: rand(0.15, 0.4) }
          ],
          { duration: duration * 1000, iterations: Infinity, easing: 'ease-in-out', delay: rand(0, 3000) }
        );
      }
      frag.appendChild(star);
    }
    field.appendChild(frag);
  }

  /* =========================================================
     BACKGROUND: FIREFLIES
     ========================================================= */

  function buildFireflies() {
    if (reduceMotion) return;
    const layer = document.getElementById('fireflies');
    const frag = document.createDocumentFragment();
    const count = 22;

    for (let i = 0; i < count; i++) {
      const fly = document.createElement('span');
      fly.className = 'firefly';
      const startX = rand(0, 100);
      const startY = rand(30, 95);
      fly.style.left = startX + '%';
      fly.style.top = startY + '%';
      fly.style.opacity = '0';
      frag.appendChild(fly);
      wanderFirefly(fly);
    }
    layer.appendChild(frag);
  }

  function buildForegroundFireflies() {
    if (reduceMotion) return;
    const layer = document.getElementById('fireflies');
    const frag = document.createDocumentFragment();
    const count = 5;

    for (let i = 0; i < count; i++) {
      const fly = document.createElement('span');
      fly.className = 'firefly firefly--foreground';
      fly.style.left = rand(0, 100) + '%';
      fly.style.top = rand(30, 95) + '%';
      fly.style.opacity = '0';
      frag.appendChild(fly);
      wanderFirefly(fly);
    }
    layer.appendChild(frag);
  }

  function wanderFirefly(el) {
    const move = () => {
      const dx = rand(-8, 8);
      const dy = rand(-8, 8);
      const dur = rand(4, 8);
      gsap.to(el, {
        x: `+=${dx}vw`,
        y: `+=${dy}vh`,
        opacity: rand(0.15, 0.85),
        duration: dur,
        ease: 'sine.inOut',
        onComplete: move
      });
    };
    gsap.set(el, { x: 0, y: 0 });
    move();
  }

  /* =========================================================
     BACKGROUND: LANTERNS
     ========================================================= */

  function buildLanterns() {
    const layer = document.getElementById('lanterns');
    const frag = document.createDocumentFragment();
    const count = 22;
    const lanternEls = [];

    for (let i = 0; i < count; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'lantern';
      const img = document.createElement('img');
      img.src = 'images/lantern.png';
      img.alt = '';
      img.draggable = false;
      wrap.appendChild(img);

      const depth = rand(0.4, 1); // 0.4 = far, 1 = close
      const size = 20 + depth * 58; // px
      wrap.style.width = size + 'px';
      wrap.style.left = rand(0, 96) + '%';
      wrap.style.opacity = (depth - 0.1).toFixed(2);
      wrap.style.filter = `blur(${(1 - depth) * 2.2}px)`;

      frag.appendChild(wrap);
      lanternEls.push({ el: wrap, depth });

      // Flame flicker — gentle brightness pulse per lantern
      gsap.to(wrap, {
        filter: `brightness(${rand(1.05, 1.12)})`,
        duration: rand(1.4, 2.4),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
    }
    layer.appendChild(frag);

    if (reduceMotion) {
      lanternEls.forEach(({ el }) => { el.style.bottom = rand(10, 70) + '%'; });
      return;
    }

    lanternEls.forEach(({ el, depth }) => riseLantern(el, depth));
  }

  function riseLantern(el, depth) {
    const duration = rand(18, 34) / depth; // slower & farther for distant lanterns
    gsap.set(el, { bottom: '-12%', x: 0 });
    gsap.to(el, {
      bottom: '112%',
      x: `+=${rand(-6, 6)}vw`,
      duration,
      ease: 'none',
      delay: rand(0, 12),
      onComplete: () => {
        gsap.set(el, { left: rand(0, 96) + '%' });
        riseLantern(el, depth);
      }
    });
  }

  /* =========================================================
     BACKGROUND: SHOOTING STARS
     ========================================================= */

  function spawnShootingStar() {
    const layer = document.getElementById('shootingStars');
    const star = document.createElement('div');
    star.className = 'shooting-star';

    const startX = rand(10, 90);
    const startY = rand(0, 35);
    const angle = rand(20, 50);
    const distance = rand(220, 420);
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * distance;
    const dy = Math.sin(rad) * distance;

    star.style.left = startX + '%';
    star.style.top = startY + '%';
    star.style.transform = `rotate(${angle}deg)`;
    layer.appendChild(star);

    gsap.fromTo(
      star,
      { opacity: 0, x: 0, y: 0 },
      {
        opacity: 1,
        duration: 0.15,
        onComplete: () => {
          gsap.to(star, {
            x: dx,
            y: dy,
            opacity: 0,
            duration: rand(0.9, 1.4),
            ease: 'power1.out',
            onComplete: () => star.remove()
          });
        }
      }
    );
  }

  function scheduleShootingStars() {
    if (reduceMotion) return;
    const next = () => {
      spawnShootingStar();
      if (Math.random() > 0.6) {
        setTimeout(spawnShootingStar, rand(150, 500));
      }
      setTimeout(next, rand(8000, 15000));
    };
    setTimeout(next, rand(3000, 8000));
  }

  /* =========================================================
     BACKGROUND: MOONLIGHT SHIMMER
     ========================================================= */

  function moonShimmer() {
    if (reduceMotion) return;
    const moonGlow = document.querySelector('.moon-glow');

    function shimmer() {
      gsap.to(moonGlow, {
        opacity: 1,
        scale: 1.08,
        duration: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
        onComplete() {
          setTimeout(shimmer, rand(15000, 25000));
        }
      });
    }

    setTimeout(shimmer, 8000);
  }

  /* =========================================================
     SPARKLE BURST (on star click)
     ========================================================= */

  function sparkleBurst(x, y) {
    const layer = document.getElementById('sparkleLayer');
    const frag = document.createDocumentFragment();
    const count = reduceMotion ? 6 : 18;

    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      const isGold = Math.random() > 0.5;
      const size = rand(2, 5);
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.background = isGold ? 'var(--gold)' : '#ffffff';
      s.style.boxShadow = isGold
        ? '0 0 6px 1px rgba(244,211,116,0.9)'
        : '0 0 6px 1px rgba(255,255,255,0.9)';
      frag.appendChild(s);

      const angle = rand(0, Math.PI * 2);
      const dist = rand(30, 90);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      gsap.fromTo(
        s,
        { opacity: 1, scale: 0 },
        {
          opacity: 0,
          scale: 1,
          x: dx,
          y: dy,
          duration: rand(0.6, 1.1),
          ease: 'power2.out',
          onComplete: () => s.remove()
        }
      );
    }
    layer.appendChild(frag);
  }

  /* =========================================================
     ENTRANCE SEQUENCE
     ========================================================= */

  function playEntranceSequence(onComplete) {
    const overlay = document.getElementById('entranceOverlay');
    const moonWrap = document.querySelector('.moon-wrap');
    const cloudsLayer = document.querySelector('.clouds');
    const lanternsLayer = document.getElementById('lanterns');

    if (reduceMotion) {
      gsap.set(overlay, { opacity: 0, display: 'none' });
      gsap.set([moonWrap, cloudsLayer, lanternsLayer], { opacity: 1 });
      buildLanterns();
      onComplete();
      return;
    }

    gsap.set(moonWrap, { opacity: 0 });
    gsap.set(cloudsLayer, { opacity: 0 });
    gsap.set(lanternsLayer, { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { display: 'none' });
        onComplete();
      }
    });

    tl.to(overlay, { opacity: 0, duration: 1.2, ease: 'power2.out' }, 0);
    tl.to(moonWrap, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.6);
    tl.to(cloudsLayer, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 1.2);
    tl.call(() => { buildLanterns(); }, null, 2.0);
    tl.to(lanternsLayer, { opacity: 1, duration: 1, ease: 'power2.out' }, 2.0);
  }

  /* =========================================================
     HERO NARRATIVE
     ========================================================= */

  function playHeroSequence() {
    const panel = document.querySelector('.hero__panel');
    const lineTwo = document.getElementById('heroLineTwo');
    const full = 'Touch a star.';

    gsap.to(panel, { opacity: 1, y: 0, duration: 1.6, ease: 'power2.out', delay: 0.4 });

    setTimeout(() => {
      let i = 0;
      const typeNext = () => {
        if (i <= full.length) {
          lineTwo.textContent = full.slice(0, i);
          i++;
          setTimeout(typeNext, reduceMotion ? 0 : 55);
        } else {
          lineTwo.classList.add('done');
        }
      };
      typeNext();
    }, 2000);
  }

  /* =========================================================
     POPUP
     ========================================================= */

  const backdrop = document.getElementById('popupBackdrop');
  const popup = document.getElementById('popup');
  const popupEyebrow = document.getElementById('popupEyebrow');
  const popupTitle = document.getElementById('popupTitle');
  const popupDesc = document.getElementById('popupDesc');
  const popupMedia = document.getElementById('popupMedia');
  const popupClose = document.getElementById('popupClose');
  const voiceAudio = document.getElementById('voiceMemory');

  let lastFocusedStar = null;

  function openPopup(memory, starEl) {
    lastFocusedStar = starEl;

    if (popupSound) {
        popupSound.currentTime = 0;
        popupSound.play().catch(() => {});
    }

    // Popup parallax — background sky nudges slightly
    gsap.to('.sky', {
      x: 4,
      y: -3,
      duration: 0.45,
      ease: 'power2.out'
    });

    // Duck the background music while the memory takes center stage
    const music = document.getElementById('bgMusic');
    gsap.to(music, {
      volume: 0.12,
      duration: 0.4
    });

    popupEyebrow.textContent = memory.eyebrow;
    popupTitle.textContent = memory.title;
    popupDesc.textContent = memory.desc;
    popupMedia.innerHTML = '';

    if (memory.type === 'image' && memory.image) {
      const img = document.createElement('img');
      img.src = memory.image;
      img.alt = memory.title;
      popupMedia.appendChild(img);
    }

    if (memory.type === 'audio') {
      const player = document.createElement('div');
      player.className = 'voice-player';
      player.innerHTML = `
        <button class="voice-player__btn" aria-label="${memory.audioLabel}" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        </button>
        <div class="voice-player__bars" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>`;
      popupMedia.appendChild(player);

      const btn = player.querySelector('.voice-player__btn');
      const playIcon = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
      const pauseIcon = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';

      btn.addEventListener('click', () => {
        if (voiceAudio.paused) {
          voiceAudio.currentTime = 0;
          voiceAudio.play().catch(() => {});
          btn.innerHTML = pauseIcon;
          player.classList.add('is-playing');
        } else {
          voiceAudio.pause();
          btn.innerHTML = playIcon;
          player.classList.remove('is-playing');
        }
      });
      voiceAudio.addEventListener('ended', () => {
        btn.innerHTML = playIcon;
        player.classList.remove('is-playing');
      }, { once: true });
    }

    backdrop.classList.add('is-open');
    gsap.set(backdrop, { display: 'flex' });
    gsap.to(backdrop, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(
      popup,
      { scale: 0.88, y: 20, filter: 'blur(6px)' },
      { scale: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'back.out(1.4)' }
    );

    document.addEventListener('keydown', onPopupKeydown);
    setTimeout(() => popup.focus(), 50);
  }

  function closePopup() {
    gsap.to(popup, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(backdrop, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        backdrop.classList.remove('is-open');
        gsap.set(backdrop, { display: 'none' });
        gsap.set(popup, { opacity: 1 });
        if (!voiceAudio.paused) voiceAudio.pause();
      }
    });
    document.removeEventListener('keydown', onPopupKeydown);
    if (lastFocusedStar) lastFocusedStar.focus();

    // Reset popup parallax
    gsap.to('.sky', {
      x: 0,
      y: 0,
      duration: 0.45,
      ease: 'power2.out'
    });

    // Bring the background music back up
    const music = document.getElementById('bgMusic');
    gsap.to(music, {
      volume: 0.35,
      duration: 0.5
    });
  }

  function onPopupKeydown(e) {
    if (e.key === 'Escape') closePopup();
  }

  popupClose.addEventListener('click', closePopup);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePopup();
  });

  /* =========================================================
     MEMORY STARS — INTERACTION
     ========================================================= */

  function initStars() {
    const stars = document.querySelectorAll('.memory-star');

    stars.forEach((star) => {
      star.addEventListener('click', (e) => {

        if (starSound) {
            starSound.currentTime = 0;
            starSound.play().catch(() => {});
        }

        const rect = star.getBoundingClientRect();
        sparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

        gsap.fromTo(
          star,
          { scale: 1 },
          { scale: 1.35, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 }
        );

        star.classList.add('memory-star--opened');

        const id = star.dataset.memory;
        const memory = MEMORIES[id];

        if (id === '8') {
          runFinale();
          return;
        }

        const moonGlow = document.querySelector('.moon-glow');
        const lanternEls = document.querySelectorAll('.lantern');
        const stage = document.querySelector('.sky');
        const preTl = gsap.timeline({
          onComplete: () => openPopup(memory, star)
        });
        preTl.to(moonGlow, { opacity: 1, scale: 1.15, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }, 0);
        preTl.to(lanternEls, { filter: 'brightness(1.6)', duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }, 0);
        preTl.to(stage, { scale: 1.02, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }, 0);
      });
    });
  }

  /* =========================================================
     FINALE SEQUENCE
     ========================================================= */

  function runFinale() {
    const moonGlow = document.querySelector('.moon-glow');
    const lanternEls = document.querySelectorAll('.lantern');
    const starPoints = document.querySelectorAll('.star-point');
    const flash = document.getElementById('flashOverlay');
    const stage = document.querySelector('.sky');
    const music = document.getElementById('bgMusic');

    const tl = gsap.timeline();

    // Moon glows brighter
    tl.to(moonGlow, { opacity: 1, scale: 1.4, duration: 1.6, ease: 'power2.out' }, 0);

    // Stars brighten
    tl.to(starPoints, { opacity: 1, duration: 1.2, ease: 'power1.out', stagger: 0.001 }, 0);

    // Lanterns speed up (retime their existing tweens)
    lanternEls.forEach((el) => {
      const tween = gsap.getTweensOf(el)[0];
      if (tween) gsap.to(tween, { timeScale: 4, duration: 0.8 });
    });

    // Camera slowly zooms
    tl.to(stage, { scale: 1.18, duration: 3.2, ease: 'power1.inOut' }, 0.2);

    // Fade the narrative + constellation away
    tl.to(['.hero__panel', '.constellation'], { opacity: 0, duration: 1, ease: 'power1.out' }, 1.4);

    // Fade out music
    if (music && !music.paused) {
      tl.to(music, { volume: 0, duration: 1.6, ease: 'power1.out' }, 1.6);
    }

    // Fade out wind ambience alongside the music
    const wind = document.getElementById('windSound');
    if (wind && !wind.paused) {
      tl.to(wind, { volume: 0, duration: 1.6, ease: 'power1.out' }, 1.6);
    }

    // Moon pulse right before the flash
    tl.to(moonGlow, { scale: 1.7, opacity: 1, duration: 0.4, ease: 'power2.out' }, 2.2);

    // White flash
    tl.to(flash, { opacity: 1, duration: 0.9, ease: 'power2.in' }, 2.6);

    tl.call(() => {
      window.location.href = 'chapter3.html';
    }, null, 3.7);
  }

  /* =========================================================
     MUSIC
     ========================================================= */

  function initMusic() {
    const music = document.getElementById('bgMusic');
    const wind = document.getElementById('windSound');
    const toggle = document.getElementById('soundToggle');
    const targetVolume = 0.35;
    music.volume = 0;
    wind.volume = 0.06;

    const tryPlay = () => {
      music.play().then(() => {
        gsap.to(music, { volume: targetVolume, duration: 2.5, ease: 'power1.out' });
        wind.play().catch(() => {});
      }).catch(() => {
        const resume = () => {
          music.play().then(() => {
            gsap.to(music, { volume: targetVolume, duration: 2.5, ease: 'power1.out' });
            wind.play().catch(() => {});
          }).catch(() => {});
          document.removeEventListener('click', resume);
          document.removeEventListener('keydown', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
      });
    };
    tryPlay();

    toggle.addEventListener('click', () => {
      const isOn = toggle.getAttribute('aria-pressed') === 'true';
      if (isOn) {
        gsap.to(music, { volume: 0, duration: 0.6 });
        toggle.setAttribute('aria-pressed', 'false');
      } else {
        gsap.to(music, { volume: targetVolume, duration: 0.6 });
        toggle.setAttribute('aria-pressed', 'true');
      }
    });

    window.addEventListener('pagehide', () => {
      music.volume = 0;
    });
  }

  /* =========================================================
     AUDIO REFERENCES
     ========================================================= */

  const starSound = document.getElementById('starSound');
  const popupSound = document.getElementById('popupSound');

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    buildStarfield();
    buildFireflies();
    buildForegroundFireflies();
    scheduleShootingStars();
    moonShimmer();
    initStars();
    initMusic();
    playEntranceSequence(() => {
      playHeroSequence();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();