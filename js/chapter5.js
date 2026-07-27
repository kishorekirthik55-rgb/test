'use strict';

(() => {
	/* ==================================================
	   1. CONFIGURATION
	================================================== */
	const CONFIG = {
		TOTAL_HEARTS: 20,
		STAR_COUNT: 90,
		PARTICLE_COUNT: 26,
		FIREFLY_COUNT: 14,
		BURST_PARTICLES_MIN: 8,
		BURST_PARTICLES_MAX: 16,
		FLIGHT_DURATION_MIN: 0.9,
		FLIGHT_DURATION_MAX: 1.3,
		FLASH_DURATION: 1000,
		MUSIC_FADE: 800,
		FINAL_PAUSE_MIN: 800,
		FINAL_PAUSE_MAX: 1200,
		HEART_EDGE_PADDING: 40,
		NEXT_CHAPTER_URL: 'chapter6.html',

		/* typewriter / trail tuning */
		TYPEWRITER_MS_MIN: 25,
		TYPEWRITER_MS_MAX: 40,
		TRAIL_INTERVAL_MS: 90,
		METER_PULSE_MS: 900,
		FINALE_DARKEN_MS: 1400,
		HAPTIC_PULSE_MS: 25
	};

	/* ==================================================
	   CINEMATIC HEARTBEAT + MEMORY SEQUENCE TUNING
	   A real emotional build: freeze the whole world ->
	   slow fade to near-black -> six slow heartbeats, each
	   one a full breathing cycle where the entire scene
	   (overlay, moon, stars, fog, fireflies) rises toward
	   light together with the heart and settles back into
	   darkness -> a held silence -> golden dust drifts in
	   -> typewriter memory -> a calm reading pause ->
	   dissolve -> fly to meter -> the whole world slowly
	   wakes back up. Nothing here blinks or flashes —
	   every stage is a tween, never a hard cut.
	================================================== */
	const CINEMATIC = {
		DARKEN_MS: 1100,           // 0% -> near-black, slow fade (not a flash)
		STAGE_OPACITY: 0.97,       // near-black baseline, never fully flat black

		BEAT_COUNT: 6,             // six slow heartbeats
		BEAT_PEAK_VISIBILITY: 0.72,// how much of the world becomes visible at the top of each beat
		BEAT_RISE_MS: 1000,         // dark -> peak (passes through ~35% / ~55% / ~70%)
		BEAT_FALL_MS: 1000,         // peak -> dark again
		BEAT_PAUSE_MS: 900,        // stillness between one beat ending and the next starting
		// one full beat (rise + fall + pause) lands ~960ms apart, matching "800-900ms" thump spacing plus a settle

		POST_BEATS_SILENCE_MS: 1000, // held silence after the 6th heartbeat, before anything else

		/* how visible the moon / stars / fog / fireflies get at the peak of each breath.
		   Kept low on purpose — "slightly visible", not fully revealed. */
		WORLD_DARK_OPACITY: 0.05,
		WORLD_PEAK_OPACITY: 0.4,
		MOON_DARK_OPACITY: 0.25,
		MOON_PEAK_OPACITY: 1.00,

		/* the heart's own breathing: 100% -> 108% -> 104% -> 100%, soft and slow, no elastic snap */
		HEART_PEAK_SCALE: 1.08,
		HEART_SETTLE_SCALE: 1.04,

		DUST_MIN: 5,
		DUST_MAX: 9,
		DUST_SETTLE_MS: 1300,

		PRE_TEXT_PAUSE_MS: 400,
		TEXT_HOLD_MIN_MS: 4800,
		TEXT_HOLD_MAX_MS: 5400,
		TEXT_FADE_MS: 700,

		DISSOLVE_MS: 1000,
		STAGE_CLEAR_MS: 1300        // world slowly brightens back, matched to the darken speed
	};

	/* ==================================================
	   1b. THE 20 MEMORIES (shown as floating text, no popup)
	   Heart 20's message lives in the existing #messageCard
	   popup, so only hearts 0–18 (Heart 1–19) get an entry here.
	================================================== */
	const MEMORIES = [
		'Every heartbeat carried a memory of you.',
		'Even the moon seemed brighter on the nights I thought of you.',
		'The stars quietly became witnesses to every wish I made for you.',
		'Your smile slowly became my favorite place in the world.',
		"Some meetings feel like luck... ours felt like destiny.",
		"If I could borrow time, I'd spend every second beside you.",
		'Every gentle breeze somehow reminded me of your presence.',
		'You appeared in my dreams long before this moment.',
		'Every love song suddenly started making sense because of you.',
		'Some feelings are simply too beautiful to fit into words.',
		'You made ordinary days feel extraordinary.',
		'Some letters are written with ink... this one was written with my heart.',
		'You gave my heart butterflies without even trying.',
		'Hope always had your smile hidden inside it.',
		'The smallest moments with you became my biggest memories.',
		"If every shooting star granted one wish... I spent them all on you.",
		'Thank you for becoming such a beautiful chapter of my story.',
		'Hidden inside every heart was another little piece of mine.',
		"You're getting closer to the reason all of this exists."
	];

	/* ==================================================
	   2. STATE
	================================================== */
	const state = {
		heartsCollected: 0,
		totalHearts: CONFIG.TOTAL_HEARTS,
		musicPlaying: false,
		sceneBrightness: 0,
		popupOpen: false,
		interactionLocked: true,
		continueEnabled: false,
		animationRunning: false,
		reducedMotion: false,
		hearts: [],
		lastFocusedElement: null
	};

	const setState = (patch) => Object.assign(state, patch);

	/* ==================================================
	   3. DOM CACHE
	================================================== */
	const dom = {};

	function cacheDom() {
		dom.body = document.body;
		dom.main = document.getElementById('main');
		dom.hero = document.getElementById('hero');
		dom.heroLabel = document.getElementById('heroLabel');
		dom.heroTitle = document.getElementById('heroTitle');
		dom.heroSubtitle = document.getElementById('heroSubtitle');
		dom.heroHint = document.getElementById('heroHint');

		dom.loveMeter = document.getElementById('loveMeter');
		dom.loveMeterGlass = dom.loveMeter ? dom.loveMeter.querySelector('.love-meter__glass') : null;
		dom.progressFill = document.getElementById('progressFill');
		dom.progressText = document.getElementById('progressText');
		dom.loveMeterTrack = document.getElementById('loveMeterTrack');

		dom.heartField = document.getElementById('heartField');
		dom.heartContainer = document.getElementById('heartContainer');

		dom.popup = document.getElementById('messageCard');
		dom.popupGlass = dom.popup ? dom.popup.querySelector('.popup__glass') : null;
		dom.popupContinueButton = document.getElementById('popupContinueButton');

		dom.continueSection = document.getElementById('continueSection');
		dom.continueButton = document.getElementById('continueButton');
		dom.chapterSixLink = document.getElementById('chapterSixLink');

		dom.musicToggle = document.getElementById('musicToggle');
		dom.musicPlayIcon = dom.musicToggle ? dom.musicToggle.querySelector('.music-toggle__icon--play') : null;
		dom.musicPauseIcon = dom.musicToggle ? dom.musicToggle.querySelector('.music-toggle__icon--pause') : null;

		dom.loadingOverlay = document.getElementById('loadingOverlay');
		dom.flashOverlay = document.getElementById('flashOverlay');

		dom.moon = document.getElementById('moon');
		dom.moonGlow = document.getElementById('moonGlow');
		dom.stars = document.getElementById('stars');
		dom.particles = document.getElementById('particles');
		dom.fireflies = document.getElementById('fireflies');
		dom.fogBack = document.getElementById('fogBack');
		dom.fogMiddle = document.getElementById('fogMiddle');
		dom.fogFront = document.getElementById('fogFront');

		dom.ambientMusic = document.getElementById('ambientMusic');
		dom.heartCollectSound = document.getElementById('heartCollectSound');
		dom.magicSparkleSound = document.getElementById('magicSparkleSound');
		dom.finalMagicSound = document.getElementById('finalMagicSound');
		/* Cinematic collection-sequence audio layers */
		dom.heartbeatSound = document.getElementById('heartbeatSound');
		dom.pianoNoteSound = document.getElementById('pianoNoteSound');

		/* Cinematic heartbeat + memory stage */
		dom.cinematicOverlay = document.getElementById('cinematicOverlay');
		dom.cinematicDust = document.getElementById('cinematicDust');
		dom.cinematicOverlayText = document.getElementById('cinematicOverlayText');
		dom.cinematicMoon = dom.cinematicOverlay ? dom.cinematicOverlay.querySelector('.cinematic-moon') : null;
		dom.cinematicMoonGlow = dom.cinematicOverlay ? dom.cinematicOverlay.querySelector('.cinematic-moon-glow') : null;

		/* World-breathing targets used during the heartbeat sequence */
		dom.worldBreathTargets = [dom.stars, dom.fireflies, dom.fogBack, dom.fogMiddle, dom.fogFront].filter(Boolean);

		dom.liveRegion = createLiveRegion();
	}

	function createLiveRegion() {
		const region = document.createElement('div');
		region.setAttribute('role', 'status');
		region.setAttribute('aria-live', 'polite');
		region.className = 'visually-hidden';
		document.body.appendChild(region);
		return region;
	}

	/* ==================================================
	   16. UTILITIES
	================================================== */
	const random = (min, max) => Math.random() * (max - min) + min;
	const randomInt = (min, max) => Math.floor(random(min, max + 1));
	const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
	const lerp = (start, end, t) => start + (end - start) * t;
	const mapRange = (value, inMin, inMax, outMin, outMax) =>
		outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);

	function debounce(fn, delay) {
		let timer = null;
		return (...args) => {
			clearTimeout(timer);
			timer = setTimeout(() => fn(...args), delay);
		};
	}

	function wait(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function announce(message) {
		if (!dom.liveRegion) return;
		dom.liveRegion.textContent = '';
		requestAnimationFrame(() => {
			dom.liveRegion.textContent = message;
		});
	}

	function hasGSAP() {
		return typeof window.gsap !== 'undefined';
	}

	/* ==================================================
	   ACCESSIBILITY SETUP
	================================================== */
	function setupAccessibility() {
		state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/* ==================================================
	   BACKGROUND GENERATION — STARS
	================================================== */
	function generateStars() {
		if (!dom.stars) return;
		const fragment = document.createDocumentFragment();

		for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
			const star = document.createElement('span');
			star.className = 'star';
			const size = random(1, 2.6);
			star.style.width = `${size}px`;
			star.style.height = `${size}px`;
			star.style.top = `${random(0, 70)}%`;
			star.style.left = `${random(0, 100)}%`;
			star.style.setProperty('--twinkle-duration', `${random(2.5, 6)}s`);
			star.style.setProperty('--twinkle-delay', `${random(0, 5)}s`);
			star.style.setProperty('--star-min-opacity', random(0.1, 0.3));
			star.style.setProperty('--star-max-opacity', random(0.6, 1));
			fragment.appendChild(star);
		}

		dom.stars.appendChild(fragment);
	}

	/* ==================================================
	   BACKGROUND GENERATION — PARTICLES
	================================================== */
	function generateParticles(count = CONFIG.PARTICLE_COUNT) {
		if (!dom.particles) return;
		const fragment = document.createDocumentFragment();

		for (let i = 0; i < count; i++) {
			const particle = document.createElement('span');
			particle.className = 'particle';
			const size = random(2, 6);
			particle.style.width = `${size}px`;
			particle.style.height = `${size}px`;
			particle.style.left = `${random(0, 100)}%`;
			particle.style.top = `${random(40, 100)}%`;
			particle.style.setProperty('--particle-duration', `${random(7, 14)}s`);
			particle.style.setProperty('--particle-delay', `${random(0, 10)}s`);
			particle.style.setProperty('--particle-drift', `${random(-40, 40)}px`);
			fragment.appendChild(particle);
		}

		dom.particles.appendChild(fragment);
	}

	/* ==================================================
	   BACKGROUND GENERATION — FIREFLIES
	================================================== */
	function generateFireflies() {
		if (!dom.fireflies) return;
		const fragment = document.createDocumentFragment();

		for (let i = 0; i < CONFIG.FIREFLY_COUNT; i++) {
			const firefly = document.createElement('span');
			firefly.className = 'firefly';
			firefly.style.top = `${random(5, 90)}%`;
			firefly.style.left = `${random(0, 100)}%`;
			firefly.style.setProperty('--firefly-size', `${random(3, 7)}px`);
			firefly.style.setProperty('--firefly-duration', `${random(9, 16)}s`);
			firefly.style.setProperty('--firefly-breathe', `${random(2.5, 5)}s`);
			firefly.style.setProperty('--firefly-delay', `${random(0, 6)}s`);
			firefly.style.setProperty('--fx1', `${random(-40, 40)}px`);
			firefly.style.setProperty('--fy1', `${random(-50, 10)}px`);
			firefly.style.setProperty('--fx2', `${random(-40, 40)}px`);
			firefly.style.setProperty('--fy2', `${random(-20, 30)}px`);
			firefly.style.setProperty('--fx3', `${random(-40, 40)}px`);
			firefly.style.setProperty('--fy3', `${random(-10, 40)}px`);
			fragment.appendChild(firefly);
		}

		dom.fireflies.appendChild(fragment);
	}

	/* ==================================================
	   5. HEART GENERATION
	================================================== */
	const HEART_SVG_PATH = 'M16 28.5C16 28.5 3 20.7 3 11.6C3 6.9 6.7 3.5 11 3.5C13.3 3.5 15 4.6 16 6.2C17 4.6 18.7 3.5 21 3.5C25.3 3.5 29 6.9 29 11.6C29 20.7 16 28.5 16 28.5Z';

	function ensureHeartGradientDefs() {
		if (document.getElementById('heartGradientDefs')) return;
		const svgNS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute('id', 'heartGradientDefs');
		svg.setAttribute('width', '0');
		svg.setAttribute('height', '0');
		svg.style.position = 'absolute';
		svg.innerHTML = `
			<defs>
				<linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#f2c9d6" stop-opacity="0.95"></stop>
					<stop offset="55%" stop-color="#e8a9c0" stop-opacity="0.9"></stop>
					<stop offset="100%" stop-color="#e9d3a3" stop-opacity="0.85"></stop>
				</linearGradient>
			</defs>
		`;
		document.body.appendChild(svg);
	}

	function createHeartElement(id) {
		const svgNS = 'http://www.w3.org/2000/svg';
		const wrapper = document.createElement('div');
		wrapper.className = 'heart';
		wrapper.dataset.heartId = String(id);
		wrapper.setAttribute('role', 'button');
		wrapper.setAttribute('tabindex', '0');
		wrapper.setAttribute('aria-label', 'Collect heart');

		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute('viewBox', '0 0 32 29');

		const path = document.createElementNS(svgNS, 'path');
		path.setAttribute('d', HEART_SVG_PATH);
		path.setAttribute('class', 'heart__glass');

		svg.appendChild(path);
		wrapper.appendChild(svg);

		return wrapper;
	}

	function generateHearts() {
		if (!dom.heartContainer) return;
		ensureHeartGradientDefs();

		const fragment = document.createDocumentFragment();
		const bounds = getFieldBounds();

		for (let i = 0; i < CONFIG.TOTAL_HEARTS; i++) {
			const element = createHeartElement(i);
			const size = random(24, 46);
			const x = random(bounds.padding, bounds.width - bounds.padding);
			const y = random(bounds.padding, bounds.height - bounds.padding);

			const heart = {
				id: i,
				element,
				x,
				y,
				baseX: x,
				baseY: y,
				scale: 1,
				rotation: random(-8, 8),
				speed: random(0.15, 0.4),
				amplitude: random(10, 26),
				phase: random(0, Math.PI * 2),
				delay: random(0, 4),
				collected: false,
				glow: random(0.6, 1),
				pulseSpeed: random(2.4, 4.2)
			};

			element.style.setProperty('--heart-size', `${size}px`);
			element.style.setProperty('--heart-pulse', `${heart.pulseSpeed}s`);
			element.style.left = `${x}px`;
			element.style.top = `${y}px`;
			element.style.animationDelay = `${heart.delay}s`;

			state.hearts.push(heart);
			fragment.appendChild(element);
		}

		dom.heartContainer.appendChild(fragment);
	}

	function getFieldBounds() {
		const rect = dom.heartField
			? dom.heartField.getBoundingClientRect()
			: { width: window.innerWidth, height: window.innerHeight * 0.6 };
		return {
			width: rect.width || window.innerWidth,
			height: rect.height || window.innerHeight * 0.6,
			padding: CONFIG.HEART_EDGE_PADDING
		};
	}

	/* ==================================================
	   6. ANIMATION LOOP
	================================================== */
	let rafId = null;
	let lastTimestamp = 0;

	function startAnimationLoop() {
		if (state.reducedMotion) return;
		setState({ animationRunning: true });
		lastTimestamp = performance.now();
		rafId = requestAnimationFrame(animationTick);
	}

	function stopAnimationLoop() {
		if (rafId) cancelAnimationFrame(rafId);
		rafId = null;
		setState({ animationRunning: false });
	}

	function animationTick(timestamp) {
		const elapsed = (timestamp - lastTimestamp) / 1000;
		lastTimestamp = timestamp;

		for (const heart of state.hearts) {
			if (heart.collected) continue;

			heart.phase += elapsed * heart.speed;
			const floatX = Math.sin(heart.phase) * heart.amplitude;
			const floatY = Math.cos(heart.phase * 0.8) * (heart.amplitude * 0.6);
			const rotate = Math.sin(heart.phase * 0.5) * heart.rotation;

			heart.element.style.transform = `translate3d(${floatX}px, ${floatY}px, 0) rotate(${rotate}deg)`;
		}

		rafId = requestAnimationFrame(animationTick);
	}

	/* ==================================================
	   7. COLLECTION LOGIC
	================================================== */
	function attachHeartListeners() {
		if (!dom.heartContainer) return;

		dom.heartContainer.addEventListener('click', (event) => {
			const heartElement = event.target.closest('.heart');
			if (heartElement) handleHeartActivation(heartElement);
		});

		dom.heartContainer.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			const heartElement = event.target.closest('.heart');
			if (heartElement) {
				event.preventDefault();
				handleHeartActivation(heartElement);
			}
		});
	}

	function handleHeartActivation(heartElement) {
		if (state.interactionLocked) return;
		const id = Number(heartElement.dataset.heartId);
		const heart = state.hearts.find((h) => h.id === id);
		if (!heart || heart.collected) return;
		collectHeart(heart);
	}

	/* Gentle single-pulse haptic feedback */
	function triggerHaptic() {
		if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
			navigator.vibrate(CONFIG.HAPTIC_PULSE_MS);
		}
	}

	/* ==================================================
	   CINEMATIC HEARTBEAT + MEMORY SEQUENCE
	   Tap -> freeze the whole world -> slow fade to near-
	   black -> six slow heartbeats where the ENTIRE SCENE
	   breathes (overlay, moon, stars, fog, fireflies all
	   rise toward light together with the heart, then settle
	   back into darkness) -> a held silence -> golden dust
	   drifts in -> typewriter memory -> a calm reading pause
	   -> dissolve -> fly to meter -> the world slowly wakes
	   back up.
	================================================== */
	async function collectHeart(heart) {
		heart.collected = true;
		heart.element.setAttribute('aria-disabled', 'true');
		heart.element.tabIndex = -1;

		setState({ interactionLocked: true });
		stopAnimationLoop();
		triggerHaptic();

		/* Capture geometry now, before the heart moves/dissolves */
		const startRect = heart.element.getBoundingClientRect();

		freezeHeartInPlace(heart);
		freezeWorld();
		fadeAudio(dom.ambientMusic, 0.04, CINEMATIC.DARKEN_MS);

		await darkenStage();
		await playHeartbeatBeats(heart);
		spawnCinematicDust(startRect);

		await wait(CINEMATIC.PRE_TEXT_PAUSE_MS);
		await revealCinematicMemory(heart.id);
		await wait(random(CINEMATIC.TEXT_HOLD_MIN_MS, CINEMATIC.TEXT_HOLD_MAX_MS));
		await hideCinematicMemory();

		await releaseHeart(heart, startRect);
		await clearStage();

		setState({ heartsCollected: state.heartsCollected + 1 });
		updateProgress();
		pulseLoveMeter();
		brightenWorld();
		fadeAudio(dom.ambientMusic, 0.35, 900);
		announce(`${state.heartsCollected} of ${state.totalHearts} hearts collected`);

		if (!state.reducedMotion) startAnimationLoop();

		if (state.heartsCollected >= state.totalHearts) {
			checkCompletion();
		} else {
			setState({ interactionLocked: false });
		}
	}

	/* --- Freeze: stop floating, hold heart visible above the stage --- */
	function freezeHeartInPlace(heart) {
		heart.element.classList.add('is-focused');
		heart.element.style.transform = 'translate3d(0, 0, 0)';
		if (hasGSAP()) {
			window.gsap.set(heart.element, { scale: 1 });
		}
	}

	/* --- World freeze: moon glow, stars, fireflies and fog all hold
	   still and dim along with the stage, and only resume once the
	   memory sequence has fully cleared. --- */
	function freezeWorld() {
		dom.body.classList.add('scene--frozen');
	}

	function unfreezeWorld() {
		dom.body.classList.remove('scene--frozen');
	}

	/* --- Darken: fade the whole stage to near-black slowly (~1.1s),
	   never a flash. The moon dims down to almost nothing at the same
	   time, matched to the same slow curve. --- */
	function darkenStage() {
		if (!dom.cinematicOverlay) return Promise.resolve();
		dom.cinematicOverlay.setAttribute('aria-hidden', 'false');

		if (hasGSAP() && !state.reducedMotion) {
			return new Promise((resolve) => {
				const tl = window.gsap.timeline({ onComplete: resolve });
				tl.to(dom.cinematicOverlay, {
					opacity: CINEMATIC.STAGE_OPACITY,
					duration: CINEMATIC.DARKEN_MS / 1000,
					ease: 'power2.inOut'
				}, 0);
				if (dom.moon) {
					tl.to(dom.moon, {
						opacity: CINEMATIC.MOON_DARK_OPACITY,
						duration: CINEMATIC.DARKEN_MS / 1000,
						ease: 'power2.inOut'
					}, 0);
				}
			});
		}

		dom.cinematicOverlay.style.transition = `opacity ${CINEMATIC.DARKEN_MS}ms ease-in-out`;
		dom.cinematicOverlay.style.opacity = String(CINEMATIC.STAGE_OPACITY);
		if (dom.moon) {
			dom.moon.style.transition = `opacity ${CINEMATIC.DARKEN_MS}ms ease-in-out`;
			dom.moon.style.opacity = String(CINEMATIC.MOON_DARK_OPACITY);
		}
		return wait(CINEMATIC.DARKEN_MS);
	}

	/* --- setWorldVisibility: the heart of the "world breathing" effect.
	   `visibility` runs 0 (dark) -> 1 (peak of a breath). Tweens the
	   cinematic overlay, the moon, and the stars/fog/fireflies group
	   together over `durationMs`, all with the same smooth easing, so
	   the whole scene rises and falls as a single breath. --- */
	function setWorldVisibility(visibility, durationMs) {
		const overlayOpacity = lerp(
			CINEMATIC.STAGE_OPACITY,
			CINEMATIC.STAGE_OPACITY * (1 - CINEMATIC.BEAT_PEAK_VISIBILITY),
			visibility
		);
		const worldOpacity = lerp(CINEMATIC.WORLD_DARK_OPACITY, CINEMATIC.WORLD_PEAK_OPACITY, visibility);
		const moonOpacity = lerp(CINEMATIC.MOON_DARK_OPACITY, CINEMATIC.MOON_PEAK_OPACITY, visibility);

		if (state.reducedMotion || !hasGSAP()) {
			if (dom.cinematicOverlay) dom.cinematicOverlay.style.opacity = String(overlayOpacity);
			if (dom.moon) dom.moon.style.opacity = String(moonOpacity);
			dom.worldBreathTargets.forEach((el) => { el.style.opacity = String(worldOpacity); });
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			const duration = durationMs / 1000;
			if (dom.cinematicOverlay) {
				window.gsap.to(dom.cinematicOverlay, { opacity: overlayOpacity, duration, ease: 'sine.inOut' });
			}
			if (dom.moon) {
				window.gsap.to(dom.moon, { opacity: moonOpacity, duration, ease: 'sine.inOut' });
			}
			if (dom.worldBreathTargets.length) {
				window.gsap.to(dom.worldBreathTargets, { opacity: worldOpacity, duration, ease: 'sine.inOut' });
			}
			window.gsap.delayedCall(duration, resolve);
		});
	}

	/* --- growHeartBeat: the heart's own half of the breath — a soft,
	   slow scale up and back down (100% -> 108% -> 104% -> 100%),
	   timed to run alongside the world's rise and fall. No elastic
	   bounce, no snapping — just a gentle swell. --- */
	function growHeartBeat(heart, riseMs, fallMs) {
		if (state.reducedMotion || !hasGSAP()) return;
		const el = heart.element;
		const tl = window.gsap.timeline();
		tl.to(el, {
			scale: CINEMATIC.HEART_PEAK_SCALE,
			duration: riseMs / 1000,
			ease: 'sine.inOut'
		});
		tl.to(el, {
			scale: CINEMATIC.HEART_SETTLE_SCALE,
			duration: (fallMs * 0.45) / 1000,
			ease: 'sine.inOut'
		});
		tl.to(el, {
			scale: 1,
			duration: (fallMs * 0.55) / 1000,
			ease: 'sine.inOut'
		});
	}

	/* --- Six slow heartbeats. Each one: the world rises from dark
	   toward its peak (through the equivalent of ~35% / ~55% / ~70%
	   visible), the thump sound plays right at the top of the breath,
	   then everything settles back into darkness together, followed
	   by a brief pause before the next beat begins. --- */
	async function playHeartbeatBeats(heart) {
		for (let i = 0; i < CINEMATIC.BEAT_COUNT; i += 1) {
			growHeartBeat(heart, CINEMATIC.BEAT_RISE_MS, CINEMATIC.BEAT_FALL_MS);

			await setWorldVisibility(1, CINEMATIC.BEAT_RISE_MS);
			safePlay(dom.heartbeatSound);
			triggerHaptic();

			await setWorldVisibility(0, CINEMATIC.BEAT_FALL_MS);

			if (i < CINEMATIC.BEAT_COUNT - 1) {
				await wait(CINEMATIC.BEAT_PAUSE_MS);
			}
		}

		/* A held beat of silence and stillness before anything else happens */
		await wait(CINEMATIC.POST_BEATS_SILENCE_MS);
	}

	/* --- Dust: a few golden motes drift in around the held heart,
	   only after the beats and the silence that follows them --- */
	function spawnCinematicDust(originRect) {
		if (!dom.cinematicDust || state.reducedMotion) return;

		const count = randomInt(CINEMATIC.DUST_MIN, CINEMATIC.DUST_MAX);
		const originX = originRect.left + originRect.width / 2;
		const originY = originRect.top + originRect.height / 2;

		for (let i = 0; i < count; i += 1) {
			const particle = document.createElement('span');
			particle.className = 'cinematic-dust-particle';
			const size = random(2, 5);
			particle.style.width = `${size}px`;
			particle.style.height = `${size}px`;
			particle.style.left = `${originX + random(-70, 70)}px`;
			particle.style.top = `${originY + random(-70, 70)}px`;
			dom.cinematicDust.appendChild(particle);

			const drift = random(CINEMATIC.DUST_SETTLE_MS, CINEMATIC.DUST_SETTLE_MS + 500) / 1000;

			if (hasGSAP()) {
				window.gsap.fromTo(
					particle,
					{ opacity: 0, y: random(10, 24) },
					{
						opacity: random(0.4, 0.85),
						y: random(-16, -6),
						duration: drift,
						delay: random(0, 0.3),
						ease: 'power1.out'
					}
				);
			} else {
				particle.style.transition = `opacity ${drift}s ease-out, transform ${drift}s ease-out`;
				requestAnimationFrame(() => {
					particle.style.opacity = String(random(0.4, 0.85));
					particle.style.transform = `translateY(${random(-16, -6)}px)`;
				});
			}
		}
	}

	function clearCinematicDust() {
		if (!dom.cinematicDust) return;
		dom.cinematicDust.innerHTML = '';
	}

	/* --- Memory text: typewriter, alone on the dark stage --- */
	function typewriterReveal(element, text) {
		return new Promise((resolve) => {
			element.textContent = '';

			if (state.reducedMotion) {
				element.textContent = text;
				resolve();
				return;
			}

			let i = 0;
			const typeNext = () => {
				if (i >= text.length) {
					resolve();
					return;
				}
				element.textContent += text[i];
				i += 1;
				setTimeout(typeNext, random(CONFIG.TYPEWRITER_MS_MIN, CONFIG.TYPEWRITER_MS_MAX));
			};
			typeNext();
		});
	}

	async function revealCinematicMemory(heartId) {
		/* Heart 20 (index 19) has no floating memory —
		   its message lives in the existing final popup. */
		if (heartId >= MEMORIES.length) return;
		if (!dom.cinematicOverlayText) return;

		// Moon fades in before the text types
		if (dom.cinematicMoon && hasGSAP() && !state.reducedMotion) {
			window.gsap.fromTo(
				dom.cinematicMoon,
				{
					opacity: 0,
					scale: 0.9
				},
				{
					opacity: 1,
					scale: 1,
					duration: 2,
					ease: "power2.out"
				}
			);

			window.gsap.fromTo(
				dom.cinematicMoonGlow,
				{
					opacity: 0
				},
				{
					opacity: 1,
					duration: 2,
					ease: "power2.out"
				}
			);
		}

		const text = MEMORIES[heartId];

		await typewriterReveal(dom.cinematicOverlayText, text);
		dom.cinematicOverlayText.classList.add('is-visible');
		announce(text);
	}

	async function hideCinematicMemory() {
		if (!dom.cinematicOverlayText) return;
		dom.cinematicOverlayText.classList.remove('is-visible');
		await wait(CINEMATIC.TEXT_FADE_MS);
		dom.cinematicOverlayText.textContent = '';

		/* Fade out the cinematic moon after the memory text finishes */
		if (dom.cinematicMoon && hasGSAP() && !state.reducedMotion) {
			window.gsap.to(dom.cinematicMoon, {
				opacity: 0,
				duration: 1.2,
				ease: "power2.inOut"
			});

			window.gsap.to(dom.cinematicMoonGlow, {
				opacity: 0,
				duration: 1.2,
				ease: "power2.inOut"
			});
		}
	}

	/* --- Release: dust rises, heart dissolves into light, flies to meter --- */
	async function releaseHeart(heart, startRect) {
		clearCinematicDust();
		safePlay(dom.magicSparkleSound);

		heart.element.classList.add('is-dissolving');
		await wait(CINEMATIC.DISSOLVE_MS * 0.4);

		spawnBurstParticles(heart);
		flyHeartToMeter(heart, startRect);
		safePlay(dom.pianoNoteSound);

		await wait(CINEMATIC.DISSOLVE_MS * 0.6);

		heart.element.classList.add('is-collected');
		heart.element.classList.remove('is-focused', 'is-dissolving');
	}

	/* --- Clear: the stage fades away and the whole world slowly wakes
	   back up together — moon opacity, stars, fireflies and fog all
	   resume in step with the overlay's fade, and the moon's glow
	   returns on its own natural transition once .scene--frozen lifts,
	   rather than anything snapping back instantly. --- */
	function clearStage() {
		if (!dom.cinematicOverlay) return Promise.resolve();
		dom.cinematicOverlay.setAttribute('aria-hidden', 'true');
		unfreezeWorld();

		const duration = CINEMATIC.STAGE_CLEAR_MS;

		if (hasGSAP() && !state.reducedMotion) {
			return new Promise((resolve) => {
				const tl = window.gsap.timeline({ onComplete: resolve });
				tl.to(dom.cinematicOverlay, {
					opacity: 0,
					duration: duration / 1000,
					ease: 'power2.inOut'
				}, 0);
				if (dom.moon) {
					tl.to(dom.moon, {
						opacity: 1,
						duration: duration / 1000,
						ease: 'power2.inOut',
						clearProps: 'opacity'
					}, 0);
				}
				if (dom.worldBreathTargets.length) {
					tl.to(dom.worldBreathTargets, {
						opacity: 1,
						duration: duration / 1000,
						ease: 'power2.inOut',
						clearProps: 'opacity'
					}, 0);
				}
			});
		}

		dom.cinematicOverlay.style.transition = `opacity ${duration}ms ease-in-out`;
		dom.cinematicOverlay.style.opacity = '0';
		if (dom.moon) dom.moon.style.opacity = '';
		dom.worldBreathTargets.forEach((el) => { el.style.opacity = ''; });
		return wait(duration);
	}

	/* ==================================================
	   PARTICLE BURST
	================================================== */
	function spawnBurstParticles(heart) {
		const rect = heart.element.getBoundingClientRect();
		const originX = rect.left + rect.width / 2;
		const originY = rect.top + rect.height / 2;
		const count = randomInt(CONFIG.BURST_PARTICLES_MIN, CONFIG.BURST_PARTICLES_MAX);

		for (let i = 0; i < count; i++) {
			const particle = document.createElement('span');
			particle.className = 'heart-burst-particle';
			particle.style.left = `${originX}px`;
			particle.style.top = `${originY}px`;
			document.body.appendChild(particle);

			const angle = random(0, Math.PI * 2);
			const distance = random(20, 70);
			const dx = Math.cos(angle) * distance;
			const dy = Math.sin(angle) * distance;
			const rotate = random(-180, 180);
			const duration = random(0.5, 0.9);

			animateBurstParticle(particle, dx, dy, rotate, duration);
		}
	}

	function animateBurstParticle(particle, dx, dy, rotate, duration) {
		if (hasGSAP() && !state.reducedMotion) {
			window.gsap.to(particle, {
				x: dx,
				y: dy,
				rotate,
				opacity: 0,
				scale: random(0.4, 1.1),
				duration,
				ease: 'power2.out',
				onComplete: () => particle.remove()
			});
		} else {
			particle.style.transition = `transform ${duration}s ease-out, opacity ${duration}s ease-out`;
			requestAnimationFrame(() => {
				particle.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;
				particle.style.opacity = '0';
			});
			setTimeout(() => particle.remove(), duration * 1000);
		}
	}

	/* ==================================================
	   GOLDEN TRAIL SPARKLES DURING FLIGHT
	================================================== */
	function spawnHeartTrail(flightElement, durationSeconds) {
		if (state.reducedMotion) return;

		const trailInterval = setInterval(() => {
			const rect = flightElement.getBoundingClientRect();
			const particle = document.createElement('span');
			particle.className = 'heart-trail-particle';
			particle.style.left = `${rect.left + rect.width / 2}px`;
			particle.style.top = `${rect.top + rect.height / 2}px`;
			document.body.appendChild(particle);

			if (hasGSAP()) {
				window.gsap.to(particle, {
					opacity: 0,
					scale: 0.3,
					y: '+=10',
					duration: 0.6,
					ease: 'power1.out',
					onComplete: () => particle.remove()
				});
			} else {
				particle.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
				requestAnimationFrame(() => {
					particle.style.opacity = '0';
					particle.style.transform = 'translateY(10px) scale(0.3)';
				});
				setTimeout(() => particle.remove(), 600);
			}
		}, CONFIG.TRAIL_INTERVAL_MS);

		setTimeout(() => clearInterval(trailInterval), durationSeconds * 1000);
	}

	/* ==================================================
	   HEART FLIGHT TO LOVE METER
	================================================== */
	function flyHeartToMeter(heart, precomputedStartRect) {
		if (!dom.loveMeter) return;
		const startRect = precomputedStartRect || heart.element.getBoundingClientRect();
		const endRect = dom.loveMeter.getBoundingClientRect();

		const flight = document.createElement('div');
		flight.className = 'heart';
		flight.style.setProperty('--heart-size', heart.element.style.getPropertyValue('--heart-size'));
		flight.style.left = `${startRect.left}px`;
		flight.style.top = `${startRect.top}px`;
		flight.style.position = 'fixed';
		flight.style.animation = 'none';
		flight.innerHTML = heart.element.querySelector('svg').outerHTML;
		flight.setAttribute('aria-hidden', 'true');
		document.body.appendChild(flight);

		const duration = random(CONFIG.FLIGHT_DURATION_MIN, CONFIG.FLIGHT_DURATION_MAX);
		const midX = (startRect.left + endRect.left) / 2 + random(-60, 60);
		const midY = Math.min(startRect.top, endRect.top) - random(40, 100);

		/* Soft golden trail follows the heart the whole flight */
		spawnHeartTrail(flight, duration);

		if (hasGSAP() && window.gsap.plugins && window.MotionPathPlugin) {
			window.gsap.registerPlugin(window.MotionPathPlugin);
		}

		if (hasGSAP() && !state.reducedMotion) {
			window.gsap.to(flight, {
				motionPath: {
					path: [
						{ x: 0, y: 0 },
						{ x: midX - startRect.left, y: midY - startRect.top },
						{ x: endRect.left - startRect.left, y: endRect.top - startRect.top }
					],
					curviness: 1.6
				},
				scale: 0.3,
				opacity: 0.2,
				duration,
				ease: 'power2.inOut',
				onComplete: () => flight.remove()
			});
		} else {
			flight.style.transition = `transform ${duration}s ease-in-out, opacity ${duration}s ease-in-out`;
			requestAnimationFrame(() => {
				flight.style.transform = `translate(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px) scale(0.3)`;
				flight.style.opacity = '0.2';
			});
			setTimeout(() => flight.remove(), duration * 1000);
		}

		safePlay(dom.magicSparkleSound);
	}

	/* ==================================================
	   8. LOVE METER
	================================================== */
	function updateProgress() {
		const percentage = (state.heartsCollected / state.totalHearts) * 100;

		if (dom.progressFill) {
			dom.progressFill.style.width = `${percentage}%`;
		}
		if (dom.progressText) {
			dom.progressText.textContent = `${state.heartsCollected} / ${state.totalHearts} Hearts Collected`;
		}
		if (dom.loveMeterTrack) {
			dom.loveMeterTrack.setAttribute('aria-valuenow', String(state.heartsCollected));
		}
	}

	/* Brief glass glow + traveling shine whenever the meter updates */
	function pulseLoveMeter() {
		if (dom.loveMeterGlass) {
			dom.loveMeterGlass.classList.add('is-pulsing');
			setTimeout(() => dom.loveMeterGlass.classList.remove('is-pulsing'), CONFIG.METER_PULSE_MS);
		}
		if (dom.progressFill) {
			dom.progressFill.classList.remove('is-shining');
			// eslint-disable-next-line no-unused-expressions
			void dom.progressFill.offsetWidth; // restart animation
			dom.progressFill.classList.add('is-shining');
			setTimeout(() => dom.progressFill.classList.remove('is-shining'), 950);
		}
	}

	/* ==================================================
	   9. SCENE EVOLUTION
	================================================== */
	function brightenWorld() {
		const t = state.heartsCollected / state.totalHearts;
		setState({ sceneBrightness: t });

		document.documentElement.style.setProperty('--glow-intensity', String(lerp(1, 1.6, t)));

		if (t > 0.2) {
			dom.body.classList.add('scene--warm');
		}

		if (state.heartsCollected % 4 === 0) {
			generateParticles(4);
		}
	}

	/* ==================================================
	   10. AUDIO
	================================================== */
	function safePlay(audioElement) {
		if (!audioElement) return;
		const playPromise = audioElement.play();
		if (playPromise && typeof playPromise.catch === 'function') {
			playPromise.catch(() => {
				/* Autoplay blocked or playback failed — fail silently */
			});
		}
	}

	function fadeAudio(audioElement, targetVolume, duration) {
		if (!audioElement) return Promise.resolve();
		if (state.reducedMotion || !hasGSAP()) {
			audioElement.volume = clamp(targetVolume, 0, 1);
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			window.gsap.to(audioElement, {
				volume: clamp(targetVolume, 0, 1),
				duration: duration / 1000,
				ease: 'power1.inOut',
				onComplete: resolve
			});
		});
	}

	function initMusic() {
		if (!dom.ambientMusic) return;
		dom.ambientMusic.volume = 0;

		const startMusic = () => {
			if (state.musicPlaying) return;
			safePlay(dom.ambientMusic);
			fadeAudio(dom.ambientMusic, 0.35, CONFIG.MUSIC_FADE);
			setState({ musicPlaying: true });
			updateMusicToggleUI();
			document.removeEventListener('pointerdown', startMusic);
		};

		document.addEventListener('pointerdown', startMusic, { once: true });

		if (dom.musicToggle) {
			dom.musicToggle.addEventListener('click', toggleMusic);
		}
	}

	function toggleMusic() {
		if (!dom.ambientMusic) return;
		if (state.musicPlaying) {
			fadeAudio(dom.ambientMusic, 0, CONFIG.MUSIC_FADE).then(() => dom.ambientMusic.pause());
			setState({ musicPlaying: false });
		} else {
			safePlay(dom.ambientMusic);
			fadeAudio(dom.ambientMusic, 0.35, CONFIG.MUSIC_FADE);
			setState({ musicPlaying: true });
		}
		updateMusicToggleUI();
	}

	function updateMusicToggleUI() {
		if (!dom.musicToggle) return;
		dom.musicToggle.setAttribute('aria-pressed', String(state.musicPlaying));
		dom.musicToggle.setAttribute('aria-label', state.musicPlaying ? 'Pause ambient music' : 'Play ambient music');
		if (dom.musicPlayIcon) dom.musicPlayIcon.hidden = state.musicPlaying;
		if (dom.musicPauseIcon) dom.musicPauseIcon.hidden = !state.musicPlaying;
	}

	/* ==================================================
	   CHECK COMPLETION
	================================================== */
	function checkCompletion() {
		if (state.heartsCollected < state.totalHearts) return;
		triggerFinalSequence();
	}

	/* ==================================================
	   FINAL SEQUENCE (Heart 20)
	================================================== */
	async function triggerFinalSequence() {
		setState({ interactionLocked: true });

		/* Darken the world slightly longer before the big reveal */
		dom.body.classList.add('scene--finale');
		await wait(CONFIG.FINALE_DARKEN_MS);
		dom.body.classList.remove('scene--finale');

		const pauseDuration = randomInt(CONFIG.FINAL_PAUSE_MIN, CONFIG.FINAL_PAUSE_MAX);

		safePlay(dom.finalMagicSound);

		dom.body.classList.add('scene--bright');
		if (dom.loveMeter) dom.loveMeter.classList.add('is-complete');
		document.documentElement.style.setProperty('--glow-intensity', '2.0');

		/* Moon brightens, golden particles surround the whole scene */
		if (dom.moon) dom.moon.style.filter = 'brightness(1.4)';
		generateParticles(18);

		await wait(pauseDuration);

		await revealPopup();
	}

	/* ==================================================
	   11. POPUP
	================================================== */
	async function revealPopup() {
		if (!dom.popup) return;
		setState({ lastFocusedElement: document.activeElement, popupOpen: true });

		dom.popup.hidden = false;

		if (hasGSAP() && !state.reducedMotion) {
			await new Promise((resolve) => {
				window.gsap.to(dom.popupGlass, {
					opacity: 1,
					y: 0,
					filter: 'blur(0px)',
					duration: 1,
					ease: 'power3.out',
					onComplete: resolve
				});
			});
		} else {
			dom.popupGlass.style.opacity = '1';
			dom.popupGlass.style.transform = 'translateY(0)';
			dom.popupGlass.style.filter = 'blur(0px)';
		}

		announce('You collected every heart. A message has appeared.');

		if (dom.popupContinueButton) {
			dom.popupContinueButton.focus();
		}

		enableContinueButton();
		attachPopupFocusTrap();
	}

	function attachPopupFocusTrap() {
		if (!dom.popup) return;
		dom.popup.addEventListener('keydown', handlePopupKeydown);
	}

	function handlePopupKeydown(event) {
		if (!state.popupOpen) return;
		if (event.key !== 'Tab') return;

		const focusable = dom.popup.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
		if (!focusable.length) return;

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

	/* ==================================================
	   12. CONTINUE BUTTON
	================================================== */
	function enableContinueButton() {
		if (!dom.popupContinueButton) return;
		setState({ continueEnabled: true });
		dom.popupContinueButton.disabled = false;
	}

	function prepareContinueButton() {
		if (dom.popupContinueButton) {
			dom.popupContinueButton.addEventListener('click', handleContinueActivation);
		}
		if (dom.continueButton) {
			dom.continueButton.addEventListener('click', handleContinueActivation);
		}
	}

	let continueActivated = false;

	function handleContinueActivation() {
		if (continueActivated || !state.continueEnabled) return;
		continueActivated = true;

		if (dom.popupContinueButton) dom.popupContinueButton.disabled = true;
		if (dom.continueButton) dom.continueButton.disabled = true;

		beginCinematicEnding();
	}

	/* ==================================================
	   13. PAGE TRANSITION / CINEMATIC ENDING
	================================================== */
	async function beginCinematicEnding() {
		setState({ interactionLocked: true });
		stopAnimationLoop();

		await wait(300);

		await fadeElement(dom.popupGlass, 0);
		if (dom.popup) dom.popup.hidden = true;

		await Promise.all([
			fadeElement(dom.hero, 0),
			fadeElement(dom.loveMeter, 0)
		]);

		document.documentElement.style.setProperty('--glow-intensity', '2.2');
		safePlay(dom.magicSparkleSound);

		await wait(200);
		await triggerFlash();

		fadeAudio(dom.ambientMusic, 0, CONFIG.MUSIC_FADE).then(() => {
			if (dom.ambientMusic) dom.ambientMusic.pause();
		});

		await wait(300);
		window.location.href = dom.chapterSixLink ? dom.chapterSixLink.href : CONFIG.NEXT_CHAPTER_URL;
	}

	function fadeElement(element, targetOpacity) {
		if (!element) return Promise.resolve();
		if (hasGSAP() && !state.reducedMotion) {
			return new Promise((resolve) => {
				window.gsap.to(element, {
					opacity: targetOpacity,
					duration: 0.6,
					ease: 'power2.inOut',
					onComplete: resolve
				});
			});
		}
		element.style.transition = 'opacity 0.6s ease-in-out';
		element.style.opacity = String(targetOpacity);
		return wait(600);
	}

	function triggerFlash() {
		if (!dom.flashOverlay) return Promise.resolve();
		dom.flashOverlay.hidden = false;

		if (hasGSAP() && !state.reducedMotion) {
			return new Promise((resolve) => {
				const timeline = window.gsap.timeline({ onComplete: resolve });
				timeline
					.to(dom.flashOverlay, { opacity: 1, duration: CONFIG.FLASH_DURATION / 2000, ease: 'power2.in' })
					.to(dom.flashOverlay, { opacity: 0, duration: CONFIG.FLASH_DURATION / 2000, ease: 'power2.out' });
			});
		}

		dom.flashOverlay.style.transition = `opacity ${CONFIG.FLASH_DURATION / 2}ms ease-in-out`;
		dom.flashOverlay.style.opacity = '1';
		return wait(CONFIG.FLASH_DURATION);
	}

	/* ==================================================
	   14. EVENTS
	================================================== */
	function setupEvents() {
		attachHeartListeners();
		prepareContinueButton();

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('resize', debounce(handleResize, 200));
	}

	function handleVisibilityChange() {
		if (document.hidden) {
			stopAnimationLoop();
		} else if (!state.reducedMotion) {
			startAnimationLoop();
		}
	}

	function handleResize() {
		const bounds = getFieldBounds();
		for (const heart of state.hearts) {
			if (heart.collected) continue;
			heart.baseX = clamp(heart.baseX, bounds.padding, Math.max(bounds.padding, bounds.width - bounds.padding));
			heart.baseY = clamp(heart.baseY, bounds.padding, Math.max(bounds.padding, bounds.height - bounds.padding));
			heart.element.style.left = `${heart.baseX}px`;
			heart.element.style.top = `${heart.baseY}px`;
		}
	}

	/* ==================================================
	   HERO / ENTRANCE ANIMATION
	================================================== */
	function playEntranceAnimation() {
		const elements = [dom.heroLabel, dom.heroTitle, dom.heroSubtitle, dom.heroHint].filter(Boolean);

		if (hasGSAP() && !state.reducedMotion) {
			window.gsap.set(dom.hero, { opacity: 1 });
			window.gsap.set(dom.loveMeter, { opacity: 1 });
			window.gsap.from(elements, {
				opacity: 0,
				y: 16,
				duration: 0.9,
				ease: 'power3.out',
				stagger: 0.15
			});
			window.gsap.from(dom.loveMeter, {
				opacity: 0,
				y: 16,
				duration: 0.9,
				delay: 0.5,
				ease: 'power3.out'
			});
		} else {
			if (dom.hero) dom.hero.style.opacity = '1';
			if (dom.loveMeter) dom.loveMeter.style.opacity = '1';
		}
	}

	/* ==================================================
	   4. INITIALIZATION
	================================================== */
	async function init() {
		try {
			cacheDom();
			setupAccessibility();
			generateStars();
			generateParticles();
			generateFireflies();
			generateHearts();
			updateProgress();
			initMusic();
			setupEvents();
			prepareContinueButton();

			playEntranceAnimation();
			startAnimationLoop();

			await wait(600);
			fadeLoadingScreen();
			setState({ interactionLocked: false });
		} catch (error) {
			/* Never let initialization crash the page */
			fadeLoadingScreen();
			setState({ interactionLocked: false });
		}
	}

	function fadeLoadingScreen() {
		if (!dom.loadingOverlay) return;
		dom.loadingOverlay.classList.add('is-hidden');
	}

	/* ==================================================
	   17. CLEANUP
	================================================== */
	window.addEventListener('beforeunload', () => {
		stopAnimationLoop();
	});

	/* ==================================================
	   BOOT
	================================================== */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
