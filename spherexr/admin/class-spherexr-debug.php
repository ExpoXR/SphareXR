<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SphereXR_Debug {

	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'spherexr' ) );
		}

		$posts = get_posts( array(
			'post_type'   => 'spherexr_animation',
			'post_status' => array( 'publish', 'draft' ),
			'numberposts' => -1,
		) );

		$animations = array();
		foreach ( $posts as $post ) {
			$raw    = get_post_meta( $post->ID, '_spherexr_config', true );
			$config = $raw ? json_decode( $raw, true ) : array();
			$animations[] = array(
				'id'        => $post->ID,
				'title'     => $post->post_title,
				'config'    => $config,
				'raw'       => $raw,
				'active'    => ! empty( $config['active'] ),
				'anim_id'   => $config['animation_id'] ?? '',
				'orb_count' => count( $config['orbs'] ?? array() ),
			);
		}

		$system = array(
			'php_version' => PHP_VERSION,
			'wp_version'  => get_bloginfo( 'version' ),
			'theme'       => get_stylesheet(),
			'plugin_ver'  => SPHEREXR_VERSION,
			'engine_url'  => SPHEREXR_PLUGIN_URL . 'public/js/spherexr-engine.js',
			'detect_url'  => SPHEREXR_PLUGIN_URL . 'public/js/spherexr-detect.js',
			'css_url'     => SPHEREXR_PLUGIN_URL . 'public/css/spherexr.css',
			'rest_url'    => rest_url( 'spherexr/v1' ),
			'settings'    => get_option( 'spherexr_settings', array() ),
		);

		include SPHEREXR_PLUGIN_DIR . 'templates/admin/debug.php';
	}
}
