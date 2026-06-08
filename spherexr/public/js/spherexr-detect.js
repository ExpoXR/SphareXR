/* SphereXR — Detect loader (~600 bytes min). Scans DOM for animation IDs, loads engine only if found. */
(function () {
	'use strict';

	var cfgEl = document.getElementById('spherexr-config');
	if (!cfgEl) return;

	var cfg;
	try { cfg = JSON.parse(cfgEl.textContent || cfgEl.innerHTML); } catch (e) { return; }
	if (!cfg || !cfg.animations || !cfg.animations.length) return;

	var found = cfg.animations.filter(function (a) {
		return a.animation_id && !!document.getElementById(a.animation_id);
	});

	if (!found.length) return;

	// Pass configs + global settings to engine
	window.SphereXRAnimations = found;
	window.SphereXRSettings   = cfg.settings || {};

	// Inject CSS
	var link = document.createElement('link');
	link.rel  = 'stylesheet';
	link.href = cfg.cssUrl;
	document.head.appendChild(link);

	// Inject engine script
	var script = document.createElement('script');
	script.src = cfg.engineUrl;
	document.head.appendChild(script);

	if (cfg.settings && cfg.settings.debugMode) {
		console.log('[SphereXR] Found ' + found.length + ' animation(s) on page:', found.map(function (a) { return '#' + a.animation_id; }));
	}
})();
