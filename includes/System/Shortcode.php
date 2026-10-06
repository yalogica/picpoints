<?php
namespace Yalogica\PicPoints\System;

defined('ABSPATH') || exit;

use Yalogica\PicPoints\Models\DataModel;
use Yalogica\PicPoints\Lib\Utils;

class Shortcode {
  public function __construct() {
    add_action('init', [$this, 'init']);
  }

  public function init() {
    add_shortcode(PICPOINTS_SHORTCODE_NAME, [$this, 'run']);
  }

  public function run( $attributes = [] ) {
    self::enqueuePlayerAssets();
    
    return self::render($attributes);
  }

  public static function enqueuePlayerAssets() {
    wp_enqueue_style('picpoints-shortcode', PICPOINTS_PLUGIN_URL . 'assets/components/player/index.css', [], PICPOINTS_PLUGIN_VERSION, 'all');
    wp_enqueue_script('picpoints-shortcode', PICPOINTS_PLUGIN_URL . 'assets/components/player/index.js', [], PICPOINTS_PLUGIN_VERSION, true);
    wp_localize_script('picpoints-shortcode', 'yalogica_picpoints_global', self::getGlobals());
  }

  public static function render( $attributes = [] ) {
    // Normalize keys and apply defaults
    $attributes = array_change_key_case((array) $attributes, CASE_LOWER);
    $defaults   = [
      'id'      => null,
      'width'   => '100%',
      'height'  => '400px',
      'class'   => '',
      'sceneid' => ''
    ];
    $atts = shortcode_atts($defaults, $attributes);

    // Sanitize and extract values
    $id = intval($atts['id'], 10);
    $width = Utils::sanitizeCssLength($atts['width'], null);
    $height = Utils::sanitizeCssLength($atts['height'], null);
    $class = sanitize_html_class($atts['class']);
    $sceneid = sanitize_key($atts['sceneid']);

    $styleEmpty = "padding:10px;background:#ffeed0;color:#774e09;border:1px dashed #cf8507;border-radius:5px;font-size:14px;";

    if (empty($id)) {
      return "<div style='{$styleEmpty}'>" . esc_html__('PicPoints: interactive map ID not defined.', 'picpoints') . "</div>";
    }

    $item = DataModel::getItemPublic($id);
    if (empty($item)) {
      return "<div style='{$styleEmpty}'>" . esc_html__('PicPoints: interactive map not found.', 'picpoints') . "</div>";
    }

    if ($item['status'] !== 'publish') {
      return;
    }

    $classes = array_filter([
      'picpoints-player',
      $class,
    ]);

    // // Build inline CSS dynamically
    $css_rules = [];

    if ($width)  $css_rules[] = "width: {$width};";
    if ($height) $css_rules[] = "height: {$height};";

    $config = $item['config'] ?? [];

    if (!empty($config['viewerStyle'])) {
      if (!empty($config['viewerStyle']['background'])) {
        $css_rules[] = "background-color: {$config['viewerStyle']['background']};";
      }
      if (!empty($config['viewerStyle']['radius'])) {
        $css_rules[] = "border-radius: {$config['viewerStyle']['radius']}px;";
      }
    }

    $id = esc_attr($id);
    $classes = esc_attr(implode(' ', $classes));

    // Generate style tag if CSS rules exist
    $style_tag = '';
    if (!empty($css_rules)) {
      $selector = ".picpoints-player[data-id='{$id}']";
      $css = $selector . " {\n\t" . implode("\n\t", $css_rules) . "\n}";
      $style_tag = '<style>' . PHP_EOL . $css . PHP_EOL . '</style>' . PHP_EOL;
    }

    $sceneIdAttr = $sceneid ? "data-scene-id='{$sceneid}'" : '';
    $classAttr = $classes ? "class='{$classes}'" : '';

    $output  = $style_tag;
    $output .= "<div data-id='{$id}' {$sceneIdAttr} {$classAttr} role='application' aria-label='PicPoints Player'>";
    $output .= "</div>";

    return $output;
  }

  private static function getGlobals() {
    $upload_dir = wp_upload_dir();

    $data = [
      'site_url' => get_option('siteurl'),
      'icons_url' => PICPOINTS_PLUGIN_URL . 'assets/icons/',
      'upload_url' => $upload_dir['baseurl'] . '/picpoints/',
    ];

    return [
      'data' => $data,
      'api' => [
        'url' => esc_url_raw( rest_url( PICPOINTS_PLUGIN_PUBLIC_REST_URL ) )
      ]
    ];
  }
}