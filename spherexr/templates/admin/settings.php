<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div class="wrap spherexr-wrap">

	<div class="spherexr-header">
		<h1><?php esc_html_e( 'SphereXR Settings', 'spherexr' ); ?></h1>
	</div>

	<?php settings_errors( 'spherexr_settings_group' ); ?>

	<form method="post" action="options.php">
		<?php settings_fields( 'spherexr_settings_group' ); ?>
		<?php do_settings_sections( 'spherexr-settings' ); ?>
		<?php submit_button(); ?>
	</form>

	<hr>
	<p class="description">
		<?php printf(
			/* translators: %s: plugin version */
			esc_html__( 'SphereXR v%s — Built by Ayal Othman / ExpoXR', 'spherexr' ),
			esc_html( SPHEREXR_VERSION )
		); ?>
		&nbsp;&mdash;&nbsp;<a href="https://expoxr.com" target="_blank" rel="noopener">expoxr.com</a>
	</p>

</div>
