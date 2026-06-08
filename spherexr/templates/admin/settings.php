<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div class="wrap spherexr-wrap">

	<?php
	SphereXR_Dashboard::render_header(
		__( 'Settings', 'spherexr' )
	);
	?>

	<?php settings_errors( 'spherexr_settings_group' ); ?>

	<div class="sxr-page-card">
		<form method="post" action="options.php" class="spherexr-settings-form">
			<?php settings_fields( 'spherexr_settings_group' ); ?>
			<?php do_settings_sections( 'spherexr-settings' ); ?>
			<?php submit_button( __( 'Save Settings', 'spherexr' ) ); ?>
		</form>
	</div>

	<p class="spherexr-settings-footer">
		<?php printf(
			/* translators: %s: plugin version */
			esc_html__( 'SphereXR v%s — Built by Ayal Othman / ExpoXR', 'spherexr' ),
			esc_html( SPHEREXR_VERSION )
		); ?>
		&nbsp;&mdash;&nbsp;<a href="https://expoxr.com" target="_blank" rel="noopener">expoxr.com</a>
	</p>

</div>
