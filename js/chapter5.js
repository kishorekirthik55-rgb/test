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
		NEXT_CHAPTER_URL: 'chapter6.html'
	};

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

	function collectHeart(heart) {
		heart.collected = true;
		heart.element.classList.add('is-collected');
		heart.element.setAttribute('aria-disabled', 'true');
		heart.element.tabIndex = -1;

		safePlay(dom.heartCollectSound);
		spawnBurstParticles(heart);
		flyHeartToMeter(heart);

		setState({ heartsCollected: state.heartsCollected + 1 });
		updateProgress();
		brightenWorld();
		announce(`${state.heartsCollected} of ${state.totalHearts} hearts collected`);

		checkCompletion();
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
	   HEART FLIGHT TO LOVE METER
	================================================== */
	function flyHeartToMeter(heart) {
		if (!dom.loveMeter) return;
		const startRect = heart.element.getBoundingClientRect();
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
	   FINAL SEQUENCE
	================================================== */
	async function triggerFinalSequence() {
		setState({ interactionLocked: true });

		const pauseDuration = randomInt(CONFIG.FINAL_PAUSE_MIN, CONFIG.FINAL_PAUSE_MAX);
		await wait(pauseDuration);

		safePlay(dom.finalMagicSound);

		dom.body.classList.add('scene--bright');
		if (dom.loveMeter) dom.loveMeter.classList.add('is-complete');
		document.documentElement.style.setProperty('--glow-intensity', '1.8');
		generateParticles(10);

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
