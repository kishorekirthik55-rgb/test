/* =============================================================
   CHAPTER FOUR — "THE FLOATING LETTERS"
   Production JavaScript. Vanilla + GSAP (optional enhancement).
   No global scope pollution — everything runs inside one IIFE.
============================================================= */

(function chapterFourController() {
  "use strict";

  /* -----------------------------------------------------------
     0. GUARD — only run on this chapter's markup
  ----------------------------------------------------------- */
  if (!document.body || !document.body.classList.contains("chapter-four")) {
    return;
  }

  /* -----------------------------------------------------------
     1. ENVIRONMENT CAPABILITIES
  ----------------------------------------------------------- */
  const hasGSAP = typeof window.gsap !== "undefined";
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -----------------------------------------------------------
     2. DOM REFERENCES
  ----------------------------------------------------------- */
  const dom = {
    loadingOverlay: document.getElementById("loadingOverlay"),
    flashOverlay: document.getElementById("flashOverlay"),
    starsLayer: document.getElementById("starsLayer"),
    particlesLayer: document.getElementById("particlesLayer"),
    firefliesLayer: document.getElementById("firefliesLayer"),
    musicToggle: document.getElementById("musicToggle"),
    ambientAudio: document.getElementById("ambientAudio"),
    openSound: document.getElementById("openSound"),
    sparkleSound: document.getElementById("sparkleSound"),
    envelopeList: document.getElementById("envelopeList"),
    popupBackdrop: document.getElementById("popupBackdrop"),
    popup: document.getElementById("letterPopup"),
    popupType: document.getElementById("popupType"),
    popupTitle: document.getElementById("popupTitle"),
    popupBody: document.getElementById("popupBody"),
    popupClose: document.getElementById("popupClose"),
    popupSparkles: document.getElementById("popupSparkles"),
    continueButton: document.getElementById("continueButton"),
    continueNote: document.getElementById("continueNote"),
    chapterFiveLink: document.getElementById("chapterFiveLink"),
    mainContent: document.getElementById("mainContent"),
  };

  const envelopes = dom.envelopeList
    ? Array.from(dom.envelopeList.querySelectorAll(".envelope"))
    : [];

  /* -----------------------------------------------------------
     3. STATE
  ----------------------------------------------------------- */
  const state = {
    openedLetters: new Set(),
    totalLetters: envelopes.length,
    musicPlaying: false,
    popupOpen: false,
    lastFocusedElement: null,
    finalLetterOpened: false,
  };

  /* -----------------------------------------------------------
     4. UTILITIES
  ----------------------------------------------------------- */
  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function safePlay(audioEl) {
    if (!audioEl) return Promise.resolve();
    const playPromise = audioEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      return playPromise.catch(() => {
        /* Autoplay or missing asset — fail silently, no console noise for the user */
      });
    }
    return Promise.resolve();
  }

  function fadeAudio(audioEl, targetVolume, duration) {
    if (!audioEl) return;
    const startVolume = audioEl.volume;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      audioEl.volume = Math.max(
        0,
        Math.min(
          1,
          startVolume + (targetVolume - startVolume) * progress
        )
      );
      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (targetVolume === 0) {
        audioEl.pause();
      }
    }
    requestAnimationFrame(step);
  }

  /* -----------------------------------------------------------
     5. LOADING SCREEN
  ----------------------------------------------------------- */
  function initLoadingScreen() {
    if (!dom.loadingOverlay) return;

    const finishLoading = () => {
      dom.loadingOverlay.setAttribute("data-hidden", "true");
      window.setTimeout(() => {
        if (dom.loadingOverlay.parentNode) {
          dom.loadingOverlay.setAttribute("aria-hidden", "true");
        }
      }, 900);
    };

    if (document.readyState === "complete") {
      window.setTimeout(finishLoading, 700);
    } else {
      window.addEventListener("load", () => {
        window.setTimeout(finishLoading, 700);
      });
    }
  }

  /* -----------------------------------------------------------
     6. PARTICLE GENERATION (ambient gold motes)
  ----------------------------------------------------------- */
  function generateParticles(count) {
    if (!dom.particlesLayer || prefersReducedMotion) return;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      const size = randomBetween(2, 4);
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${randomBetween(0, 100)}%`;
      particle.style.bottom = `${randomBetween(-10, 0)}%`;
      particle.style.setProperty("--drift", `${randomBetween(-30, 30)}px`);
      particle.style.animationDuration = `${randomBetween(9, 18)}s`;
      particle.style.animationDelay = `${randomBetween(0, 12)}s`;
      fragment.appendChild(particle);
    }

    dom.particlesLayer.appendChild(fragment);
  }

  /* -----------------------------------------------------------
     7. FIREFLY GENERATION
  ----------------------------------------------------------- */
  function generateFireflies(count) {
    if (!dom.firefliesLayer || prefersReducedMotion) return;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const firefly = document.createElement("span");
      firefly.className = "firefly";
      firefly.style.left = `${randomBetween(5, 95)}%`;
      firefly.style.top = `${randomBetween(10, 90)}%`;
      firefly.style.setProperty("--drift-x", `${randomBetween(-60, 60)}px`);
      firefly.style.setProperty("--drift-y", `${randomBetween(-50, 50)}px`);
      firefly.style.animationDuration = `${randomBetween(5, 10)}s, ${randomBetween(2, 4)}s`;
      firefly.style.animationDelay = `${randomBetween(0, 5)}s`;
      fragment.appendChild(firefly);
    }

    dom.firefliesLayer.appendChild(fragment);
  }

  /* -----------------------------------------------------------
     8. FLOATING ENVELOPE — RANDOM DRIFT ENHANCEMENT
     (CSS handles the base float loop; GSAP adds organic,
      non-repeating drift so the field never feels mechanical)
  ----------------------------------------------------------- */
  function enhanceEnvelopeDrift() {
    if (!hasGSAP || prefersReducedMotion) return;

    envelopes.forEach((envelope) => {
      const xDrift = randomBetween(-8, 8);
      const duration = randomBetween(4, 7);

      gsap.to(envelope, {
        x: xDrift,
        duration,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: randomBetween(0, 2),
      });
    });
  }

  /* -----------------------------------------------------------
     9. ENVELOPE HOVER EFFECTS
     (Lift/rotate/glow are pure CSS via :hover and :focus-visible;
      this section only adds a subtle sparkle puff on hover-in)
  ----------------------------------------------------------- */
  function attachHoverSparkle() {
    if (prefersReducedMotion) return;

    envelopes.forEach((envelope) => {
      let hoverTimeout = null;

      envelope.addEventListener("pointerenter", () => {
        window.clearTimeout(hoverTimeout);
        hoverTimeout = window.setTimeout(() => {
          spawnSparkles(envelope, 3);
        }, 120);
      });

      envelope.addEventListener("pointerleave", () => {
        window.clearTimeout(hoverTimeout);
      });
    });
  }

  function spawnSparkles(anchorEl, count) {
    if (prefersReducedMotion) return;
    const rect = anchorEl.getBoundingClientRect();
    const container = dom.popupSparkles;
    if (!container) return;

    for (let i = 0; i < count; i += 1) {
      const sparkle = document.createElement("span");
      sparkle.className = "sparkle";
      sparkle.style.left = `${randomBetween(20, 80)}%`;
      sparkle.style.top = `${randomBetween(20, 80)}%`;
      sparkle.style.setProperty("--sx", `${randomBetween(-40, 40)}px`);
      sparkle.style.setProperty("--sy", `${randomBetween(-40, 40)}px`);
      container.appendChild(sparkle);
      window.setTimeout(() => sparkle.remove(), 1000);
    }

    void rect; /* reserved for future viewport-relative sparkle placement */
  }

  /* -----------------------------------------------------------
     10. FOCUS TRAP (for the modal dialog)
  ----------------------------------------------------------- */
  function getFocusableElements(container) {
    const selector =
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)).filter(
      (el) => el.offsetParent !== null
    );
  }

  function trapFocus(event) {
    if (!state.popupOpen || event.key !== "Tab") return;
    const focusable = getFocusableElements(dom.popup);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* -----------------------------------------------------------
     11. GLASS POPUP — OPEN / CLOSE
  ----------------------------------------------------------- */
  function openPopup(envelope) {
    if (!dom.popup || !dom.popupBackdrop) return;

    const title = envelope.dataset.title || "A Letter";
    const type = envelope.dataset.type || "Letter";
    const letterText = envelope.dataset.letter || "";
    const isFinal = envelope.dataset.final === "true";

    dom.popupType.textContent = type;
    dom.popupTitle.textContent = title;
    dom.popupBody.textContent = letterText;

    state.lastFocusedElement = document.activeElement;
    state.popupOpen = true;

    dom.popupBackdrop.hidden = false;
    dom.popup.hidden = false;
    document.body.setAttribute("data-popup-open", "true");

    window.requestAnimationFrame(() => {
      dom.popupClose.focus();
    });

    document.addEventListener("keydown", handleKeydown);

    // Trigger sparkles after popup opens
    window.setTimeout(() => {
      spawnSparkles(dom.popup, 8);
    }, 300);
  }

  function closePopup() {
    if (!dom.popup || !dom.popupBackdrop) return;

    state.popupOpen = false;
    dom.popup.hidden = true;
    dom.popupBackdrop.hidden = true;
    document.body.removeAttribute("data-popup-open");

    document.removeEventListener("keydown", handleKeydown);

    if (
      state.lastFocusedElement &&
      typeof state.lastFocusedElement.focus === "function"
    ) {
      state.lastFocusedElement.focus();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      closePopup();
      return;
    }
    trapFocus(event);
  }

  /* -----------------------------------------------------------
     12. LETTER OPENING ANIMATION + SOUND
  ----------------------------------------------------------- */
  function playLetterOpenAnimation(envelope, isFinal) {
    // Start the opening animation
    envelope.setAttribute("data-opening", "true");

    // Play sounds
    safePlay(dom.openSound);
    safePlay(dom.sparkleSound);

    if (!state.musicPlaying) {
      dom.ambientAudio.volume = 0;
      safePlay(dom.ambientAudio).then(() => {
        fadeAudio(dom.ambientAudio, 1, 2000);
        state.musicPlaying = true;
        dom.musicToggle.setAttribute("aria-pressed", "true");
        dom.musicToggle.setAttribute(
          "aria-label",
          "Pause ambient music"
        );
      });
    }

    // Spawn sparkles at the envelope
    spawnSparkles(envelope, 6);

    // Wait for animation to complete, then open popup
    window.setTimeout(() => {
      // Remove the opening state but keep it marked as opened
      envelope.removeAttribute("data-opening");
      envelope.setAttribute("data-opened", "true");

      // Now open the popup
      openPopup(envelope);

      // Register the letter as opened
      registerLetterOpened(envelope, isFinal);

      if (hasGSAP && !prefersReducedMotion) {
        gsap.fromTo(
          dom.popup.querySelector(".glass-popup__paper"),
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        );
      }
    }, 700);
  }

  /* -----------------------------------------------------------
     13. PROGRESS TRACKING + FINAL ENVELOPE DETECTION
  ----------------------------------------------------------- */
  function registerLetterOpened(envelope, isFinal) {
    state.openedLetters.add(envelope.id);

    const remaining = state.totalLetters - state.openedLetters.size;
    if (dom.continueNote) {
      dom.continueNote.textContent =
        remaining > 0
          ? `${remaining} letter${remaining === 1 ? "" : "s"} left to open.`
          : "Every letter has been read.";
    }

    if (isFinal && !state.finalLetterOpened) {
      state.finalLetterOpened = true;
      triggerFinalEnvelopeSequence();
    }

    if (state.openedLetters.size === state.totalLetters) {
      unlockContinueButton();
    }
  }

  function unlockContinueButton() {
    if (!dom.continueButton) return;
    dom.continueButton.disabled = false;
    dom.continueButton.removeAttribute("aria-disabled");
  }

  /* -----------------------------------------------------------
     14. FINAL ENVELOPE SEQUENCE
     Golden sparkle explosion, brighter sky, stronger fireflies.
  ----------------------------------------------------------- */
  function triggerFinalEnvelopeSequence() {
    document.body.setAttribute("data-sky-state", "radiant");
    spawnSparkles(dom.popup, 24);

    if (hasGSAP && !prefersReducedMotion) {
      gsap.fromTo(
        dom.popup,
        { boxShadow: "0 0 0 rgba(255, 217, 142, 0)" },
        {
          boxShadow: "0 0 80px 20px rgba(255, 217, 142, 0.55)",
          duration: 1.2,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
        }
      );
    }
  }

  /* -----------------------------------------------------------
     15. CHAPTER TRANSITION (white flash + redirect)
  ----------------------------------------------------------- */
  function goToChapterFive() {
    if (!dom.flashOverlay || !dom.chapterFiveLink) return;
    const destination = dom.chapterFiveLink.getAttribute("href");

    fadeAudio(dom.ambientAudio, 0, 500);
    dom.flashOverlay.setAttribute("data-active", "true");

    const delay = prefersReducedMotion ? 50 : 900;
    window.setTimeout(() => {
      window.location.href = destination;
    }, delay);
  }

  /* -----------------------------------------------------------
     16. MUSIC TOGGLE
  ----------------------------------------------------------- */
  function initMusicToggle() {
    if (!dom.musicToggle || !dom.ambientAudio) return;

    dom.ambientAudio.volume = 0;

    dom.musicToggle.addEventListener("click", () => {
      state.musicPlaying = !state.musicPlaying;
      dom.musicToggle.setAttribute("aria-pressed", String(state.musicPlaying));
      dom.musicToggle.setAttribute(
        "aria-label",
        state.musicPlaying ? "Pause ambient music" : "Play ambient music"
      );

      if (state.musicPlaying) {
        safePlay(dom.ambientAudio).then(() => {
          fadeAudio(dom.ambientAudio, 1, 800);
        });
      } else {
        fadeAudio(dom.ambientAudio, 0, 500);
      }
    });
  }

  /* -----------------------------------------------------------
     17. EVENT WIRING — ENVELOPES, POPUP, CONTINUE
  ----------------------------------------------------------- */
  function initEnvelopeEvents() {
    envelopes.forEach((envelope) => {
      envelope.addEventListener("click", function(e) {
        // Prevent opening if already opened
        if (this.hasAttribute("data-opened")) return;
        playLetterOpenAnimation(this, this.dataset.final === "true");
      });
    });
  }

  function initPopupEvents() {
    if (dom.popupClose) {
      dom.popupClose.addEventListener("click", closePopup);
    }
    if (dom.popupBackdrop) {
      dom.popupBackdrop.addEventListener("click", closePopup);
    }
  }

  function initContinueButton() {
    if (!dom.continueButton) return;
    dom.continueButton.addEventListener("click", () => {
      if (dom.continueButton.disabled) return;
      goToChapterFive();
    });
  }

  /* -----------------------------------------------------------
     18. BOOTSTRAP
  ----------------------------------------------------------- */
  function init() {
    initLoadingScreen();
    generateParticles(28);
    generateFireflies(14);
    enhanceEnvelopeDrift();
    attachHoverSparkle();

    initMusicToggle();
    initEnvelopeEvents();
    initPopupEvents();
    initContinueButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();