<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SphereXR_Configurator {

	public function render() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'spherexr' ) );
		}

		$post_id = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0;
		$post    = $post_id ? get_post( $post_id ) : null;
		$is_new  = ! $post || $post->post_type !== 'spherexr_animation';
		$config  = array();

		if ( ! $is_new ) {
			$raw    = get_post_meta( $post->ID, '_spherexr_config', true );
			$config = $raw ? json_decode( $raw, true ) : array();
		}

		$settings = get_option( 'spherexr_settings', array() );

		if ( $is_new ) {
			$config = array(
				'animation_id' => '',
				'active'       => true,
				'global'       => array(
					'speed'       => (float) ( $settings['default_speed'] ?? 1.0 ),
					'safe_margin' => (int) ( $settings['default_safe_margin'] ?? 5 ),
					'blend_mode'  => $settings['default_blend_mode'] ?? 'screen',
					'interactivity' => array(
						'enabled'  => true,
						'mode'     => 'parallax',
						'strength' => 0.5,
						'radius'   => 30,
					),
				),
				'orbs' => array(),
			);
		}

		include SPHEREXR_PLUGIN_DIR . 'templates/admin/configurator.php';
	}
}
