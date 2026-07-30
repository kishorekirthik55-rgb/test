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
		HAPTIC_PULSE_MS: 25,

		/* music icon morph tuning */
		MUSIC_ICON_MORPH_MS: 380
	};

	/* ==================================================
	   MUSIC ICON MORPH GEOMETRY
	   A single SVG <path> (see #musicIconPath) is tweened
	   between two point sets that share the exact same command
	   structure (two 4-point subpaths: M L L L Z, M L L L Z),
	   so the pause bars and the play triangle are really the
	   same path animating — never a swapped/hidden icon.
	   PAUSE_POINTS: two vertical bars.
	   PLAY_POINTS: the same two shapes collapsed/rotated into
	   the top and bottom halves of a play triangle.
	================================================== */
	const MUSIC_ICON_PAUSE_POINTS = [
		[6, 5], [10, 5], [10, 19], [6, 19],
		[14, 5], [18, 5], [18, 19], [14, 19]
	];
	const MUSIC_ICON_PLAY_POINTS = [
		[8, 5], [18, 12], [18, 12], [8, 12],
		[8, 12], [18, 12], [18, 12], [8, 19]
	];

	function buildMusicIconPath(points) {
		const p = points;
		return (
			`M${p[0][0]},${p[0][1]} L${p[1][0]},${p[1][1]} L${p[2][0]},${p[2][1]} L${p[3][0]},${p[3][1]} Z ` +
			`M${p[4][0]},${p[4][1]} L${p[5][0]},${p[5][1]} L${p[6][0]},${p[6][1]} L${p[7][0]},${p[7][1]} Z`
		);
	}

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

		BEAT_COUNT: 4,             // six slow heartbeats
		BEAT_PEAK_VISIBILITY: 0.72,// how much of the world becomes visible at the top of each beat
		BEAT_RISE_MS: 1000,         // dark -> peak (passes through ~35% / ~55% / ~70%)
		BEAT_FALL_MS: 1000,         // peak -> dark again
		BEAT_PAUSE_MS: 900,        // stillness between one beat ending and the next starting
		// one full beat (rise + fall + pause) lands ~960ms apart, matching "800-900ms" thump spacing plus a settle

		POST_BEATS_SILENCE_MS: 1000, // held silence after the 6th heartbeat, before anything else happens

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
	const MEMORIES_EN = [
		'Every laugh with you became a memory I will always cherish.',
		'The most beautiful adventures always seemed to begin with you.',
		'Some people slowly become an irreplaceable part of our lives.',
		'Every inside joke reminded me how fortunate I was to know you.',
		'You turned ordinary moments into unforgettable memories.',
		'Some people enter your life... you made it brighter just by staying.',
		'Every smile we shared made the world feel a little warmer.',
		'The happiest moments somehow always happened when you were around.',
		'No matter where life takes us, these memories will always remain.',
		'Every chapter of my journey became brighter because you were in it.',
		'Thank you for standing beside me through every high and low.',
		'Some bonds are simply meant to last a lifetime.',
		'The smallest moments with you became my favourite stories.',
		'Every journey felt more meaningful because you were there.',
		'You became one of the most beautiful reasons behind so many memories.',
		'Life gave me countless moments... knowing you became one of the best.',
		'Even the simplest days became special because you were part of them.',
		'Some memories never fade because they were created with someone truly special.',
		'Every heartbeat of this journey carries a beautiful piece of you.',
		"You're getting closer to discovering why this entire journey was created just for you."
	];

	const MEMORIES_TA = [
		'உன் வருகைக்குப் பிறகு... என் நினைவுகளுக்கே ஒரு புதிய அழகு கிடைத்தது.',
		'சில மனிதர்கள் மட்டும் போதும்... வாழ்க்கையே மாறிப்போக.',
		'உன்னுடன் கழிந்த ஒவ்வொரு நொடியும்... இன்னும் என் மனதில் புன்னகைக்கிறது.',
		'சில சந்திப்புகள் காரணமின்றி நடக்கும்... ஆனால் அவை வாழ்நாள் முழுவதும் நினைவாக நிற்கும்.',
		'நாம் பகிர்ந்த சிறு தருணங்களே... இன்று பெரிய பொக்கிஷங்களாகிவிட்டன.',
		'நேரம் பலவற்றை மாற்றிவிடும்... ஆனால் சில நினைவுகளை ஒருபோதும் மாற்ற முடியாது.',
		'உன் புன்னகை இருந்த இடங்களில்... இன்னும் என் நினைவுகள் சுற்றித் திரிகின்றன.',
		'சாதாரணமான நாட்களுக்குக் கூட... நீ வந்ததால் ஒரு சிறப்பு கிடைத்தது.',
		'சில தருணங்கள் முடிந்துவிடும்... ஆனால் அவை விட்டுச் செல்லும் நினைவுகள் என்றும் முடிவதில்லை.',
		'என் வாழ்க்கையின் பல அழகான கதைகளில்... நீயும் ஒரு அழகான அத்தியாயம்.',
		'எந்த சூழலிலும் அருகில் இருந்ததற்கு... என் மனமார்ந்த நன்றி.',
		'சில பந்தங்கள்... வார்த்தைகளால் விளக்க முடியாத அளவிற்கு அழகானவை.',
		'ஒன்றாக நடந்த சிறிய பயணங்களே... இன்று பெரிய நினைவுகளாக வாழ்கின்றன.',
		'சிரித்துக் கொண்டே கழிந்த அந்த நாட்கள்... காலம் கடந்தாலும் மனதில் பசுமையாகவே இருக்கின்றன.',
		'வாழ்க்கை பலரை அறிமுகப்படுத்தியது... ஆனால் சிலரை மட்டும் மறக்க முடியவில்லை.',
		'ஒவ்வொரு நினைவையும் திரும்பிப் பார்க்கும் போது... தானாகவே ஒரு புன்னகை மலர்கிறது.',
		'சாதாரணமான தருணங்களையே... மறக்க முடியாத அனுபவங்களாக மாற்றியவள் நீ.',
		'காலம் நகர்ந்தாலும்... சில நினைவுகள் மட்டும் அதே இடத்தில் காத்திருக்கின்றன.',
		'இந்த பயணத்தின் ஒவ்வொரு அடியிலும்... உன் இருப்பின் அழகான தடம் பதிந்திருக்கிறது.',
		'இன்னும் சில நொடிகளில்... இந்தப் பயணம் ஏன் உனக்காக உருவானது என்பதை நீ உணர்வாய்.'
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

	/* Current interpolation position of the music icon morph:
	   0 = pause shape, 1 = play shape. Lives outside `state` since
	   it's purely a rendering concern for the icon path, tweened
	   independently of app state. */
	const musicIconMorph = { t: 1 };

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
		/* Single morphing icon: one <path>, tweened between play and
		   pause shapes. No separate play/pause SVGs to cache anymore. */
		dom.musicIconPath = document.getElementById('musicIconPath');

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

		/* Step 1: Add moon references */
		dom.cinematicMoonWhite = document.querySelector(".cinematic-moon-white");
		dom.cinematicMoonPink = document.querySelector(".cinematic-moon-pink");

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
		
		/* Wrap heartbeat in try-catch to prevent errors from breaking the sequence */
		try {
			await playHeartbeatBeats(heart);
		} catch (e) {
			console.error('Heartbeat playback error:', e);
		}

		/* Fix 2 — Stop heartbeat immediately after the last beat */
		if (dom.heartbeatSound) {
			dom.heartbeatSound.pause();
			dom.heartbeatSound.currentTime = 0;
		}

		spawnCinematicDust(startRect);

		await wait(CINEMATIC.PRE_TEXT_PAUSE_MS);
		await revealCinematicMemory(
			MEMORIES_EN[heart.id],
			MEMORIES_TA[heart.id]
		);
		await wait(random(CINEMATIC.TEXT_HOLD_MIN_MS, CINEMATIC.TEXT_HOLD_MAX_MS));
		await wait(3000);
		
		/* Wrap transformMoon in try-catch to prevent errors from breaking the sequence */
		try {
			await transformMoon();
		} catch (e) {
			console.error('Moon transform error:', e);
		}
		
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

		/* Step 4: Reset moon to initial state when overlay opens */
		if (dom.cinematicMoonWhite && dom.cinematicMoonPink) {
			if (hasGSAP()) {
				window.gsap.set(dom.cinematicMoonWhite, {
					opacity: 1
				});
				window.gsap.set(dom.cinematicMoonPink, {
					opacity: 0
				});
			} else {
				dom.cinematicMoonWhite.style.opacity = "1";
				dom.cinematicMoonPink.style.opacity = "0";
			}
		}

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

			/* Fix 3 — Use safePlay instead of await, and make sure each beat restarts cleanly */
			if (dom.heartbeatSound) {
				dom.heartbeatSound.pause();
				dom.heartbeatSound.currentTime = 0;
				dom.heartbeatSound.volume = 1.0;
				safePlay(dom.heartbeatSound); // Don't await - use safePlay
			}
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
	async function revealCinematicMemory(englishText, tamilText) {
		if (englishText === undefined || tamilText === undefined) return;
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

		// --- Show English first ---
		dom.cinematicOverlayText.classList.remove('tamil-text');
		dom.cinematicOverlayText.innerHTML = '';
		dom.cinematicOverlayText.style.opacity = '1';
		await typeWriter(dom.cinematicOverlayText, englishText);

		// Hold English for 3 seconds
		await wait(3000);

		// Fade out English
		if (hasGSAP() && !state.reducedMotion) {
			await new Promise((resolve) => {
				window.gsap.to(dom.cinematicOverlayText, {
					opacity: 0,
					duration: 0.8,
					ease: 'power2.inOut',
					onComplete: resolve
				});
			});
		} else {
			dom.cinematicOverlayText.style.transition = 'opacity 0.8s ease-in-out';
			dom.cinematicOverlayText.style.opacity = '0';
			await wait(800);
		}

		await wait(300);

		// --- Show Tamil ---
		dom.cinematicOverlayText.classList.add('tamil-text');
		dom.cinematicOverlayText.innerHTML = '';
		
		if (hasGSAP()) {
			window.gsap.set(dom.cinematicOverlayText, { opacity: 1 });
		} else {
			dom.cinematicOverlayText.style.opacity = '1';
		}

		await typeWriter(dom.cinematicOverlayText, tamilText);

		// Hold Tamil for 3.5 seconds
		await wait(3500);

		dom.cinematicOverlayText.classList.add('is-visible');
		announce(englishText + ' ' + tamilText);
	}

	function typeWriter(element, text) {
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

	/* --- transformMoon: crossfades the realistic white moon into the
	   cute pink heart moon, with a gentle scale swell, once the memory
	   text has finished and the reader has had a moment to sit with it. --- */
	async function transformMoon() {
		const whiteMoon = document.querySelector('.cinematic-moon-white');
		const pinkMoon = document.querySelector('.cinematic-moon-pink');

		if (!whiteMoon || !pinkMoon) return;

		if (state.reducedMotion || !hasGSAP()) {
			whiteMoon.style.opacity = '0';
			pinkMoon.style.opacity = '1';
			return;
		}

		return new Promise((resolve) => {
			const tl = window.gsap.timeline({ onComplete: resolve });

			tl.to(whiteMoon, {
				opacity: 0,
				duration: 1.5,
				ease: 'power2.inOut'
			});

			tl.to(pinkMoon, {
				opacity: 1,
				duration: 1.5,
				ease: 'power2.inOut'
			}, '<');

			tl.fromTo(pinkMoon,
				{ scale: 0.96 },
				{ scale: 1.03, duration: 1.5, ease: 'sine.inOut' },
				'<'
			);
		});
	}

	async function hideCinematicMemory() {
		if (!dom.cinematicOverlayText) return;
		dom.cinematicOverlayText.classList.remove('is-visible');
		await wait(CINEMATIC.TEXT_FADE_MS);
		dom.cinematicOverlayText.textContent = '';
		dom.cinematicOverlayText.classList.remove('tamil-text');

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

		/* Step 3: Reset moon for next heart */
		if (dom.cinematicMoonWhite && dom.cinematicMoonPink) {
			if (hasGSAP()) {
				window.gsap.set(dom.cinematicMoonWhite, {
					opacity: 1
				});
				window.gsap.set(dom.cinematicMoonPink, {
					opacity: 0
				});
			} else {
				dom.cinematicMoonWhite.style.opacity = "1";
				dom.cinematicMoonPink.style.opacity = "0";
			}
		}

		/* Fix 4 — Emergency stop at the end of the cinematic sequence */
		if (dom.heartbeatSound) {
			dom.heartbeatSound.pause();
			dom.heartbeatSound.currentTime = 0;
		}

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

	/* --- unlockAudioElement / unlockAllAudioForMobile ------------------
	   Mobile browsers (iOS Safari, Chrome/Android, Samsung Internet) will
	   only let an <audio> element start playing programmatically if
	   play() has already run at least once inside the call stack of a
	   genuine user gesture (tap/click/keydown). Several of this chapter's
	   sound layers — heartbeatSound, pianoNoteSound, magicSparkleSound,
	   finalMagicSound — are first triggered from deep inside the async
	   collectHeart() sequence, well after any setTimeout/await delay, so
	   on strict mobile browsers that later play() call can be silently
	   rejected even though it looks fine on desktop.

	   The fix is the standard "audio unlock" pattern: on the very first
	   tap anywhere on the page, synchronously call play() on every sound
	   element once (immediately pausing and rewinding it again). That one
	   real user-gesture play() "arms" each element so every later
	   asynchronous play() call — no matter how far from the original tap —
	   is allowed to actually produce sound. This changes nothing about
	   *when* sounds play or how loud they are; it only makes sure they
	   are allowed to play at all on mobile. --- */
	function unlockAudioElement(audioElement) {
		if (!audioElement) return;
		try {
			const playPromise = audioElement.play();
			if (playPromise && typeof playPromise.then === 'function') {
				playPromise
					.then(() => {
						audioElement.pause();
						audioElement.currentTime = 0;
					})
					.catch(() => {
						/* Priming play() itself was rejected — harmless; a later
						   safePlay() will simply try again and may still fail on
						   this element, but it won't break anything else. */
					});
			} else {
				audioElement.pause();
				audioElement.currentTime = 0;
			}
		} catch (e) {
			/* Never let audio unlocking crash the interaction */
		}
	}

	function unlockAllAudioForMobile() {
		[
			dom.heartbeatSound,
			dom.pianoNoteSound,
			dom.magicSparkleSound,
			dom.finalMagicSound,
			dom.heartCollectSound
		].forEach(unlockAudioElement);
	}

	/* --- Music icon morph: tweens the single <path> 'd' attribute
	   between the pause-bars shape and the play-triangle shape. Both
	   shapes share identical M/L/L/L/Z structure, so this is a true
	   shape morph — never an icon swap, never an opacity crossfade. --- */
	function setMusicIconShape(t) {
		if (!dom.musicIconPath) return;
		const points = MUSIC_ICON_PAUSE_POINTS.map((pausePoint, i) => {
			const playPoint = MUSIC_ICON_PLAY_POINTS[i];
			return [
				lerp(pausePoint[0], playPoint[0], t),
				lerp(pausePoint[1], playPoint[1], t)
			];
		});
		dom.musicIconPath.setAttribute('d', buildMusicIconPath(points));
	}

	function morphMusicIcon(playing) {
		if (!dom.musicIconPath) return;
		/* playing -> show the pause shape (t = 0); paused -> show the
		   play triangle (t = 1), so the icon always depicts the action
		   a tap will perform next. */
		const targetT = playing ? 0 : 1;

		if (state.reducedMotion || !hasGSAP()) {
			musicIconMorph.t = targetT;
			setMusicIconShape(targetT);
			return;
		}

		window.gsap.to(musicIconMorph, {
			t: targetT,
			duration: CONFIG.MUSIC_ICON_MORPH_MS / 1000,
			ease: 'power2.inOut',
			onUpdate: () => setMusicIconShape(musicIconMorph.t)
		});
	}

	function initMusic() {
		if (!dom.ambientMusic) return;
		dom.ambientMusic.volume = 0;

		/* Render the initial "play" triangle immediately, before any
		   interaction — the page always loads paused. */
		setMusicIconShape(musicIconMorph.t);

		const startMusic = () => {
			if (state.musicPlaying) return;
			/* Prime every other sound layer in the same gesture that starts
			   the ambient track, so cinematic sounds triggered later (after
			   awaits/timeouts) are still allowed to play on mobile. */
			unlockAllAudioForMobile();
			safePlay(dom.ambientMusic);
			fadeAudio(dom.ambientMusic, 0.35, CONFIG.MUSIC_FADE);
			setState({ musicPlaying: true });
			updateMusicToggleUI();
			document.removeEventListener('pointerdown', startMusic);
			document.removeEventListener('touchend', startMusic);
		};

		document.addEventListener('pointerdown', startMusic, { once: true });
		/* touchend fallback: some Android/iOS browser + in-app webview
		   combinations only recognize a gesture as "real" for autoplay
		   purposes on touchend rather than touchstart/pointerdown. */
		document.addEventListener('touchend', startMusic, { once: true, passive: true });

		if (dom.musicToggle) {
			dom.musicToggle.addEventListener('click', toggleMusic);
		}
	}

	function toggleMusic() {
		if (!dom.ambientMusic) return;
		if (state.musicPlaying) {
			/* Pause only — currentTime is left untouched so the next
			   play() resumes from the exact same position. */
			fadeAudio(dom.ambientMusic, 0, CONFIG.MUSIC_FADE).then(() => dom.ambientMusic.pause());
			setState({ musicPlaying: false });
		} else {
			unlockAllAudioForMobile();
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
		morphMusicIcon(state.musicPlaying);
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
		} else {
			if (!state.reducedMotion) startAnimationLoop();

			/* Mobile OSes frequently pause background <audio> the moment a
			   tab/app is backgrounded (iOS Safari, Chrome/Android battery
			   saving, etc). Resume the ambient track if it was supposed to
			   still be playing when the page regains focus, so returning to
			   the tab doesn't leave the BGM silently stopped. */
			if (state.musicPlaying && dom.ambientMusic && dom.ambientMusic.paused) {
				safePlay(dom.ambientMusic);
			}
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

			/* Fix 1 — Increase heartbeat volume */
			if (dom.heartbeatSound) {
				dom.heartbeatSound.volume = 1.0;
			}

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
