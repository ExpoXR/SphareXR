/* SphereXR Core v1.0.0 — Shared animation math + canvas rendering.
   Single source of truth used by the public engine, the configurator preview
   and the dashboard modal preview. Exposed as window.SphereXRCore. */
(function () {
	'use strict';

	var TWO_PI = Math.PI * 2;

	/* Math constants (from child theme orb system) */
	var PHI = 1.61803; // Golden ratio — irrational harmonic secondary
	var E   = 2.71828; // Euler's number — secondary harmonic mixing

	/* ------------------------------------------------------------------ */
	/* Utilities                                                            */
	/* ------------------------------------------------------------------ */

	function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

	// Memoised hex → rgba string (colours/alpha repeat heavily across frames)
	var rgbaCache = {};
	function hexToRgba(hex, alpha) {
		var key = hex + '|' + alpha;
		var cached = rgbaCache[key];
		if (cached !== undefined) return cached;
		var r = parseInt(hex.slice(1, 3), 16) || 0;
		var g = parseInt(hex.slice(3, 5), 16) || 0;
		var b = parseInt(hex.slice(5, 7), 16) || 0;
		var out = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
		rgbaCache[key] = out;
		return out;
	}

	// Deterministic seed from string id (prevents sync between orbs)
	function hashSeed(str) {
		str = str || '';
		var h = 0;
		for (var i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
		return (h & 0xffff) / 0xffff * Math.PI * 6;
	}

	// Resolve a sized value with unit to px within a container
	function resolvePx(val, unit, containerW, containerH, axis) {
		if (unit === 'percent') return (val / 100) * (axis === 'x' ? containerW : containerH);
		if (unit === 'vw')      return (val / 100) * window.innerWidth;
		if (unit === 'vh')      return (val / 100) * window.innerHeight;
		return parseFloat(val); // px — use raw
	}

	// Memoised blur filter string (rebuilt only when the orb's blur changes)
	function blurFilter(orb) {
		if (orb._fblur !== orb.blur) {
			orb._fstr  = orb.blur > 0 ? 'blur(' + orb.blur + 'px)' : 'none';
			orb._fblur = orb.blur;
		}
		return orb._fstr;
	}

	/* ------------------------------------------------------------------ */
	/* Gradient cache (per-context)                                         */
	/*                                                                      */
	/* A unit-radius gradient (0..1) is created once per colour/alpha/core  */
	/* combination and re-used every frame. Canvas paints gradients under   */
	/* the current transform, so a single unit gradient scales to any orb   */
	/* size — eliminating per-frame createRadialGradient() calls.           */
	/* ------------------------------------------------------------------ */

	var gradCaches = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;

	function getGradient(ctx, color, alpha, coreStop) {
		var cache = gradCaches ? gradCaches.get(ctx) : null;
		if (!cache) { cache = {}; if (gradCaches) gradCaches.set(ctx, cache); }

		var key = color + '|' + alpha + '|' + coreStop;
		var grad = cache[key];
		if (!grad) {
			grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
			grad.addColorStop(0, hexToRgba(color, alpha));
			grad.addColorStop(coreStop + 0.46, hexToRgba(color, alpha * 0.68));
			grad.addColorStop(1, hexToRgba(color, 0));
			cache[key] = grad;
		}
		return grad;
	}

	/* Draw a single radial gradient blob (from sm-effects.js pattern) */
	function drawBlob(ctx, x, y, rx, ry, color, alpha, core) {
		var maxR = Math.max(rx, ry);
		if (maxR <= 0) return;
		var a = (alpha !== undefined) ? alpha : 1;
		var coreStop = (core !== undefined) ? core : 0.08;
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(rx, ry); // unit circle → ellipse (rx, ry); gradient scales with it
		ctx.fillStyle = getGradient(ctx, color, a, coreStop);
		ctx.beginPath();
		ctx.arc(0, 0, 1, 0, TWO_PI);
		ctx.fill();
		ctx.restore();
	}

	/* ------------------------------------------------------------------ */
	/* Animation math                                                       */
	/* ------------------------------------------------------------------ */

	function computeOrbScale(orb, t) {
		if (orb.animation.type !== 'pulse') return 1;
		return 1 + Math.sin(t * orb.animation.frequency_x + (orb.animation.phase || 0)) * (orb.animation.amplitude_x / 100);
	}

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
		var depth = (orb.parallax || 0.5) * (interStrength || 0);

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
		}

		return { x: posX, y: posY, rx: bw, ry: bh };
	}

	/* ------------------------------------------------------------------ */
	/* Composite orb draw (shape dispatch)                                  */
	/* Callers set globalCompositeOperation (blend mode) once before the    */
	/* loop; this handles per-orb blur + opacity + shape geometry.          */
	/* ------------------------------------------------------------------ */

	function drawOrb(ctx, orb, pos, scale, t, seed) {
		var rx = pos.rx * scale;
		var ry = pos.ry * scale;
		var x = pos.x, y = pos.y;

		ctx.save();
		ctx.filter = blurFilter(orb);
		ctx.globalAlpha = clamp(orb.opacity, 0, 1);

		var rotRad = ((orb.rotation || 0) * Math.PI) / 180;
		if (rotRad) {
			ctx.translate(x, y);
			ctx.rotate(rotRad);
			ctx.translate(-x, -y);
		}

		switch (orb.shape) {
			case 'double':
				drawBlob(ctx, x - rx * 0.25, y, rx * 0.85, ry * 0.85, orb.color, 1, 0.12);
				drawBlob(ctx, x + rx * 0.25, y, rx * 0.85, ry * 0.85, orb.color_b || orb.color, 1, 0.12);
				break;
			case 'triple':
				drawBlob(ctx, x,            y - ry * 0.3, rx * 0.75, ry * 0.75, orb.color, 1, 0.10);
				drawBlob(ctx, x - rx * 0.3, y + ry * 0.2, rx * 0.75, ry * 0.75, orb.color_b || orb.color, 1, 0.10);
				drawBlob(ctx, x + rx * 0.3, y + ry * 0.2, rx * 0.75, ry * 0.75, orb.color_b || orb.color, 1, 0.10);
				break;
			case 'blob':
				// Morphing blob — slightly irregular ellipse with time-based deformation
				var brx = rx * (1 + Math.sin(t * 0.38 + seed) * 0.15);
				var bry = ry * (1 + Math.cos(t * 0.31 + seed + 1.2) * 0.15);
				drawBlob(ctx, x, y, brx, bry, orb.color, 1, 0.14);
				break;
			default: // circle
				drawBlob(ctx, x, y, rx, ry, orb.color, 1, 0.08);
		}

		ctx.restore();
	}

	window.SphereXRCore = {
		PHI: PHI,
		E: E,
		clamp: clamp,
		hexToRgba: hexToRgba,
		hashSeed: hashSeed,
		resolvePx: resolvePx,
		blurFilter: blurFilter,
		drawBlob: drawBlob,
		computeOrbScale: computeOrbScale,
		computeOrbPos: computeOrbPos,
		drawOrb: drawOrb,
	};
})();
