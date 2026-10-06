<?php
defined('ABSPATH') || exit;

use Yalogica\PicPoints\Models\DataModel;
?>

<div class="picpoints-guide">
  <div class="picpoints-header">
    <div class="picpoints-title">
      <img width="40" src="<?php echo esc_url(PICPOINTS_PLUGIN_URL . 'assets/img/picpoints.png'); ?>" />
      <span>PicPoints<sup><?php echo sanitize_key(DataModel::getSup()); ?></sup> - </span>
      <span><?php esc_html_e("How To", "picpoints"); ?></span>
    </div>
  </div>
  <div class="picpoints-content">
    <p><a href="https://yalogica.com/maps/?utm_source=picpoints&amp;utm_medium=ref&amp;utm_campaign=showcases" rel="nofollow ugc">Showcases</a> | <a href="https://yalogica.com/docs/picpoints/?utm_source=picpoints&amp;utm_medium=ref&amp;utm_campaign=promo" rel="nofollow ugc">Documentation</a></p>
    <h2>How to create an interactive map</h2>
    <ol>
      <li>In the WordPress admin sidebar, go to "PicPoints" > "All Maps".</li>
      <li>Click the "Add New" button.</li>
      <li>Enter a title for your interactive map in the title field.</li>
      <li>Set the canvas size and image for a scene.</li>
      <li>Drag and drop markers, draw polygons and shapes.</li>
      <li>Add tooltips & popups for specific layers (markers, shapes).</li>
      <li>Click "Save" to store the map and "Publish" to make it available for use. It is now ready to be embedded anywhere on your site.</li>
    </ol>

    <h2>Publish with a shortcode</h2>
    <ol>
      <li>On the All Maps list, locate the "Shortcode" column and copy the code for your interactive map, e.g. [picpoints id="123"].</li>
      <li>Paste the shortcode into any post, page, or widget area that supports shortcodes.</li>
    </ol>

    <p>Shortcode attributes:</p>
    <ul>
      <li><code>id</code> - the ID of the interactive map (the interactive map should have a “publish” state)</li>
      <li><code>width</code> - any valid CSS value</li>
      <li><code>height</code> - any valid CSS value</li>
      <li><code>class</code> - CSS classes separated by spaces for styling the interactive map container</li>
      <li><code>sceneid</code> - the ID of the scene you want to load (if you want to override the default scene defined in the config file)</li>
    </ul>

    <h2>Video Tutorials</h2>
    <p>Watch our step-by-step video tutorials to learn how to create interactive maps, add markers and shapes, and publish them on your site.</p>

    <div class="picpoints-guide-video">
      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/videoseries?list=PLjoMJbnqiriR31tzlMRLr8zQ6ji5lZ3DE"
        title="YouTube video playlist"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen>
      </iframe>
    </div>
  </div>
</div>