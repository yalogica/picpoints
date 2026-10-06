<?php
namespace Yalogica\PicPoints\System;

defined('ABSPATH') || exit;

use Yalogica\PicPoints\Models\DataModel;
use Yalogica\PicPoints\Models\AccessModel;

class Admin
{
  private const NOTICE_META_KEY = '_picpoints_admin_notice_hide_until';
  private const NOTICE_NONCE_ACTION = 'picpoints_dismiss_admin_notice';

  public function __construct()
  {
    add_action('init', [$this, 'init']);
    add_action('admin_init', [$this, 'redirect']);
  }

  public function init()
  {
    $this->registerPostType();

    if (!is_admin()) {
      return;
    }

    if (AccessModel::currentUserHasAccess()) {
      add_action('admin_menu', [$this, 'adminMenu']);
      add_filter('submenu_file', [$this, 'highlightAdminMenu'], 10, 2);

      add_action('admin_notices', [$this, 'adminNotices']);
      add_action('admin_enqueue_scripts', [$this, 'adminNoticesScripts']);
      add_action('wp_ajax_picpoints_dismiss_admin_notice', [$this, 'adminNoticesAjaxDismiss']);
    }
  }

  public function registerPostType()
  {
    $labels = [
      'name' => esc_html__('PicPoints Items', 'picpoints'),
      'singular_name' => esc_html__('PicPoints Item', 'picpoints'),
    ];
    $args = [
      'labels' => $labels,
      'public' => false,  // removes the permalink option
      'publicly_queryable' => false, // remove preview page
      'exclude_from_search' => true,
      'show_ui' => false,
      'show_in_menu' => false,
      'show_in_rest' => false,
      'rewrite' => false,
      'query_var' => false,
      'capability_type' => 'post',
      'has_archive' => false,
      'hierarchical' => false,
      'supports' => ['title']
    ];

    register_post_type(DataModel::POST_TYPE, $args);
  }

  public function adminMenu()
  {
    add_menu_page(
      esc_html__('PicPoints', 'picpoints'), 
      esc_html__('PicPoints', 'picpoints'), 
      'read', 
      'picpoints', 
      [$this, 'showPage'], 
      'data:image/svg+xml;base64,' . base64_encode(DataModel::MENU_ICON)
    );
    add_submenu_page(
      'picpoints', 
      esc_html__('PicPoints', 'picpoints'), 
      esc_html__('All Maps', 'picpoints'), 
      'read', 
      'picpoints', 
      [$this, 'showPage']
    );
    add_submenu_page(
      'picpoints',
      esc_html__('PicPoints', 'picpoints'),
      esc_html__('Add New', 'picpoints'),
      'read',
      'picpoints&action=new',
      [$this, 'showPage']
    );
    
    add_submenu_page('picpoints', esc_html__('PicPoints', 'picpoints'), esc_html__('How To', 'picpoints'), 'read', 'picpoints-guide', [$this, 'showPageGuide']);
  }

  public function highlightAdminMenu($submenu_file, $parent_file)
  {
    $page = sanitize_key(filter_input(INPUT_GET, 'page', FILTER_DEFAULT));
    if (in_array($page, ['picpoints'], true)) {
      $action = sanitize_key(filter_input(INPUT_GET, 'action', FILTER_DEFAULT));
      if (in_array($action, ['new'], true)) {
        $submenu_file = "picpoints&action={$action}";
      }
    }
    return $submenu_file;
  }

  public function adminNotices()
  {
    $page = sanitize_key($_GET['page'] ?? '');
    if (!in_array($page, ['picpoints', 'picpoints-guide', 'picpoints-settings'], true)) {
      return;
    }

    $user_id = get_current_user_id();
    $hide_until = (int) get_user_meta($user_id, self::NOTICE_META_KEY, true);
    if ($hide_until > time()) {
      return;
    }

    $upgrade_url = esc_url(DataModel::getUpgradeUrl());
    $free_vs_pro_url = esc_url(DataModel::getPluginUrl());

    echo '<div class="notice notice-info is-dismissible picpoints-admin-notice" style="margin-bottom: 10px; background-image: linear-gradient(to bottom, rgb(87 162 255 / 30%) 0%, #fff 70%);">';

    echo '<h3>';
    echo esc_html__('Thank you for using PicPoints!', 'picpoints');
    echo '</h3>';

    echo '<p>' . wp_kses(__('You are using the <b>Lite</b> plan with the following limitations:', 'picpoints'), ['b' => []]) . '</p>';
    echo '<ul style="margin: 0 0 0.75em 1.25em; list-style: none; padding-left: 0;">';
    echo '<li>🔒 ' . esc_html__('Create unlimited maps with up to 3 scenes per map and 10 layers per scene.', 'picpoints') . '</li>';
    echo '<li>🔒 ' . esc_html__('Importing vector layers from SVG is disabled.', 'picpoints') . '</li>';
    echo '<li>🔒 ' . esc_html__('Advanced custom attributes are disabled.', 'picpoints') . '</li>';
    echo '<li>🔒 ' . esc_html__('Advanced Handlebars templates for tooltips/popups are disabled.', 'picpoints') . '</li>';
    echo '<li>🔒 ' . esc_html__('Custom JS and CSS sections per map/element are disabled.', 'picpoints') . '</li>';
    echo '</ul>';

    echo '<p style="margin-top:25px">';
    echo '<a class="button button-primary" href="' . $upgrade_url . '">' . esc_html__('Upgrade to Pro', 'picpoints') . '</a> ';
    echo '<a class="button button-secondary" href="' . $free_vs_pro_url . '" target="_blank" rel="noopener noreferrer">' . esc_html__('Learn More', 'picpoints') . '</a>';
    echo '</p>';

    echo '</div>';
  }

  public function adminNoticesScripts($hook_suffix)
  {
    $page = sanitize_key($_GET['page'] ?? '');
    if (!in_array($page, ['picpoints', 'picpoints-guide', 'picpoints-settings'], true)) {
      return;
    }

    wp_enqueue_script('picpoints-admin-notice', PICPOINTS_PLUGIN_URL . 'assets/js/admin-notice.js', ['jquery'], PICPOINTS_PLUGIN_VERSION, true);
    wp_localize_script('picpoints-admin-notice', 'yalogica_picpoints_globals_admin_notice', [
      'ajaxurl' => admin_url('admin-ajax.php'),
      'nonce' => wp_create_nonce(self::NOTICE_NONCE_ACTION),
    ]);
  }

  public function adminNoticesAjaxDismiss()
  {
    if (!current_user_can('edit_posts')) {
      wp_send_json_error(['message' => 'forbidden'], 403);
    }

    check_ajax_referer(self::NOTICE_NONCE_ACTION, 'nonce');

    update_user_meta(
      get_current_user_id(),
      self::NOTICE_META_KEY,
      time() + 30 * DAY_IN_SECONDS
    );

    wp_send_json_success();
  }

  public function redirect()
  {
    $page = sanitize_key(filter_input(INPUT_GET, 'page', FILTER_DEFAULT));

    if ($page === 'picpoints') {
      $action = sanitize_key(filter_input(INPUT_GET, 'action', FILTER_DEFAULT));

      if ($action === '') {
        $redirect_url = add_query_arg(['page' => 'picpoints', 'action' => 'list'], admin_url('admin.php'));
        wp_safe_redirect($redirect_url);
        exit;
      } elseif (!in_array($action, ['list', 'new', 'edit', 'settings'], true)) {
        $redirect_url = admin_url();
        wp_safe_redirect($redirect_url, 303);
        exit;
      } elseif ($action === 'list') {
        if (!AccessModel::currentUserHasAccess()) {
          wp_die(
            esc_html__('Sorry, you are not allowed to access this page.', 'picpoints'),
            esc_html__('Access Denied', 'picpoints'),
            403
          );
        }
      } elseif ($action === 'new') {
        if (!AccessModel::currentUserHasAccess()) {
          wp_die(
            esc_html__('Sorry, you are not allowed to access this page.', 'picpoints'),
            esc_html__('Access Denied', 'picpoints'),
            403
          );
        }

        $id = DataModel::createItemAutoDraft();

        if (!$id) {
          wp_die(
            esc_html__('Failed to create a new map. Please try again or check your server logs for more details.', 'picpoints'),
            esc_html__('Server Error', 'picpoints'),
            500
          );
        }

        $redirect_url = add_query_arg(['page' => 'picpoints', 'action' => 'edit', 'id' => $id], admin_url('admin.php'));
        wp_safe_redirect($redirect_url);
        exit;
      } elseif ($action === 'edit') {
        $id = sanitize_key(filter_input(INPUT_GET, 'id', FILTER_DEFAULT));

        if (!$id || !AccessModel::currentUserHasAccess()) {
          wp_die(
            esc_html__('Sorry, you are not allowed to access this page.', 'picpoints'),
            esc_html__('Access Denied', 'picpoints'),
            403
          );
        }
      } elseif ($action === 'settings') {
        if (!AccessModel::currentUserHasAccess()) {
          wp_die(
            esc_html__('Sorry, you are not allowed to manage plugin settings. Only administrators can access this page.', 'picpoints'),
            esc_html__('Access Denied', 'picpoints'),
            403
          );
        }
      }
    }
  }

  public function showPage()
  {
    $page = sanitize_key(filter_input(INPUT_GET, 'page', FILTER_DEFAULT));

    if ($page !== 'picpoints') {
      return;
    }

    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    wp_enqueue_style('picpoints-style', PICPOINTS_PLUGIN_URL . 'assets/css/style.css', [], PICPOINTS_PLUGIN_VERSION, 'all');

    wp_enqueue_style('picpoints-admin', PICPOINTS_PLUGIN_URL . 'assets/components/admin/index.css', [], PICPOINTS_PLUGIN_VERSION, 'all');
    wp_enqueue_script('picpoints-admin', PICPOINTS_PLUGIN_URL . 'assets/components/admin/index.js', [], PICPOINTS_PLUGIN_VERSION, false);

    $data = $this->getGlobals($id);
    $script = 'const yalogica_picpoints_global = ' . wp_json_encode($data) . ';';
    wp_add_inline_script('picpoints-admin', $script, 'before');

    wp_enqueue_media();

    require_once(PICPOINTS_PLUGIN_PATH . '/includes/Views/admin.php');
  }

  public function showPageGuide()
  {
    $page = sanitize_key(filter_input(INPUT_GET, 'page', FILTER_DEFAULT));

    if ($page !== 'picpoints-guide') {
      return;
    }

    wp_enqueue_style('picpoints-style', PICPOINTS_PLUGIN_URL . 'assets/css/style.css', [], PICPOINTS_PLUGIN_VERSION, 'all');

    require_once(PICPOINTS_PLUGIN_PATH . '/includes/Views/guide.php');
  }
  
  private function getGlobals($id = null)
  {
    $upload_dir = wp_upload_dir();


    $data = [
      'item_id' => $id,
      'site_url' => get_option('siteurl'),
      'plugin_url' => PICPOINTS_PLUGIN_URL,
      'icons_url' => PICPOINTS_PLUGIN_URL . 'assets/icons/',
      'upload_url' => $upload_dir['baseurl'] . '/picpoints/',
      'upgrade_url' => DataModel::getUpgradeUrl(),
      'is_pretty_permalinks' => get_option('permalink_structure') !== '',
    ];

    return [
      'data' => $data,
      'api' => [
        'nonce' => wp_create_nonce('wp_rest'),
        'url' => esc_url_raw(rest_url(PICPOINTS_PLUGIN_REST_URL))
      ]
    ];
  }
}
