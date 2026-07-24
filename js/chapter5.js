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
		BURST_POOL_SIZE: 40,
		FLIGHT_DURATION_MIN: 0.9,
		FLIGHT_DURATION_MAX: 1.3,
		FLASH_DURATION: 1000,
		MUSIC_FADE: 800,
		FINAL_PAUSE_MIN: 800,
		FINAL_PAUSE_MAX: 1200,
		HEART_EDGE_PADDING: 40,
		MILESTONES: [5, 10, 15, 20],
		NEXT_CHAPTER_URL: 'chapter6.html',
		// Below this width, ambient element counts are scaled down for battery/CPU
		// headroom on phones. Visual composition is preserved — just less density.
		MOBILE_BREAKPOINT: 480,
		TABLET_BREAKPOINT: 900,
		MOBILE_DENSITY: 0.6,
		TABLET_DENSITY: 0.85,
		// Reserved for the fixed music-toggle button so hearts never spawn under it.
		MUSIC_TOGGLE_CLEARANCE: 76
	};

	/* Scale ambient element counts down on smaller/lower-powered screens while
	   keeping the exact same desktop counts and composition untouched. */
	function getDensity() {
		const width = window.innerWidth;
		if (width <= CONFIG.MOBILE_BREAKPOINT) return CONFIG.MOBILE_DENSITY;
		if (width <= CONFIG.TABLET_BREAKPOINT) return CONFIG.TABLET_DENSITY;
		return 1;
	}

	function scaled(count) {
		return Math.max(1, Math.round(count * getDensity()));
	}

	/* Luxury eases — no bounce, no elastic, everything settles gracefully. */
	const EASE = {
		out2: 'power2.out',
		out3: 'power3.out',
		outExpo: 'expo.out',
		inOut2: 'power2.inOut',
		soft: 'sine.inOut'
	};

	/* ==================================================
	   2. STATE
	================================================== */
	const state = {
		heartsCollected: 0,
		totalHearts: CONFIG.TOTAL_HEARTS,
		musicPlaying: false,
		worldT: 0, // 0..1 smoothly interpolated "warmth" of the world
		popupOpen: false,
		interactionLocked: true,
		continueEnabled: false,
		animationRunning: false,
		reducedMotion: false,
		hearts: [],
		burstPool: [],
		lastFocusedElement: null,
		milestonesHit: new Set()
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
		dom.progressFill = document.getElementById('progressFill');
		dom.progressText = document.getElementById('progressText');
		dom.loveMeterTrack = document.getElementById('loveMeterTrack');

		dom.heartField = document.getElementById('heartField');
		dom.heartContainer = document.getElementById('heartContainer');

		dom.popup = document.getElementById('messageCard');
		dom.popupGlass = dom.popup ? dom.popup.querySelector('.popup__glass') : null;
		dom.popupContinueButton = document.getElementById('popupContinueButton');
		dom.popupLabel = document.getElementById('messageCardLabel');
		dom.popupTitle = document.getElementById('messageCardTitle');
		dom.popupBody = document.getElementById('messageCardBody');
		dom.popupSecondary = document.getElementById('messageCardSecondary');

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
	   UTILITIES
	================================================== */
	const random = (min, max) => Math.random() * (max - min) + min;
	const randomInt = (min, max) => Math.floor(random(min, max + 1));
	const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
	const lerp = (start, end, t) => start + (end - start) * t;

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

	/* Fisher-Yates shuffle — used so entrance/collection ordering never feels mechanical */
	function shuffle(array) {
		const copy = array.slice();
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	/* ==================================================
	   ACCESSIBILITY SETUP
	================================================== */
	function setupAccessibility() {
		state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	/* ==================================================
	   BACKGROUND GENERATION — STARS
	   (generated once; all subsequent twinkling is pure CSS, zero JS per-frame cost)
	================================================== */
	function generateStars() {
		if (!dom.stars) return;
		const fragment = document.createDocumentFragment();
		const count = scaled(CONFIG.STAR_COUNT);

		for (let i = 0; i < count; i++) {
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
	function generateParticles(count = scaled(CONFIG.PARTICLE_COUNT)) {
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
		const count = scaled(CONFIG.FIREFLY_COUNT);

		for (let i = 0; i < count; i++) {
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

	function wakeFireflies(count) {
		if (!dom.fireflies) return;
		const dormant = Array.from(dom.fireflies.querySelectorAll('.firefly:not(.is-awake)'));
		shuffle(dormant).slice(0, count).forEach((firefly) => firefly.classList.add('is-awake'));
	}

	/* ==================================================
	   BURST PARTICLE POOL
	   Created once at init; reused for every heart collection so we never
	   pay for repeated DOM node creation/destruction during play.
	================================================== */
	function buildBurstPool() {
		const fragment = document.createDocumentFragment();
		const poolSize = scaled(CONFIG.BURST_POOL_SIZE);
		for (let i = 0; i < poolSize; i++) {
			const particle = document.createElement('span');
			particle.className = 'heart-burst-particle';
			particle.style.opacity = '0';
			state.burstPool.push({ el: particle, busy: false });
			fragment.appendChild(particle);
		}
		document.body.appendChild(fragment);
	}

	function getPooledParticle() {
		const free = state.burstPool.find((p) => !p.busy);
		if (free) return free;
		// Pool exhausted (shouldn't normally happen) — reuse the oldest entry.
		return state.burstPool[0];
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
			const { x, y } = pickSafeHeartPosition(bounds);

			const heart = {
				id: i,
				element,
				x,
				y,
				baseX: x,
				baseY: y,
				rotation: random(-8, 8),
				speed: random(0.15, 0.4),
				amplitude: random(10, 26),
				phase: random(0, Math.PI * 2),
				delay: random(0, 4),
				collected: false,
				entered: false,
				pulseSpeed: random(2.4, 4.2)
			};

			element.style.setProperty('--heart-size', `${size}px`);
			element.style.setProperty('--heart-pulse', `${heart.pulseSpeed}s`);
			element.style.left = `${x}px`;
			element.style.top = `${y}px`;

			attachHeartHoverFeel(heart);

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
			top: rect.top || 0,
			padding: CONFIG.HEART_EDGE_PADDING
		};
	}

	/* Returns true if a heart-field-relative point would land under the fixed
	   music-toggle button (bottom-right corner of the viewport), so we can
	   avoid ever spawning a heart that's partly hidden behind it. */
	function isInMusicToggleZone(x, y, bounds) {
		if (!dom.musicToggle) return false;
		const clearance = CONFIG.MUSIC_TOGGLE_CLEARANCE;
		const viewportY = bounds.top + y;
		const nearRightEdge = (window.innerWidth - x) < clearance + bounds.padding;
		const nearBottomEdge = (window.innerHeight - viewportY) < clearance + bounds.padding;
		return nearRightEdge && nearBottomEdge;
	}

	function pickSafeHeartPosition(bounds) {
		const maxAttempts = 6;
		let x = random(bounds.padding, Math.max(bounds.padding, bounds.width - bounds.padding));
		let y = random(bounds.padding, Math.max(bounds.padding, bounds.height - bounds.padding));

		for (let attempt = 0; attempt < maxAttempts && isInMusicToggleZone(x, y, bounds); attempt++) {
			x = random(bounds.padding, Math.max(bounds.padding, bounds.width - bounds.padding));
			y = random(bounds.padding, Math.max(bounds.padding, bounds.height - bounds.padding));
		}

		return { x, y };
	}

	/* ==================================================
	   HEART HOVER FEEL (GSAP-driven so it composes with the
	   entrance/collection timelines instead of fighting CSS transitions)
	================================================== */
	function attachHeartHoverFeel(heart) {
		if (state.reducedMotion || !hasGSAP()) return;

		heart.element.addEventListener('pointerenter', () => {
			if (heart.collected) return;
			window.gsap.to(heart.element, {
				scale: 1.12,
				y: -4,
				duration: 0.35,
				ease: EASE.out2,
				overwrite: 'auto'
			});
		});

		heart.element.addEventListener('pointerleave', () => {
			if (heart.collected) return;
			window.gsap.to(heart.element, {
				scale: 1,
				y: 0,
				duration: 0.4,
				ease: EASE.out2,
				overwrite: 'auto'
			});
		});
	}

	/* ==================================================
	   6. ANIMATION LOOP
	   Single requestAnimationFrame loop drives ambient heart drift for every
	   heart; nothing else in the app runs its own rAF loop.
	================================================== */
	let rafId = null;
	let lastTimestamp = 0;

	function startAnimationLoop() {
		if (state.reducedMotion) return;
		if (state.animationRunning) return;
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
			if (heart.collected || !heart.entered) continue;

			heart.phase += elapsed * heart.speed;
			const floatX = Math.sin(heart.phase) * heart.amplitude;
			const floatY = Math.cos(heart.phase * 0.8) * (heart.amplitude * 0.6);
			const rotate = Math.sin(heart.phase * 0.5) * heart.rotation;

			// translate3d keeps this on the GPU compositor; rotate/translate only
			// (opacity/scale are owned by GSAP during entrance/hover/collection).
			heart.element.style.transform = `translate3d(${floatX}px, ${floatY}px, 0) rotate(${rotate}deg)`;
		}

		rafId = requestAnimationFrame(animationTick);
	}

	/* ==================================================
	   7. COLLECTION LOGIC
	================================================== */
	function attachHeartListeners() {
		if (!dom.heartContainer) return;

		// Event delegation: one listener for all twenty hearts.
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
		if (!heart || heart.collected || !heart.entered) return;
		collectHeart(heart);
	}

	/* One cinematic timeline per collected heart:
	   glow increase -> grow -> tiny squash -> tiny stretch -> settle
	   -> sparkle/burst -> flight -> meter update -> world brightens.
	   Every collection is randomized slightly so no two feel identical. */
	function collectHeart(heart) {
		heart.collected = true;
		heart.element.classList.remove('is-idle');
		heart.element.setAttribute('aria-disabled', 'true');
		heart.element.tabIndex = -1;

		const newCount = state.heartsCollected + 1;
		setState({ heartsCollected: newCount });

		safePlay(dom.heartCollectSound, random(0.92, 1.04));

		if (hasGSAP() && !state.reducedMotion) {
			const tl = window.gsap.timeline({
				defaults: { ease: EASE.out2 },
				onComplete: () => heart.element.remove()
			});
			tl.to(heart.element, { filter: 'drop-shadow(0 0 26px rgba(232,169,192,0.95))', duration: 0.18 })
				.to(heart.element, { scale: 1.22, duration: 0.16, ease: EASE.out3 })
				.to(heart.element, { scaleX: 0.9, scaleY: 1.12, duration: 0.09 })
				.to(heart.element, { scaleX: 1.05, scaleY: 0.96, duration: 0.12 })
				.to(heart.element, { scale: 1, scaleX: 1, scaleY: 1, duration: 0.16 })
				.add(() => {
					spawnBurstParticles(heart);
					flyHeartToMeter(heart);
				})
				.to(heart.element, { opacity: 0, duration: 0.3 }, '<');
		} else {
			heart.element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
			heart.element.style.opacity = '0';
			spawnBurstParticles(heart);
			flyHeartToMeter(heart);
			setTimeout(() => heart.element.remove(), 550);
		}

		updateProgress(newCount);
		evolveWorld(newCount);
		announce(`${newCount} of ${state.totalHearts} hearts collected`);

		checkMilestones(newCount);
		checkCompletion(newCount);
	}

	/* ==================================================
	   PARTICLE BURST (pooled)
	================================================== */
	function spawnBurstParticles(heart) {
		const rect = heart.element.getBoundingClientRect();
		const originX = rect.left + rect.width / 2;
		const originY = rect.top + rect.height / 2;
		const count = randomInt(CONFIG.BURST_PARTICLES_MIN, CONFIG.BURST_PARTICLES_MAX);

		for (let i = 0; i < count; i++) {
			const slot = getPooledParticle();
			slot.busy = true;
			const particle = slot.el;

			particle.style.transform = `translate3d(${originX}px, ${originY}px, 0)`;
			particle.style.opacity = '0.9';

			const angle = random(0, Math.PI * 2);
			const distance = random(20, 70);
			const dx = originX + Math.cos(angle) * distance;
			const dy = originY + Math.sin(angle) * distance;
			const rotate = random(-180, 180);
			const duration = random(0.5, 0.9);

			animateBurstParticle(slot, dx, dy, rotate, duration);
		}
	}

	function animateBurstParticle(slot, dx, dy, rotate, duration) {
		const particle = slot.el;
		const release = () => {
			slot.busy = false;
		};

		if (hasGSAP() && !state.reducedMotion) {
			window.gsap.to(particle, {
				x: dx,
				y: dy,
				rotate,
				opacity: 0,
				scale: random(0.4, 1.1),
				duration,
				ease: EASE.out2,
				onComplete: release
			});
		} else {
			particle.style.transition = `transform ${duration}s ease-out, opacity ${duration}s ease-out`;
			requestAnimationFrame(() => {
				particle.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rotate}deg)`;
				particle.style.opacity = '0';
			});
			setTimeout(release, duration * 1000);
		}
	}

	/* ==================================================
	   HEART FLIGHT TO LOVE METER
	================================================== */
	function flyHeartToMeter(heart) {
		if (!dom.loveMeter) return;
		const startRect = heart.element.getBoundingClientRect();
		const endRect = dom.loveMeter.getBoundingClientRect();

		const flight = document.createElement('div');
		flight.className = 'heart heart-flight';
		flight.style.setProperty('--heart-size', heart.element.style.getPropertyValue('--heart-size'));
		flight.style.transform = `translate3d(${startRect.left}px, ${startRect.top}px, 0)`;
		flight.style.opacity = '1';
		flight.innerHTML = heart.element.querySelector('svg').outerHTML;
		flight.setAttribute('aria-hidden', 'true');
		document.body.appendChild(flight);

		const duration = random(CONFIG.FLIGHT_DURATION_MIN, CONFIG.FLIGHT_DURATION_MAX);
		const midX = (startRect.left + endRect.left) / 2 + random(-60, 60);
		const midY = Math.min(startRect.top, endRect.top) - random(40, 100);

		if (hasGSAP() && window.MotionPathPlugin) {
			window.gsap.registerPlugin(window.MotionPathPlugin);
		}

		if (hasGSAP() && !state.reducedMotion && window.MotionPathPlugin) {
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
				rotate: random(-20, 20),
				duration,
				ease: EASE.inOut2,
				onComplete: () => flight.remove()
			});
		} else if (hasGSAP() && !state.reducedMotion) {
			window.gsap.to(flight, {
				x: endRect.left - startRect.left,
				y: endRect.top - startRect.top,
				scale: 0.3,
				opacity: 0.2,
				duration,
				ease: EASE.inOut2,
				onComplete: () => flight.remove()
			});
		} else {
			flight.style.transition = `transform ${duration}s ease-in-out, opacity ${duration}s ease-in-out`;
			requestAnimationFrame(() => {
				flight.style.transform = `translate3d(${endRect.left}px, ${endRect.top}px, 0) scale(0.3)`;
				flight.style.opacity = '0.2';
			});
			setTimeout(() => flight.remove(), duration * 1000);
		}

		safePlay(dom.magicSparkleSound, random(0.9, 1.05));
	}

	/* ==================================================
	   8. LOVE METER
	================================================== */
	function updateProgress(count) {
		const percentage = (count / state.totalHearts) * 100;

		if (dom.progressFill) {
			dom.progressFill.style.width = `${percentage}%`;
		}
		if (dom.progressText) {
			dom.progressText.textContent = `${count} / ${state.totalHearts} Hearts Collected`;
		}
		if (dom.loveMeterTrack) {
			dom.loveMeterTrack.setAttribute('aria-valuenow', String(count));
		}
	}

	/* ==================================================
	   9. WORLD EVOLUTION
	   Every collected heart nudges a single continuous "warmth" value (0..1)
	   that is tweened smoothly with GSAP — never snapped — so the moon,
	   stars, fireflies, fog and hero glow all drift together rather than
	   jumping in discrete steps.
	================================================== */
	function evolveWorld(count) {
		const target = count / state.totalHearts;
		const root = document.documentElement;

		if (hasGSAP() && !state.reducedMotion) {
			window.gsap.to(state, {
				worldT: target,
				duration: 1.4,
				ease: EASE.soft,
				onUpdate: () => {
					root.style.setProperty('--glow-intensity', String(lerp(1, 1.85, state.worldT)));
				}
			});
		} else {
			setState({ worldT: target });
			root.style.setProperty('--glow-intensity', String(lerp(1, 1.85, target)));
		}

		if (target > 0.18) dom.body.classList.add('scene--warm');
		if (target > 0.68) dom.body.classList.add('scene--golden');

		// A gentle drip-feed of new particles and fireflies rather than a burst.
		if (count % 3 === 0) generateParticles(3);
		wakeFireflies(1);
	}

	function checkMilestones(count) {
		if (!CONFIG.MILESTONES.includes(count)) return;
		if (state.milestonesHit.has(count)) return;
		state.milestonesHit.add(count);

		if (count === 5) {
			wakeFireflies(2);
			if (dom.loveMeter) dom.loveMeter.classList.add('is-pulsing');
		} else if (count === 10) {
			wakeFireflies(3);
			generateParticles(4);
		} else if (count === 15) {
			wakeFireflies(4);
			generateParticles(6);
		}
	}

	/* ==================================================
	   10. AUDIO
	================================================== */
	function safePlay(audioElement, rate = 1) {
		if (!audioElement) return;
		try {
			audioElement.currentTime = 0;
			audioElement.playbackRate = clamp(rate, 0.85, 1.15);
		} catch (err) {
			/* Some browsers reject currentTime writes before metadata loads — ignore. */
		}
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
				ease: EASE.inOut2,
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
	function checkCompletion(count) {
		if (count < state.totalHearts) return;
		triggerFinalSequence();
	}

	/* ==================================================
	   FINAL SEQUENCE — the twentieth heart is the climax, not
	   "one more collection": a breath, a stillness, then bloom.
	================================================== */
	async function triggerFinalSequence() {
		setState({ interactionLocked: true });

		const pauseDuration = randomInt(CONFIG.FINAL_PAUSE_MIN, CONFIG.FINAL_PAUSE_MAX);
		await wait(pauseDuration);

		safePlay(dom.finalMagicSound);

		dom.body.classList.add('scene--bright');
		if (dom.loveMeter) dom.loveMeter.classList.add('is-complete');
		document.documentElement.style.setProperty('--glow-intensity', '2');
		wakeFireflies(CONFIG.FIREFLY_COUNT);
		generateParticles(10);

		await wait(400);
		await revealPopup();
	}

	/* ==================================================
	   11. POPUP — staggered, reverent text reveal
	================================================== */
	async function revealPopup() {
		if (!dom.popup) return;
		setState({ lastFocusedElement: document.activeElement, popupOpen: true });

		dom.popup.hidden = false;
		requestAnimationFrame(() => dom.popup.classList.add('is-open'));

		const textEls = [dom.popupLabel, dom.popupTitle, dom.popupBody, dom.popupSecondary, dom.popupContinueButton].filter(Boolean);

		if (hasGSAP() && !state.reducedMotion) {
			await new Promise((resolve) => {
				const tl = window.gsap.timeline({ onComplete: resolve });
				tl.to(dom.popupGlass, {
					opacity: 1,
					y: 0,
					filter: 'blur(0px)',
					duration: 1,
					ease: EASE.out3
				});
				tl.to(textEls, {
					opacity: 1,
					y: 0,
					duration: 0.7,
					ease: EASE.out2,
					stagger: 0.18
				}, '-=0.5');
			});
		} else {
			dom.popupGlass.style.opacity = '1';
			dom.popupGlass.style.transform = 'translateY(0)';
			dom.popupGlass.style.filter = 'blur(0px)';
			textEls.forEach((el) => {
				el.style.opacity = '1';
				el.style.transform = 'translateY(0)';
			});
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
		dom.popupContinueButton.classList.add('is-ready');
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
	   13. CINEMATIC ENDING
	================================================== */
	async function beginCinematicEnding() {
		setState({ interactionLocked: true });
		stopAnimationLoop();

		await wait(300);

		await fadeElement(dom.popupGlass, 0);
		if (dom.popup) {
			dom.popup.classList.remove('is-open');
			dom.popup.hidden = true;
		}

		await Promise.all([
			fadeElement(dom.hero, 0),
			fadeElement(dom.loveMeter, 0)
		]);

		document.documentElement.style.setProperty('--glow-intensity', '2.4');
		generateParticles(8);
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
					ease: EASE.inOut2,
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
					.to(dom.flashOverlay, { opacity: 1, duration: CONFIG.FLASH_DURATION / 2000, ease: EASE.out2 })
					.to(dom.flashOverlay, { opacity: 0, duration: CONFIG.FLASH_DURATION / 2000, ease: EASE.inOut2 });
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

		const debouncedResize = debounce(handleResize, 200);
		document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
		window.addEventListener('resize', debouncedResize, { passive: true });
		window.addEventListener('orientationchange', debouncedResize, { passive: true });
		window.addEventListener('beforeunload', handleUnload);
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

			if (isInMusicToggleZone(heart.baseX, heart.baseY, bounds)) {
				const safe = pickSafeHeartPosition(bounds);
				heart.baseX = safe.x;
				heart.baseY = safe.y;
			}

			heart.element.style.left = `${heart.baseX}px`;
			heart.element.style.top = `${heart.baseY}px`;
		}
	}

	function handleUnload() {
		stopAnimationLoop();
		if (hasGSAP()) {
			window.gsap.globalTimeline.clear();
		}
	}

	/* ==================================================
	   MASTER CINEMATIC INTRO TIMELINE
	   One orchestrated GSAP timeline drives the entire opening — background
	   wakes, hero text arrives, the Love Meter settles, and every heart
	   enters individually in a shuffled order — instead of scattered,
	   independent animations firing all at once.
	================================================== */
	function playIntroTimeline() {
		if (!hasGSAP() || state.reducedMotion) {
			playIntroFallback();
			return;
		}

		const tl = window.gsap.timeline({ defaults: { ease: EASE.out3 } });

		// Scene: moon awakens
		tl.to(dom.moonGlow, { opacity: 1, scale: 1, duration: 2, ease: EASE.soft }, 0.2)
			.add(() => dom.moonGlow && (dom.moonGlow.style.animationPlayState = 'running'), 0.2)
			.to(dom.moon, { opacity: 1, scale: 1, duration: 1.6, ease: EASE.soft }, 0.3)
			.add(() => dom.moon && (dom.moon.style.animationPlayState = 'running'), 0.3)

			// Scene: stars + fireflies + fog wake
			.to(dom.stars, { opacity: 1, duration: 1.6, ease: EASE.soft }, 0.5)
			.add(() => wakeFireflies(5), 0.7)
			.to([dom.fogBack, dom.fogMiddle, dom.fogFront], {
				opacity: (i, target) => (target.classList.contains('fog--back') ? 0.5 : target.classList.contains('fog--middle') ? 0.4 : 0.6),
				duration: 2,
				ease: EASE.soft
			}, 0.5)
			.add(() => {
				[dom.fogBack, dom.fogMiddle, dom.fogFront].forEach((f) => f && f.classList.add('is-awake'));
			}, 0.5)

			// Scene: hero text, one line at a time
			.set(dom.hero, { opacity: 1 }, 0.9)
			.to(dom.heroLabel, { opacity: 0.85, y: 0, filter: 'blur(0px)', duration: 0.8 }, 0.9)
			.to(dom.heroTitle, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: EASE.outExpo }, 1.1)
			.to(dom.heroSubtitle, { opacity: 0.85, y: 0, filter: 'blur(0px)', duration: 0.9 }, 1.4)
			.to(dom.heroHint, { opacity: 0.55, y: 0, filter: 'blur(0px)', duration: 0.8 }, 1.7)

			// Scene: Love Meter settles into place
			.set(dom.loveMeter, { opacity: 1 }, 2.0)
			.to(dom.loveMeter.querySelector('.love-meter__glass'), {
				opacity: 1,
				y: 0,
				filter: 'blur(0px)',
				duration: 1,
				ease: EASE.out3
			}, 2.0)

			// Scene: hearts arrive one by one, shuffled, never together
			.add(() => playHeartEntrance(), 2.3);
	}

	function playIntroFallback() {
		if (dom.hero) dom.hero.style.opacity = '1';
		if (dom.loveMeter) dom.loveMeter.style.opacity = '1';
		[dom.heroLabel, dom.heroTitle, dom.heroSubtitle, dom.heroHint].forEach((el) => {
			if (!el) return;
			el.style.opacity = '1';
			el.style.transform = 'none';
			el.style.filter = 'none';
		});
		if (dom.moonGlow) { dom.moonGlow.style.opacity = '1'; dom.moonGlow.style.animationPlayState = 'running'; }
		if (dom.moon) { dom.moon.style.opacity = '1'; dom.moon.style.animationPlayState = 'running'; }
		if (dom.stars) dom.stars.style.opacity = '1';
		[dom.fogBack, dom.fogMiddle, dom.fogFront].forEach((f) => f && f.classList.add('is-awake'));
		wakeFireflies(CONFIG.FIREFLY_COUNT);
		const glass = dom.loveMeter && dom.loveMeter.querySelector('.love-meter__glass');
		if (glass) { glass.style.opacity = '1'; glass.style.transform = 'none'; glass.style.filter = 'none'; }
		playHeartEntrance();
	}

	/* Hearts enter individually, in random order, with random rotation —
	   never as a single synchronized reveal. */
	function playHeartEntrance() {
		const order = shuffle(state.hearts);

		order.forEach((heart, index) => {
			const delay = index * random(0.04, 0.09);
			const startRotation = random(-25, 25);

			if (hasGSAP() && !state.reducedMotion) {
				window.gsap.set(heart.element, { opacity: 0, scale: 0.25, rotate: startRotation });
				window.gsap.to(heart.element, {
					opacity: 1,
					scale: 1,
					rotate: heart.rotation,
					duration: random(0.8, 1.2),
					ease: EASE.out3,
					delay,
					onComplete: () => {
						heart.entered = true;
						heart.element.classList.add('is-idle');
					}
				});
			} else {
				heart.element.style.opacity = '1';
				heart.entered = true;
				heart.element.classList.add('is-idle');
			}
		});

		if (!hasGSAP() || state.reducedMotion) {
			state.hearts.forEach((h) => { h.entered = true; h.element.classList.add('is-idle'); });
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
			buildBurstPool();
			generateHearts();
			updateProgress(0);
			initMusic();
			setupEvents();
			prepareContinueButton();

			startAnimationLoop();

			await wait(400);
			fadeLoadingScreen();
			playIntroTimeline();
			setState({ interactionLocked: false });
		} catch (error) {
			/* Never let initialization crash the page */
			fadeLoadingScreen();
			revealEverythingSafely();
			setState({ interactionLocked: false });
		}
	}

	function revealEverythingSafely() {
		if (dom.hero) dom.hero.style.opacity = '1';
		if (dom.loveMeter) dom.loveMeter.style.opacity = '1';
		state.hearts.forEach((h) => {
			h.element.style.opacity = '1';
			h.entered = true;
			h.element.classList.add('is-idle');
		});
	}

	function fadeLoadingScreen() {
		if (!dom.loadingOverlay) return;
		dom.loadingOverlay.classList.add('is-hidden');
	}

	/* ==================================================
	   BOOT
	================================================== */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();