<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class SphereXR_Deactivator {

	public static function deactivate() {
		flush_rewrite_rules();
	}
}
