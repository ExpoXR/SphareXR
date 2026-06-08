<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SphereXR_Dashboard {

	public function render() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'spherexr' ) );
		}

		$posts = get_posts( array(
			'post_type'   => 'spherexr_animation',
			'post_status' => array( 'publish', 'draft' ),
			'numberposts' => -1,
			'orderby'     => 'date',
			'order'       => 'DESC',
		) );

		$animations = array();
		foreach ( $posts as $post ) {
			$raw    = get_post_meta( $post->ID, '_spherexr_config', true );
			$config = $raw ? json_decode( $raw, true ) : array();
			$animations[] = array(
				'post'      => $post,
				'config'    => $config,
				'active'    => ! empty( $config['active'] ),
				'orb_count' => count( $config['orbs'] ?? array() ),
				'anim_id'   => $config['animation_id'] ?? '',
			);
		}

		include SPHEREXR_PLUGIN_DIR . 'templates/admin/dashboard.php';
	}
}
