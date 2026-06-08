/* SphereXR — Detect loader (~700 bytes min). Scans DOM for animation IDs, loads engine only if found. */
(function () {
	'use strict';

	// Guard against accidental double-include
	if (window.__spherexrDetectRan) return;
	window.__spherexrDetectRan = true;

	var cfgEl = document.getElementById('spherexr-config');
	if (!cfgEl) return;

	var cfg;
	try { cfg = JSON.parse(cfgEl.textContent || cfgEl.innerHTML); } catch (e) { return; }
	if (!cfg || !cfg.animations || !cfg.animations.length) return;

	var found = cfg.animations.filter(function (a) {
		return a.animation_id && !!document.getElementById(a.animation_id);
	});

	if (!found.length) return;

	var debug = cfg.settings && cfg.settings.debugMode;

	// Pass configs + global settings to engine
	window.SphereXRAnimations = found;
	window.SphereXRSettings   = cfg.settings || {};

	// Inject CSS
	if (cfg.cssUrl) {
		var link = document.createElement('link');
		link.rel  = 'stylesheet';
		link.href = cfg.cssUrl;
		link.onerror = function () { if (debug && window.console) console.error('[SphereXR] Failed to load CSS:', cfg.cssUrl); };
		document.head.appendChild(link);
	}

	// Inject core + engine in order. async=false forces ordered execution of
	// dynamically-inserted scripts (core must run before engine).
	function injectScript(src, label) {
		var script = document.createElement('script');
		script.src = src;
		script.async = false;
		script.onerror = function () { if (window.console) console.error('[SphereXR] Failed to load ' + label + ':', src); };
		document.head.appendChild(script);
	}

	if (cfg.coreUrl)   injectScript(cfg.coreUrl, 'core');
	if (cfg.engineUrl) injectScript(cfg.engineUrl, 'engine');

	if (debug && window.console) {
		console.log('[SphereXR] Found ' + found.length + ' animation(s) on page:', found.map(function (a) { return '#' + a.animation_id; }));
	}
})();
