/* SphereXR Engine v1.0.0 — Ayal Othman / ExpoXR (expoxr.com) */
(function () {
	'use strict';

	/* ------------------------------------------------------------------ */
	/* Constants from detect script                                         */
	/* ------------------------------------------------------------------ */

	var animations = window.SphereXRAnimations || [];
	var settings   = window.SphereXRSettings || {};
	var DPR_CAP    = settings.dprCap || 1.75;
	var IO_THRESH  = settings.ioThresh || 0.01;
	var DEBUG      = settings.debugMode || false;

	var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ------------------------------------------------------------------ */
	/* Math constants (from child theme orb system)                         */
	/* ------------------------------------------------------------------ */

	var PHI = 1.61803; // Golden ratio — creates irrational harmonic secondary
	var E   = 2.71828; // Euler's number — secondary harmonic mixing

	/* ------------------------------------------------------------------ */
	/* Utilities                                                            */
	/* ------------------------------------------------------------------ */

	function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

	function hexToRgb(hex) {
		var r = parseInt(hex.slice(1, 3), 16) || 0;
		var g = parseInt(hex.slice(3, 5), 16) || 0;
		var b = parseInt(hex.slice(5, 7), 16) || 0;
		return { r: r, g: g, b: b };
	}

	function hexToRgba(hex, alpha) {
		var c = hexToRgb(hex);
		return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
	}

	// Deterministic seed from string id (prevents sync between orbs)
	function hashSeed(str) {
		var h = 0;
		for (var i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
		return (h & 0xffff) / 0xffff * Math.PI * 6;
	}

	// Resolve size value with unit to px within a container
	function resolvePx(val, unit, containerW, containerH, axis) {
		if (unit === 'percent') return (val / 100) * (axis === 'x' ? containerW : containerH);
		if (unit === 'vw')      return (val / 100) * window.innerWidth;
		if (unit === 'vh')      return (val / 100) * window.innerHeight;
		return parseFloat(val); // px — use raw
	}

	/* ------------------------------------------------------------------ */
	/* Draw a single radial gradient blob (from sm-effects.js pattern)     */
	/* ------------------------------------------------------------------ */

	function drawBlob(ctx, x, y, rx, ry, hexColor, alpha, core) {
		var r = Math.max(rx, ry);
		var coreStop = core || 0.08;
		ctx.save();
		ctx.translate(x, y);
		if (rx !== ry) ctx.scale(rx / r, ry / r);
		// Gradient created inside transformed space so it scales with the ellipse
		var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
		grad.addColorStop(0, hexToRgba(hexColor, alpha));
		grad.addColorStop(coreStop + 0.46, hexToRgba(hexColor, alpha * 0.68));
		grad.addColorStop(1, hexToRgba(hexColor, 0));
		ctx.beginPath();
		ctx.arc(0, 0, r, 0, Math.PI * 2);
		ctx.fillStyle = grad;
		ctx.fill();
		ctx.restore();
	}

	/* ------------------------------------------------------------------ */
	/* Compute orb animated position                                        */
	/* ------------------------------------------------------------------ */

	function computeOrbPos(orb, seed, t, w, h, safeMarginPct, mx, my, hover, interMode, interStrength, interRadius) {
		var ax = resolvePx(orb.animation.amplitude_x, 'percent', w, h, 'x');
		var ay = resolvePx(orb.animation.amplitude_y, 'percent', w, h, 'y');
		var fx = orb.animation.frequency_x;
		var fy = orb.animation.frequency_y;
		var ph = orb.animation.phase || 0;

		var baseX = resolvePx(orb.position.x, orb.position.unit, w, h, 'x');
		var baseY = resolvePx(orb.position.y, orb.position.unit, w, h, 'y');
		var bw    = resolvePx(orb.size.w, orb.size.unit, w, h, 'x') * 0.5; // half-width radius
		var bh    = resolvePx(orb.size.h, orb.size.unit, w, h, 'y') * 0.5; // half-height radius

		var ox = 0, oy = 0;
		var type = orb.animation.type;

		if (type === 'drift') {
			// Compound harmonic — primary + irrational secondary (identical to kzs-animations.js)
			ox = (Math.sin(t * fx + ph) * 0.68 + Math.sin(t * fx * E + seed) * 0.32) * ax;
			oy = (Math.cos(t * fy + ph) * 0.68 + Math.cos(t * fy * PHI + seed + 1.4) * 0.32) * ay;
		} else if (type === 'orbit') {
			ox = Math.cos(t * fx + ph) * ax;
			oy = Math.sin(t * fy + ph) * ay;
		} else if (type === 'wave') {
			oy = Math.sin(t * fy + ph) * ay;
		} else if (type === 'figure8') {
			ox = Math.sin(t * fx + ph) * ax;
			oy = Math.sin(t * fy * 2 + ph) * ay * 0.5;
		}
		// 'pulse' and 'fixed' use no positional offset

		// Safe margin clamp — orb center stays within safeMarginPct% of container edge
		var smX  = w * (safeMarginPct / 100);
		var smY  = h * (safeMarginPct / 100);
		var posX = clamp(baseX + ox, smX, w - smX);
		var posY = clamp(baseY + oy, smY, h - smY);

		// Interactivity offset
		var depth = (orb.parallax || 0.5) * interStrength;

		if (interMode === 'parallax') {
			posX += mx * depth * w * 0.08;
			posY += my * depth * h * 0.06;
		} else if (interMode === 'repel' || interMode === 'attract') {
			// Gaussian force field (from kzs-shape-backgrounds.js wireframe distortion)
			var pointerX = (mx + 0.5) * w;
			var pointerY = (my + 0.5) * h;
			var dx = posX - pointerX;
			var dy = posY - pointerY;
			var r2 = (interRadius / 100) * Math.max(w, h);
			var force = Math.exp(-(dx * dx + dy * dy) / (r2 * r2)) * hover * depth;
			var dir = interMode === 'repel' ? 1 : -1;
			posX += dx * force * 0.08 * dir;
			posY += dy * force * 0.06 * dir;
		} else if (interMode === 'follow') {
			posX += mx * depth * w * 0.15;
			posY += my * depth * h * 0.12;
		}

		return { x: posX, y: posY, rx: bw, ry: bh };
	}

	/* ------------------------------------------------------------------ */
	/* Compute orb scale for pulse type                                     */
	/* ------------------------------------------------------------------ */

	function computeOrbScale(orb, t) {
		if (orb.animation.type !== 'pulse') return 1;
		return 1 + Math.sin(t * orb.animation.frequency_x + (orb.animation.phase || 0)) * (orb.animation.amplitude_x / 100);
	}

	/* ------------------------------------------------------------------ */
	/* Per-animation init                                                   */
	/* ------------------------------------------------------------------ */

	function initAnimation(el, cfg) {
		if (el.__spherexrReady) return;
		el.__spherexrReady = true;

		el.classList.add('spherexr-ready');

		// Create canvas
		var canvas = document.createElement('canvas');
		canvas.className = 'spherexr-canvas';
		canvas.setAttribute('aria-hidden', 'true');
		el.insertBefore(canvas, el.firstChild);

		var ctx = canvas.getContext('2d', { alpha: true });

		// Per-animation state
		var state = {
			w: 0, h: 0, dpr: 1,
			time: 0, lastTime: 0,
			running: false, visible: true,
			mouseX: 0, mouseY: 0,      // normalised -0.5 to 0.5
			targetX: 0, targetY: 0,
			hover: 0, targetHover: 0,
		};

		// Pre-compute orb seeds for drift
		var orbSeeds = (cfg.orbs || []).map(function (orb) { return hashSeed(orb.id || orb.color); });

		/* ---- Resize ---- */
		function resize() {
			var rect = el.getBoundingClientRect();
			var rawW = rect.width  || el.offsetWidth  || 0;
			var rawH = rect.height || el.offsetHeight || 0;
			// Use computed min-height as floor so dynamically-injected CSS is respected
			var minH = parseInt(window.getComputedStyle(el).minHeight, 10) || 0;
			var minW = parseInt(window.getComputedStyle(el).minWidth,  10) || 0;
			state.w   = Math.max(rawW, minW) || 300;
			state.h   = Math.max(rawH, minH) || 200;
			state.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
			canvas.width  = Math.round(state.w * state.dpr);
			canvas.height = Math.round(state.h * state.dpr);
			// Do NOT set canvas.style.width/height — CSS inset:0 controls display size.
			// Setting style.width/height conflicts with top+bottom anchoring and loses.

			if (DEBUG && state.h <= 1) {
				console.warn('[SphereXR] #' + cfg.animation_id + ' has height ' + state.h + 'px. Set a min-height on the container (Elementor → Advanced → Min Height, or CSS --spherexr-min-height).');
			}
		}

		/* ---- Animation loop ---- */
		var rafId = 0;

		function tick(now) {
			if (!state.running) return;

			var dt = Math.min(40, Math.max(0, now - (state.lastTime || now)));
			state.lastTime = now;

			var speed = (cfg.global && cfg.global.speed) || 1.0;
			state.time += dt * 0.001 * speed * (1 + state.hover * 0.35);

			// Ease mouse position (spring factor 0.055, from sm-effects.js)
			state.mouseX += (state.targetX - state.mouseX) * 0.055;
			state.mouseY += (state.targetY - state.mouseY) * 0.055;
			state.hover  += (state.targetHover - state.hover) * 0.045;

			// Pause if reduced motion and no hover activity
			if (reducedMotion && state.hover < 0.01 && state.targetHover < 0.01) {
				state.running = false;
				return;
			}

			draw();
			rafId = requestAnimationFrame(tick);
		}

		function start() {
			if (state.running || !state.visible) return;
			state.running  = true;
			state.lastTime = 0;
			rafId = requestAnimationFrame(tick);
		}

		function stop() {
			state.running = false;
			if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
		}

		/* ---- Draw scene ---- */
		function draw() {
			var w = state.w, h = state.h, t = state.time;
			ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);

			var g        = cfg.global || {};
			var blendMode = g.blend_mode || 'screen';
			var safeMargin = g.safe_margin || 0;
			var interact  = g.interactivity || {};
			var iEnabled  = interact.enabled && interact.mode !== 'none';
			var iMode     = iEnabled ? interact.mode : 'none';
			var iStrength = interact.strength || 0.5;
			var iRadius   = interact.radius   || 30;

			var mx = state.mouseX;
			var my = state.mouseY;
			var hover = state.hover;

			ctx.globalCompositeOperation = blendMode;

			var _orbsArr = cfg.orbs || [];
			for (var _oi = _orbsArr.length - 1; _oi >= 0; _oi--) {
				var orb   = _orbsArr[_oi];
				var seed  = orbSeeds[_oi] || 0;
				var scale = computeOrbScale(orb, t);

				var pos = computeOrbPos(
					orb, seed, t, w, h,
					safeMargin, mx, my, hover,
					iMode, iStrength, iRadius
				);

				var rx = pos.rx * scale;
				var ry = pos.ry * scale;

				ctx.save();
				ctx.filter = 'blur(' + orb.blur + 'px)';
				ctx.globalAlpha = clamp(orb.opacity, 0, 1);

				if (orb.shape === 'circle') {
					drawBlob(ctx, pos.x, pos.y, rx, ry, orb.color, 1, 0.08);
				} else if (orb.shape === 'double') {
					drawBlob(ctx, pos.x - rx * 0.25, pos.y, rx * 0.85, ry * 0.85, orb.color, 1, 0.12);
					drawBlob(ctx, pos.x + rx * 0.25, pos.y, rx * 0.85, ry * 0.85, orb.color_b || orb.color, 1, 0.12);
				} else if (orb.shape === 'triple') {
					drawBlob(ctx, pos.x,           pos.y - ry * 0.3, rx * 0.75, ry * 0.75, orb.color, 1, 0.10);
					drawBlob(ctx, pos.x - rx * 0.3, pos.y + ry * 0.2, rx * 0.75, ry * 0.75, orb.color_b || orb.color, 1, 0.10);
					drawBlob(ctx, pos.x + rx * 0.3, pos.y + ry * 0.2, rx * 0.75, ry * 0.75, orb.color_b || orb.color, 1, 0.10);
				} else if (orb.shape === 'blob') {
					// Morphing blob — slightly irregular ellipse with time-based deformation
					var blobRx = rx * (1 + Math.sin(t * 0.38 + seed) * 0.15);
					var blobRy = ry * (1 + Math.cos(t * 0.31 + seed + 1.2) * 0.15);
					drawBlob(ctx, pos.x, pos.y, blobRx, blobRy, orb.color, 1, 0.14);
				}

				ctx.restore();
			}

			// Reset composite
			ctx.globalCompositeOperation = 'source-over';
		}

		/* ---- Pointer events (passive, from sm-effects.js pattern) ---- */
		var lastPX = -1, lastPY = -1;

		el.addEventListener('pointerenter', function () {
			state.targetHover = 0.72;
			start();
		}, { passive: true });

		el.addEventListener('pointermove', function (e) {
			var rect = el.getBoundingClientRect();
			var nx = (e.clientX - rect.left) / rect.width  - 0.5;
			var ny = (e.clientY - rect.top)  / rect.height - 0.5;

			if (lastPX >= 0) {
				var dx  = e.clientX - lastPX;
				var dy  = e.clientY - lastPY;
				var vel = Math.min(Math.sqrt(dx * dx + dy * dy) / 30, 1);
				state.targetHover = 0.72 + vel * 0.28;
			}

			lastPX = e.clientX;
			lastPY = e.clientY;
			state.targetX = nx;
			state.targetY = ny;
			start();
		}, { passive: true });

		el.addEventListener('pointerleave', function () {
			state.targetHover = 0;
			state.targetX = 0;
			state.targetY = 0;
			lastPX = -1; lastPY = -1;
		}, { passive: true });

		/* ---- IntersectionObserver (pause when off-screen) ---- */
		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (entries) {
				state.visible = entries[0].isIntersecting;
				if (state.visible) {
					state.lastTime = 0;
					start();
				} else {
					stop();
				}
			}, { threshold: IO_THRESH });
			io.observe(el);
		}

		/* ---- ResizeObserver ---- */
		if ('ResizeObserver' in window) {
			var ro = new ResizeObserver(function () {
				resize();
				if (!state.running) start();
			});
			ro.observe(el);
		} else {
			window.addEventListener('resize', function () { resize(); }, { passive: true });
		}

		/* ---- Boot ---- */
		// Defer one rAF so dynamically-injected CSS (from detect script) is applied
		// before we measure the container height for the first time.
		requestAnimationFrame(function () {
			resize();
			start();

			if (DEBUG) {
				console.log('[SphereXR] Initialized #' + cfg.animation_id, {
					orbs: (cfg.orbs || []).length,
					speed: (cfg.global || {}).speed,
					blend: (cfg.global || {}).blend_mode,
					w: state.w,
					h: state.h,
				});
			}
		});
	}

	/* ------------------------------------------------------------------ */
	/* Boot all found animations                                            */
	/* ------------------------------------------------------------------ */

	function init() {
		animations.forEach(function (cfg) {
			var el = document.getElementById(cfg.animation_id);
			if (!el) return;
			initAnimation(el, cfg);
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
