<?php
namespace Yalogica\PicPoints;

defined('ABSPATH') || exit;

use Yalogica\PicPoints\Models\DataModel;
use Yalogica\PicPoints\System\Shortcode;

// $item is overloaded by parent code (Embed::renderEmbed / EmbedBlock::renderPreview);
if (!isset($item) || !is_array($item)) {
  $embed_id = intval(get_query_var('picpoints_embed')); 
  $item = DataModel::getItemPublic($embed_id);
}

if (empty($item) || $item['status'] !== 'publish') {
  http_response_code(404);
  die('Interactive map not found');
}

$upload_dir = wp_upload_dir();
$globals = [
  'data' => [
    'site_url' => get_option('siteurl'),
    'icons_url' => PICPOINTS_PLUGIN_URL . 'assets/icons/',
    'upload_url' => $upload_dir['baseurl'] . '/picpoints/',
  ],
  'api' => [
    'url' => esc_url_raw(rest_url(PICPOINTS_PLUGIN_PUBLIC_REST_URL))
  ]
];
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html($item['title']); ?></title>
    <link rel="stylesheet" href="<?php echo PICPOINTS_PLUGIN_URL . 'assets/components/player/'; ?>index.css?ver=<?php echo PICPOINTS_PLUGIN_VERSION; ?>">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; }
      .picpoints-player { width: 100% !important; height: 100% !important; }
    </style>
</head>
<body>
  <?php echo Shortcode::render(['id' => $item['id']]); ?>
  <script>
    window.yalogica_picpoints_global = <?php echo wp_json_encode($globals); ?>;
  </script>
  <script src="<?php echo PICPOINTS_PLUGIN_URL . 'assets/components/player/'; ?>index.js?ver=<?php echo PICPOINTS_PLUGIN_VERSION; ?>"></script>
</body>
</html>