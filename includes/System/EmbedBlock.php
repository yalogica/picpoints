<?php
namespace Yalogica\PicPoints\System;

defined('ABSPATH') || exit;

use Yalogica\PicPoints\Models\DataModel;
use Yalogica\PicPoints\Models\AccessModel;

class EmbedBlock {
  public function __construct() {
    add_action('init', [$this, 'init']);
    add_action('admin_post_picpoints_embed_block_preview', [$this, 'renderPreview']);
  }

  public function init() {
    if (!function_exists('register_block_type')) {
      return;
    }

    wp_register_script(
      'picpoints-embed-block-editor',
      PICPOINTS_PLUGIN_URL . 'blocks/gutenberg/map-embed/index.js',
      ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-api-fetch'],
      PICPOINTS_PLUGIN_VERSION,
      true
    );
    wp_set_script_translations('picpoints-embed-block-editor', 'picpoints');

    wp_localize_script('picpoints-embed-block-editor', 'yalogica_picpoints_gutenberg_block', [
      'optionsUrl'  => esc_url_raw(rest_url(PICPOINTS_PLUGIN_REST_URL . '/maps/options')),
      'dataUrl'     => esc_url_raw(rest_url(PICPOINTS_PLUGIN_PUBLIC_REST_URL . '/maps/')),
      'previewUrl'  => esc_url_raw(admin_url('admin-post.php?action=picpoints_embed_block_preview')),
      'editUrl'     => esc_url_raw(admin_url('admin.php?page=picpoints&action=edit&id=')),
      'canEdit'     => AccessModel::currentUserHasAccess(),
    ]);

    register_block_type(PICPOINTS_PLUGIN_PATH . '/blocks/gutenberg/map-embed', [
      'render_callback' => [$this, 'render'],
    ]);
  }

  public function render($attributes, $content = '', $block = null) {
    $mapId = isset($attributes['mapId']) ? intval($attributes['mapId'], 10) : 0;

    if ($mapId <= 0) {
      return '';
    }

    $item = DataModel::getItemPublic($mapId);

    if (empty($item) || $item['status'] !== 'publish') {
      return '';
    }

    Shortcode::enqueuePlayerAssets();

    $shortcodeAtts = ['id' => $mapId];

    if (!empty($attributes['width'])) {
      $shortcodeAtts['width'] = (string) $attributes['width'];
    }
    if (!empty($attributes['height'])) {
      $shortcodeAtts['height'] = (string) $attributes['height'];
    }
    if (!empty($attributes['sceneid'])) {
      $shortcodeAtts['sceneid'] = (string) $attributes['sceneid'];
    }

    return '<div ' . get_block_wrapper_attributes() . '>' . Shortcode::render($shortcodeAtts) . '</div>';
  }

  public function renderPreview() {
    if (!current_user_can('edit_posts')) {
      wp_die(
        esc_html__('Sorry, you are not allowed to access this page.', 'picpoints'),
        esc_html__('Access Denied', 'picpoints'),
        403
      );
    }

    nocache_headers();
    header('X-Robots-Tag: noindex, nofollow');

    $id = isset($_GET['id']) ? absint($_GET['id']) : 0;
    $item = $id > 0 ? DataModel::getItemPublic($id) : null;

    if (empty($item) || $item['status'] !== 'publish') {
      status_header(404);
      die('Map not found');
    }

    require_once PICPOINTS_PLUGIN_PATH . '/includes/Views/embed.php';
  }
}