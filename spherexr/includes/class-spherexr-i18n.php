<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SphereXR_i18n {

	public function load_plugin_textdomain() {
		load_plugin_textdomain(
			'spherexr',
			false,
			dirname( plugin_basename( SPHEREXR_PLUGIN_FILE ) ) . '/languages/'
		);
	}
}
