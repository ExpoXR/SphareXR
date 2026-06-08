<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Single source of truth for allowed enum values used across config
 * sanitization (SphereXR_CPT), plugin settings (SphereXR_Settings) and the
 * admin UI <select> option lists. Keeps validation and UI from drifting apart.
 */
class SphereXR_Schema {

	const BLEND_MODES        = array( 'screen', 'normal', 'multiply', 'overlay', 'lighten', 'hard-light' );
	const SHAPES             = array( 'circle', 'double', 'triple', 'blob' );
	const ANIM_TYPES         = array( 'drift', 'orbit', 'pulse', 'wave', 'fixed', 'figure8' );
	const UNITS              = array( 'percent', 'px', 'vw', 'vh' );
	const COLOR_MODES        = array( 'solid', 'dual', 'gradient' );
	const INTERACTIVITY_MODES = array( 'parallax', 'repel', 'attract', 'follow', 'none' );
}
