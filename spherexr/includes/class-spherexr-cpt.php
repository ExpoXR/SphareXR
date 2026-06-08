<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SphereXR_CPT {

	public static function register() {
		$labels = array(
			'name'          => __( 'SphereXR Animations', 'spherexr' ),
			'singular_name' => __( 'Animation', 'spherexr' ),
			'add_new_item'  => __( 'Add New Animation', 'spherexr' ),
			'edit_item'     => __( 'Edit Animation', 'spherexr' ),
			'search_items'  => __( 'Search Animations', 'spherexr' ),
			'not_found'     => __( 'No animations found.', 'spherexr' ),
		);

		register_post_type( 'spherexr_animation', array(
			'labels'              => $labels,
			'public'              => false,
			'show_ui'             => false,
			'show_in_menu'        => false,
			'show_in_rest'        => true,
			'has_archive'         => false,
			'hierarchical'        => false,
			'rewrite'             => false,
			'supports'            => array( 'title' ),
			'capability_type'     => 'post',
		) );
	}

	/**
	 * Return all active animation configs as array.
	 */
	public static function get_active_configs() {
		$posts = get_posts( array(
			'post_type'   => 'spherexr_animation',
			'post_status' => 'publish',
			'numberposts' => -1,
		) );

		$configs = array();
		foreach ( $posts as $post ) {
			$raw = get_post_meta( $post->ID, '_spherexr_config', true );
			if ( ! $raw ) continue;
			$config = json_decode( $raw, true );
			if ( ! is_array( $config ) ) continue;
			if ( empty( $config['active'] ) ) continue;
			if ( empty( $config['animation_id'] ) ) continue;
			$configs[] = $config;
		}

		return $configs;
	}

	/**
	 * Sanitize and validate a config array before saving.
	 */
	public static function sanitize_config( $raw ) {
		if ( ! is_array( $raw ) ) return false;

		$allowed_blend  = SphereXR_Schema::BLEND_MODES;
		$allowed_modes  = SphereXR_Schema::INTERACTIVITY_MODES;
		$allowed_shapes = SphereXR_Schema::SHAPES;
		$allowed_anims  = SphereXR_Schema::ANIM_TYPES;
		$allowed_units  = SphereXR_Schema::UNITS;
		$allowed_cmodes = SphereXR_Schema::COLOR_MODES;

		$animation_id = sanitize_title( $raw['animation_id'] ?? '' );
		if ( ! $animation_id ) return false;

		$global = $raw['global'] ?? array();
		$interactivity = $global['interactivity'] ?? array();

		$config = array(
			'animation_id' => $animation_id,
			'active'       => ! empty( $raw['active'] ),
			'global'       => array(
				'speed'       => self::clamp_float( $global['speed'] ?? 1.0, 0.1, 10.0 ),
				'safe_margin' => self::clamp_int( $global['safe_margin'] ?? 5, 0, 30 ),
				'blend_mode'  => in_array( $global['blend_mode'] ?? 'screen', $allowed_blend, true )
				                 ? $global['blend_mode'] : 'screen',
				'interactivity' => array(
					'enabled'  => ! empty( $interactivity['enabled'] ),
					'mode'     => in_array( $interactivity['mode'] ?? 'parallax', $allowed_modes, true )
					              ? $interactivity['mode'] : 'parallax',
					'strength' => self::clamp_float( $interactivity['strength'] ?? 0.5, 0.0, 1.0 ),
					'radius'   => self::clamp_int( $interactivity['radius'] ?? 30, 5, 80 ),
				),
			),
			'orbs' => array(),
		);

		$raw_orbs = array_slice( (array) ( $raw['orbs'] ?? array() ), 0, 20 );
		foreach ( $raw_orbs as $orb ) {
			$anim = $orb['animation'] ?? array();
			$size = $orb['size'] ?? array();
			$pos  = $orb['position'] ?? array();

			$sanitized_orb = array(
				'id'         => sanitize_key( $orb['id'] ?? uniqid( 'o' ) ),
				'shape'      => in_array( $orb['shape'] ?? 'circle', $allowed_shapes, true )
				               ? $orb['shape'] : 'circle',
				'color'      => sanitize_hex_color( $orb['color'] ?? '#38a3d7' ) ?: '#38a3d7',
				'color_mode' => in_array( $orb['color_mode'] ?? 'solid', $allowed_cmodes, true )
				               ? $orb['color_mode'] : 'solid',
				'color_b'    => sanitize_hex_color( $orb['color_b'] ?? '' ) ?: '',
				'size'       => array(
					'w'    => self::clamp_float( $size['w'] ?? 40, 1, 200 ),
					'h'    => self::clamp_float( $size['h'] ?? 40, 1, 200 ),
					'unit' => in_array( $size['unit'] ?? 'percent', $allowed_units, true )
					          ? $size['unit'] : 'percent',
				),
				'position' => array(
					'x'    => self::clamp_float( $pos['x'] ?? 50, 0, 100 ),
					'y'    => self::clamp_float( $pos['y'] ?? 50, 0, 100 ),
					'unit' => in_array( $pos['unit'] ?? 'percent', $allowed_units, true )
					          ? $pos['unit'] : 'percent',
				),
				'blur'    => self::clamp_int( $orb['blur'] ?? 72, 0, 200 ),
				'opacity' => self::clamp_float( $orb['opacity'] ?? 0.8, 0.0, 1.0 ),
				'animation' => array(
					'type'        => in_array( $anim['type'] ?? 'drift', $allowed_anims, true )
					                 ? $anim['type'] : 'drift',
					'amplitude_x' => self::clamp_float( $anim['amplitude_x'] ?? 5, 0, 50 ),
					'amplitude_y' => self::clamp_float( $anim['amplitude_y'] ?? 5, 0, 50 ),
					'frequency_x' => self::clamp_float( $anim['frequency_x'] ?? 0.4, 0.05, 5.0 ),
					'frequency_y' => self::clamp_float( $anim['frequency_y'] ?? 0.5, 0.05, 5.0 ),
					'phase'       => self::clamp_float( $anim['phase'] ?? 0.0, 0.0, 6.2832 ),
				),
				'parallax' => self::clamp_float( $orb['parallax'] ?? 0.5, 0.0, 1.0 ),
			);

			$config['orbs'][] = $sanitized_orb;
		}

		return $config;
	}

	private static function clamp_float( $val, $min, $max ) {
		return max( $min, min( $max, (float) $val ) );
	}

	private static function clamp_int( $val, $min, $max ) {
		return max( $min, min( $max, (int) $val ) );
	}
}
