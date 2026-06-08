# SphereXR

A powerful WordPress plugin for creating and managing canvas-based orb background animations with Elementor integration.

## Description

SphereXR enables you to create stunning, interactive canvas-based orb background animations that can be easily attached to any Elementor section using CSS IDs. Perfect for adding dynamic visual elements to your website without performance overhead.

### Features

- **Canvas-Based Animations**: Lightweight, GPU-accelerated orb animations
- **Elementor Integration**: Seamlessly attach animations to any Elementor section by CSS ID
- **Animation Manager**: Create, edit, and manage multiple animations
- **Visual Configurator**: Intuitive interface to customize animation properties
- **REST API**: Full REST API support for programmatic animation management
- **Custom Post Type**: Dedicated post type for storing animation configurations
- **Debug Tools**: Built-in debugging interface for troubleshooting
- **Internationalization**: Full multilingual support (i18n)
- **Settings Panel**: Centralized settings management
- **Performance Optimized**: Minimal footprint with efficient asset loading

## Installation

1. Download the plugin from the [GitHub repository](https://github.com/ExpoXR/SphareXR)
2. Upload the `spherexr` folder to `/wp-content/plugins/`
3. Activate the plugin through the WordPress admin panel
4. Navigate to **SphereXR** in the WordPress admin menu to start creating animations

## Usage

### Creating an Animation

1. Go to **SphereXR > New Animation**
2. Use the visual configurator to set up your animation
3. Configure animation properties (colors, speed, size, etc.)
4. Save the animation

### Attaching to Elementor Sections

1. Add the CSS ID to your Elementor section (e.g., `sphere-background`)
2. The animation will automatically render as the background
3. Multiple animations can be attached to different sections

### REST API

The plugin provides REST API endpoints for animation management:

- `GET /wp-json/spherexr/v1/animations` - Get all animations
- `POST /wp-json/spherexr/v1/animations` - Create new animation
- `GET /wp-json/spherexr/v1/animations/{id}` - Get specific animation
- `PUT /wp-json/spherexr/v1/animations/{id}` - Update animation
- `DELETE /wp-json/spherexr/v1/animations/{id}` - Delete animation

## Project Structure

```
spherexr/
├── spherexr.php                 # Main plugin file
├── uninstall.php                # Plugin uninstall handler
├── admin/                        # Admin interface
│   ├── class-spherexr-admin.php
│   ├── class-spherexr-dashboard.php
│   ├── class-spherexr-configurator.php
│   ├── class-spherexr-settings.php
│   ├── class-spherexr-debug.php
│   ├── css/
│   │   ├── admin.css
│   │   └── configurator.css
│   └── js/
│       ├── admin.js
│       └── configurator.js
├── includes/                    # Core functionality
│   ├── class-spherexr-loader.php
│   ├── class-spherexr-activator.php
│   ├── class-spherexr-deactivator.php
│   ├── class-spherexr-i18n.php
│   ├── class-spherexr-cpt.php
│   ├── class-spherexr-public.php
│   └── class-spherexr-rest.php
├── public/                      # Frontend assets
│   ├── css/
│   │   └── spherexr.css
│   └── js/
│       ├── spherexr-detect.js
│       └── spherexr-engine.js
├── templates/                   # Template files
│   └── admin/
│       ├── configurator.php
│       ├── dashboard.php
│       ├── debug.php
│       └── settings.php
└── languages/                   # Translation files

```

## Core Components

### Admin Classes

- **SphereXR_Admin**: Manages admin menu pages and asset enqueuing
- **SphereXR_Dashboard**: Main dashboard for viewing all animations
- **SphereXR_Configurator**: Visual animation editor
- **SphereXR_Settings**: Plugin settings management
- **SphereXR_Debug**: Debugging interface

### Includes Classes

- **SphereXR_Loader**: Main plugin loader and hook orchestrator
- **SphereXR_Activator**: Plugin activation handling
- **SphereXR_Deactivator**: Plugin deactivation handling
- **SphereXR_i18n**: Internationalization support
- **SphereXR_CPT**: Custom Post Type registration
- **SphereXR_Public**: Frontend functionality
- **SphereXR_REST**: REST API endpoints

### Public Assets

- **spherexr-detect.js**: Detects animation containers on page
- **spherexr-engine.js**: Renders canvas animations
- **spherexr.css**: Frontend styling

## Requirements

- WordPress 5.0+
- Elementor (optional, for easier integration)
- PHP 7.4+

## Development

### Getting Started

1. Clone the repository
2. Navigate to the plugin directory
3. Make your changes
4. Test in a WordPress installation with Elementor

### Code Standards

The plugin follows WordPress coding standards:
- PHP code follows [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- JavaScript uses standard WordPress practices
- CSS is modular and prefixed with `spherexr-`

## License

This project is licensed under the GPL-2.0+ License. See [LICENSE](https://www.gnu.org/licenses/gpl-2.0.txt) for details.

## Author

**Ayal Othman**  
Website: [https://expoxr.com](https://expoxr.com)

## Support

For issues, feature requests, or questions, please visit the [GitHub Issues](https://github.com/ExpoXR/SphareXR/issues) page.

## Changelog

### Version 1.0.0
- Initial release
- Canvas-based orb animations
- Elementor integration
- Admin dashboard and configurator
- REST API support
- Internationalization support

---

**SphereXR** - Bringing dynamic canvas animations to WordPress.
