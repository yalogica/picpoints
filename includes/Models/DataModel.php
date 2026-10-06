<?php
namespace Yalogica\PicPoints\Models;

defined('ABSPATH') || exit;

use Yalogica\PicPoints\Lib\Utils;

class DataModel {
  public const MENU_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <g style="fill:rgba(255,255,255,1);stroke-width:0;">
    <path d="m 19.5625,13 c -0.368551,0.698031 -0.809758,1.367321 -1.294922,2 h 0.951172 l 1.5,6 H 3.28125 l 1.5,-6 H 5.7324219 C 5.2472578,14.367321 4.806051,13.698031 4.4375,13 H 4 a 1.0001,1.0001 0 0 0 -0.9707031,0.757813 l -2,7.999999 A 1.0001,1.0001 0 0 0 2,23 h 20 a 1.0001,1.0001 0 0 0 0.970703,-1.242188 l -2,-7.999999 A 1.0001,1.0001 0 0 0 20,13 Z" />
    <path d="M 12,1 C 7.7496699,1 4.2851562,4.4645139 4.2851562,8.7148438 4.2851562,12.965173 8.5714283,17.285714 12,19 15.428571,17.285714 19.714844,12.965173 19.714844,8.7148438 19.714844,4.464514 16.250329,1 12,1 Z m 0,4.2851562 A 3.4285712,3.4285715 0 0 1 15.427734,8.7148438 3.4285712,3.4285715 0 0 1 12,12.142578 3.4285712,3.4285715 0 0 1 8.5722656,8.7148438 3.4285712,3.4285715 0 0 1 12,5.2851562 Z" />
    </g>
    </svg>';
  
  public const POST_TYPE = 'picpoints';
  public const POST_STATUS_AUTO_DRAFT = 'auto-draft';
  public const POST_STATUS_DRAFT = 'draft';
  public const POST_STATUS_PUBLISHED = 'publish';
  public const POST_STATUS_TRASH = 'trash';

  public const META_CONFIG = '_picpoints_config';
  public const META_EDITED_BY = '_picpoints_edited_by';
  public const META_ROLE = '_picpoints_role';
  
  public static function getSup() 
  {
    return 'lite';
  }

  public static function getUpgradeUrl()
  {
    return admin_url('admin.php?page=picpoints-pricing');
  }

  public static function getPluginUrl()
  {
    return 'https://yalogica.com/picpoints/';
  }

  public static function currentUserCan($post_id) {
    return AccessModel::currentUserHasAccess();
  }

  private static function getColumns() {
    return [
      ['id' => 'id',        'name' => 'id',        'sortable' => false],
      ['id' => 'title',     'name' => 'title',     'sortable' => true],
      ['id' => 'status',    'name' => 'status',    'sortable' => false],
      ['id' => 'shortcode', 'name' => 'shortcode', 'sortable' => false],
      ['id' => 'author',    'name' => 'author',    'sortable' => false],
      ['id' => 'edited_by', 'name' => 'edited by', 'sortable' => false],
      ['id' => 'role',      'name' => 'role',      'sortable' => false],
      ['id' => 'created',   'name' => 'created',   'sortable' => true],
      ['id' => 'edited',    'name' => 'edited',    'sortable' => true]
    ];
  }

  public static function getTotalCount() {
    $counts = wp_count_posts( self::POST_TYPE );
    return (int) ( $counts->publish + $counts->draft );
  }

  private static function getTotal($status, $post_statuses, $filter = '%') {
    global $wpdb;
    $placeholder = implode(',', array_fill(0, count($post_statuses), '%s'));

    $sql = "
      SELECT COUNT(P.id) as total
      FROM {$wpdb->posts} AS P 
      WHERE P.post_type = %s AND P.post_status IN ({$placeholder}) AND IFNULL(P.post_title,'') LIKE %s"
      . ($status == 'mine' ? " AND P.post_author=%d" : " AND 0=%d");

    $args = [
      self::POST_TYPE,
      ...array_map( 'sanitize_key', $post_statuses ),
      $filter,
      $status == 'mine' ? get_current_user_id() : 0
    ];
  
    // phpcs:disable WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, PluginCheck.Security.DirectDB.UnescapedDBParameter
    $sql = $wpdb->prepare($sql, ...$args);
    return $wpdb->get_var($sql);
    // phpcs:enable
  }

  private static function getRows( $status, $post_statuses, $filter, $orderby, $order, $offset, $count ) {
    global $wpdb;
    $placeholder = implode(',', array_fill(0, count($post_statuses), '%s'));

    $sql = "
      SELECT P.id as id, P.post_title AS title, P.post_status AS status, P.post_author AS author, MLE.meta_value AS edited_by, MUR.meta_value AS role, P.post_date AS created, P.post_modified AS edited
      FROM {$wpdb->posts} AS P
      LEFT JOIN {$wpdb->postmeta} AS MLE
      ON MLE.post_id = P.id AND MLE.meta_key = %s
      LEFT JOIN {$wpdb->postmeta} AS MUR
      ON MUR.post_id = P.id AND MUR.meta_key = %s
      WHERE P.post_type=%s AND P.post_status IN ({$placeholder}) AND IFNULL(P.post_title,'') LIKE %s"
      . ($status == 'mine' ? " AND P.post_author=%d" : " AND 0=%d") . "
      ORDER BY %1s %1s
      LIMIT %d, %d";

    $args = [
      self::META_EDITED_BY,
      self::META_ROLE,
      self::POST_TYPE,
      ...array_map( 'sanitize_key', $post_statuses ),
      $filter,
      $status == 'mine' ? get_current_user_id() : 0,
      $orderby,
      $order,
      $offset,
      $count
    ];

    // phpcs:disable WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, PluginCheck.Security.DirectDB.UnescapedDBParameter
    $sql = $wpdb->prepare($sql, ...$args);
    return $wpdb->get_results($sql, 'ARRAY_A');
    // phpcs:enable
  }

  public static function getItems($page, $perpage = 10, $status = 'all', $orderby = null, $order = null, $search = null) {
    global $wpdb;

    $page = intval($page, 10);
    $page = $page <= 0 ? 1 : $page;
    $count = intval($perpage, 10);
    $offset = ($page - 1) * $count;

    $status_valid = ['all', 'published', 'draft'];
    $status = in_array($status, $status_valid, true) ? $status : $status_valid[0];

    switch ($status) {
      case 'all':
        $post_statuses = [self::POST_STATUS_PUBLISHED, self::POST_STATUS_DRAFT];
        break;
      case 'published':
        $post_statuses = [self::POST_STATUS_PUBLISHED];
        break;
      case 'draft':
        $post_statuses = [self::POST_STATUS_DRAFT];
        break;
    }

    $orderby_valid = ['title', 'created', 'edited'];
    $orderby = in_array($orderby, $orderby_valid, true) ? $orderby : 'edited';
    switch ($orderby) {
      case 'title':
        $orderBy = 'post_title';
        break;
      case 'created':
        $orderBy = 'post_date';
        break;
      case 'edited':
        $orderBy = 'post_modified';
        break;
    }

    $order_valid = ['asc', 'desc'];
    $order = in_array($order, $order_valid, true) ? $order : 'desc';

    $filter  = $search ? '%' . $wpdb->esc_like(sanitize_text_field($search)) . '%' : '%';

    $total = self::getTotal($status, $post_statuses, $filter);
    $items = self::getRows($status, $post_statuses, $filter, $orderBy, $order, $offset, $count);

    $data = null;
    if (!$wpdb->last_error) {
      $items = array_map(function ($item) {
        $item['author'] = get_the_author_meta('display_name', $item['author']);
        $item['edited_by'] = get_the_author_meta('display_name', $item['edited_by']);
        $item['role'] = translate_user_role($item['role']);
        return $item;
      }, $items);

      $data['total'] = intval($total, 10);
      $data['pages'] = $count ? ceil($data['total'] / $count) : 1;
      $data['page'] = $page;
      $data['perpage'] = $perpage;
      $data['order'] = $order;
      $data['orderby'] = $orderby;
      $data['search'] = $search;
      $data['items'] = $items;
      $data['columns'] = self::getColumns();
    }
    return $data;
  }

  public static function createItemAutoDraft() {
    if (AccessModel::currentUserHasAccess()) {
      $post = [
        'post_type' => self::POST_TYPE,
        'post_name' => uniqid(),
        'post_status' => self::POST_STATUS_AUTO_DRAFT,
        'meta_input' => [
          self::META_EDITED_BY => AccessModel::getCurrentUserId(),
          self::META_ROLE => AccessModel::getCurrentUserRole()
        ]
      ];

      $post_id = wp_insert_post($post);

      if ($post_id !== null) {
        return $post_id;
      }
    }

    return null;
  }

  public static function createItem($data) {
    if (is_array($data) && AccessModel::currentUserHasAccess()) {
      $config = wp_slash(json_encode($data['config'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
      
      if ($config === false) {
        return null;
      }

      $post = [
        'post_type' => self::POST_TYPE,
        'post_name' => uniqid(),
        'post_status' => self::POST_STATUS_DRAFT,
        'post_title' => isset($data['title']) ? sanitize_text_field($data['title']) : '',
        'meta_input' => [
          self::META_CONFIG => $config,
          self::META_EDITED_BY => get_current_user_id(),
          self::META_ROLE => AccessModel::getCurrentUserRole()
        ]
      ];
      $post_id = wp_insert_post($post, true);

      if (!is_wp_error($post_id)) {
        return $post_id;
      }
    }
    return null;
  }

  public static function getItemPublic($id) {
    $post = get_post($id);

    if ($post && $post->post_type === self::POST_TYPE) {
      $data = [];
      $data['id'] = $post->ID;
      $data['title'] = $post->post_title;
      $data['status'] = $post->post_status;

      $all_meta = get_post_meta($post->ID);
      $meta = function ($key) use ($all_meta) {
        return $all_meta[$key][0] ?? '';
      };

      $json = $meta(self::META_CONFIG);
      $data['config'] = json_decode($json, true);

      return $data;
    }
    return null;
  }

  public static function getItem($id) {
    if (AccessModel::currentUserHasAccess()) {
      $post = get_post($id);

      if ($post && $post->post_type === self::POST_TYPE) {
        $data = [];
        $data['id'] = $post->ID;
        $data['title'] = $post->post_title;
        $data['status'] = $post->post_status;
        $data['author'] = get_the_author_meta('display_name', $post->post_author);
        $data['created'] = $post->post_date;
        $data['edited'] = $post->post_modified;

        $all_meta = get_post_meta($post->ID);
        $meta = function ($key) use ($all_meta) {
          return $all_meta[$key][0] ?? '';
        };

        $json = $meta(self::META_CONFIG);
        $data['config'] = json_decode($json, true);

        $edited_by_id = $meta(self::META_EDITED_BY);
        $data['edited_by'] = get_the_author_meta('display_name', $edited_by_id);

        $role_key = $meta(self::META_ROLE);
        $data['role'] = translate_user_role($role_key);

        return $data;
      }
    }

    return null;
  }

  public static function updateItem( $id, $data ) {
    $id = intval($id);
    if ($id <= 0) {
      return false;
    }

    $post = get_post($id);
    if (!$post || $post->post_type !== self::POST_TYPE) {
      return false;
    }

    if (is_array($data) && self::currentUserCan($id)) {
      if (!isset($data['config']) || !is_array($data['config'])) {
        throw new \Exception('Config is missing or invalid.');
      }

      $data['config'] = Utils::sanitizeConfig($data['config']);

      $config = wp_slash(json_encode($data['config'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
      if ($config === false) {
        // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
        throw new \Exception('JSON encoding error: ' . json_last_error_msg());
      }

      $post = [
        'ID' => $id,
        'post_title' => isset($data['title']) ? sanitize_text_field($data['title']) : '',
        'meta_input' => [
          self::META_CONFIG => $config,
          self::META_EDITED_BY => get_current_user_id()
        ]
      ];

      if (in_array($data['status'], [self::POST_STATUS_AUTO_DRAFT])) {
        $post['post_status'] = self::POST_STATUS_DRAFT;
      }

      $post_id = wp_update_post($post);
      if ($post_id === 0) {
        throw new \Exception('Failed to update post.');
      }

      return true;
    }
    
    return false;
  }

  public static function updateItemStatus($id, $status) {
    $id = intval($id);
    if ($id <= 0) {
      return null;
    }

    $post = get_post($id);
    if (!$post || $post->post_type !== self::POST_TYPE) {
      return false;
    }

    if (in_array($status, [self::POST_STATUS_DRAFT, self::POST_STATUS_PUBLISHED]) && self::currentUserCan($id)) {
      $post = [
        'ID' => $id,
        'post_status' => sanitize_key($status)
      ];
      $post_id = wp_update_post($post);

      if ($post_id !== null) {
        return true;
      }
    }

    return false;
  }

  public static function deleteItem($id) {
    if (!self::currentUserCan($id)) {
      return false;
    }

    $id = intval($id);
    if ($id <= 0) {
      return false;
    }

    $post = get_post($id);
    if (!$post || $post->post_type !== self::POST_TYPE) {
      return false;
    }

    $result = wp_delete_post($id, true);
    if ($result !== false) {
      return true;
    }
    
    return false;
  }

  public static function recursiveCopy($src, $dst) {
    global $wp_filesystem;
    if (empty($wp_filesystem)) {
      require_once ABSPATH . 'wp-admin/includes/file.php';
      WP_Filesystem();
    }

    if ($wp_filesystem->is_dir($src)) {
      $wp_filesystem->mkdir($dst);

      $contents = $wp_filesystem->dirlist($src);
      foreach ($contents as $file => $info) {
        if ($file === '.' || $file === '..') continue;
        DataModel::recursiveCopy($src . '/' . $file, $dst . '/' . $file);
      }
    } elseif ($wp_filesystem->is_file($src)) {
      $wp_filesystem->copy($src, $dst);
    }
  }

  public static function copyItem( $id ) {
    if (!self::currentUserCan($id)) {
      return null;
    }

    $id = intval($id);
    if ($id <= 0) {
      return null;
    }

    $post = get_post($id);
    if (!$post || $post->post_type !== self::POST_TYPE) {
      return null;
    }

    $title = $post->post_title . (strripos($post->post_title, '[Copy]') !== FALSE ? '' : ' [Copy]');
    $config = get_post_meta($post->ID, self::META_CONFIG, true);
    $config = $config !== '' ? $config : json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $config = wp_slash($config);

    $post = [
      'post_type' => self::POST_TYPE,
      'post_name' => uniqid(),
      'post_status' => self::POST_STATUS_DRAFT,
      'post_title'  => $title,
      'meta_input' => [
        self::META_CONFIG => $config,
        self::META_EDITED_BY => get_current_user_id(),
        self::META_ROLE => AccessModel::getCurrentUserRole()
      ]
    ];
    $post_id = wp_insert_post($post, true);

    if (!is_wp_error($post_id)) {
      return $post_id;
    }

    return null;
  }

  public static function getIconSets() {
    $iconsDir = PICPOINTS_PLUGIN_PATH . '/assets/icons/';

    if (!is_dir($iconsDir)) {
      throw new \Exception('Failed to read icons directory.');
    }

    $iconSets = [];
    $iterator = new \DirectoryIterator($iconsDir);
    foreach ($iterator as $fileInfo) {
      if ($fileInfo->isDir() && !$fileInfo->isDot()) {
        $iconSets[] = $fileInfo->getFilename();
      }
    }

    return $iconSets;
  }

  public static function getIcons($set = 'lucide') {
    $iconsDir = PICPOINTS_PLUGIN_PATH . '/assets/icons';

    if (!is_dir($iconsDir)) {
      throw new \Exception('Failed to read icons directory.');
    }

    $iconsDir = $iconsDir . '/' . $set . '/';

    if (!is_dir($iconsDir)) {
      throw new \Exception('Failed to read icons set directory.');
    }

    $files = scandir($iconsDir);
    $icons = [];

    foreach ($files as $file) {
      if ($file === '.' || $file === '..') {
        continue;
      }

      $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
      if (in_array($ext, ['svg'])) {
        $icons[] = pathinfo($file, PATHINFO_FILENAME);
      }
    }

    return $icons;
  }
}