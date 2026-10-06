<?php
/**
 * Plugin Name:       PicPoints - Interactive Image Map & Hotspot Builder
 * Plugin URI:        https://yalogica.com/picpoints
 * Description:       Create responsive interactive images, online soundboard maps, and image hotspots with tooltips or sound effects. Easy SVG builder without coding
 * Version:           1.21.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Yalogica
 * Author URI:        https://yalogica.com
 * License:           GPLv3
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       picpoints
 * Domain Path:       /languages
 */
namespace Yalogica\PicPoints;

defined('ABSPATH') || exit;

define('PICPOINTS_PLUGIN_NAME', 'picpoints');
define('PICPOINTS_PLUGIN_VERSION', '1.21.1');
define('PICPOINTS_PLUGIN_BASE_NAME', plugin_basename(__FILE__));
define('PICPOINTS_PLUGIN_PATH', __DIR__);
define('PICPOINTS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PICPOINTS_PLUGIN_REST_URL', 'picpoints/v1');
define('PICPOINTS_PLUGIN_PUBLIC_REST_URL', 'picpoints/public/v1');
define('PICPOINTS_SHORTCODE_NAME', 'picpoints');
define('PICPOINTS_DOCS_URL', 'https://yalogica.com/docs/picpoints/');

require_once(__DIR__ . '/vendor/autoload.php');
require_once(__DIR__ . '/includes/autoload.php');

register_activation_hook(__FILE__, ['Yalogica\PicPoints\System\Embed', 'activate']);

if (function_exists('picpoints_fs')) {
  picpoints_fs()->set_basename(false, __FILE__);
} else {
  // Create a helper function for easy SDK access.
  function picpoints_fs() {
    global $picpoints_fs;

    if (! isset($picpoints_fs)) {
      // Include Freemius SDK.
      require_once dirname( __FILE__ ) . '/vendor/freemius/wordpress-sdk/start.php';

      $picpoints_fs = \fs_dynamic_init([
        'id'                  => '30659',
        'type'                => 'plugin',
        'slug'                => 'picpoints',
        'premium_slug'        => 'picpoints-pro',
        'public_key'          => 'pk_c8ab4207e39ddb1a9d9ec17d31ac0',
        'premium_suffix'      => 'Pro',
        'is_premium'          => false,
        'has_addons'          => false,
        'has_paid_plans'      => true,
        'is_org_compliant'    => true,
        'trial' => [
          'days' => 7,
          'is_require_payment' => false,
        ],
        'menu' => [
          'slug'    => 'picpoints',
          'support' => false,
          'contact' => true,
        ],
        'is_live'             => true,
      ]);
    }

    $picpoints_fs->add_filter( 'pricing/show_annual_in_monthly', '__return_false');
    $picpoints_fs->add_filter( 'plugin_icon', function () {
      return dirname(__FILE__) . '/assets/img/picpoints.png';
    });

    return $picpoints_fs;
  }
  
  // Init Freemius.
  picpoints_fs();
  // Signal that SDK was initiated.
  do_action('picpoints_fs_loaded'); 

  Plugin::run();
}