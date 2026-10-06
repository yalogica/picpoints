<?php
namespace Yalogica\PicPoints\Rest\Controllers;

defined('ABSPATH') || exit;

use Yalogica\PicPoints\Models\DataModel;
use Yalogica\PicPoints\Models\AccessModel;

class DataController {
  public function __construct() {
  }

  public function registerRestRoutes() {
    register_rest_route(
      PICPOINTS_PLUGIN_PUBLIC_REST_URL,
      '/maps/(?P<id>\d+)',
      [
        [
          'methods' => \WP_REST_Server::READABLE,
          'callback' => [$this, 'getMapDataPublic'],
          'permission_callback' => '__return_true',
          'args' => [
            'id' => [
              'type' => 'integer',
              'required' => true,
            ]
          ]
        ],
      ]
    );

    register_rest_route(
      PICPOINTS_PLUGIN_REST_URL,
      '/maps',
      [
        [
          'methods' => \WP_REST_Server::READABLE,
          'callback' => [$this, 'getMaps'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          },
          'args' => [
            'page' => [
              'default' => 1,
              'type' => 'integer',
              'sanitize_callback' => 'absint',
              'validate_callback' => function ($param) {
                return is_numeric($param) && $param >= 1;
              }
            ],
            'perpage' => [
              'default' => 5,
              'type' => 'integer',
              'sanitize_callback' => 'absint',
              'validate_callback' => function ($param) {
                return is_numeric($param) && $param >= 1 && $param <= 100;
              }
            ]
          ]
        ]
      ]
    );

    register_rest_route(
      PICPOINTS_PLUGIN_REST_URL,
      '/maps/options',
      [
        [
          'methods' => \WP_REST_Server::READABLE,
          'callback' => [$this, 'getMapOptions'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          }
        ]
      ]
    );

    register_rest_route(
      PICPOINTS_PLUGIN_REST_URL,
      '/maps/(?P<id>\d+)',
      [
        [
          'methods' => \WP_REST_Server::READABLE,
          'callback' => [$this, 'getMap'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          },
          'args' => [
            'id' => [
              'type' => 'integer',
              'required' => true,
            ]
          ]
        ],
        [
          'methods' => \WP_REST_Server::EDITABLE,
          'callback' => [$this, 'updateMap'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          },
          'args' => [
            'id' => [
              'type' => 'integer',
              'required' => true,
            ]
          ]
        ],
        [
          'methods' => \WP_REST_Server::DELETABLE,
          'callback' => [$this, 'deleteMap'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          },
          'args' => [
            'id' => [
              'type' => 'integer',
              'required' => true,
            ]
          ]
        ]
      ]
    );

    register_rest_route(
      PICPOINTS_PLUGIN_REST_URL,
      '/maps/(?P<id>\d+)/copy',
      [
        'methods' => \WP_REST_Server::CREATABLE,
        'callback' => [$this, 'copyMap'],
        'permission_callback' => function () {
          return AccessModel::currentUserHasAccess();
        },
        'args' => [
          'id' => [
            'type' => 'integer',
            'required' => true,
          ]
        ]
      ]
    );

    register_rest_route(
      PICPOINTS_PLUGIN_REST_URL,
      '/maps/(?P<id>\d+)/status/(?P<status>(?i)draft|publish)',
      [
        [
          'methods' => \WP_REST_Server::EDITABLE,
          'callback' => [$this, 'updateMapStatus'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          }
        ]
      ]
    );

    register_rest_route(
      PICPOINTS_PLUGIN_REST_URL,
      '/icons/sets',
      [
        [
          'methods' => \WP_REST_Server::READABLE,
          'callback' => [$this, 'getIconSets'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          }
        ]
      ]
    );

    register_rest_route(
      PICPOINTS_PLUGIN_REST_URL,
      '/icons/sets/(?P<set_id>[0-9a-z_-]+)',
      [
        [
          'methods' => \WP_REST_Server::READABLE,
          'callback' => [$this, 'getIcons'],
          'permission_callback' => function () {
            return AccessModel::currentUserHasAccess();
          },
          'args' => [
            'set_id' => [
              'type' => 'string',
              'required' => true,
            ]
          ]
        ]
      ]
    );
  }

  public function getMapDataPublic(\WP_REST_Request $request) {
    $id = intval($request->get_param('id'), 10);

    try {
      $item = DataModel::getItemPublic($id);

      if ($item) {
        return new \WP_REST_Response([
          'message' => esc_html__('Map data has been retrieved.', 'picpoints'),
          'data' => [
            'item' => $item
          ]
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to get map data.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to get map data.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function getMaps(\WP_REST_Request $request) {
    $page = intval($request->get_param('page'), 10);
    $perpage = intval($request->get_param('perpage'), 10);
    $filter = sanitize_key($request->get_param('filter'));
    $orderby = sanitize_key($request->get_param('orderby'));
    $order = sanitize_key($request->get_param('order'));
    $search = sanitize_text_field($request->get_param('search'));

    try {
      $maps = DataModel::getItems($page, $perpage, $filter, $orderby, $order, $search);

      if ($maps) {
        return new \WP_REST_Response([
          'message' => esc_html__('Maps have been retrieved.', 'picpoints'),
          'data' => [
            'maps' => $maps
          ]
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to get maps.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to get maps.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function getMapOptions(\WP_REST_Request $request) {
    try {
      $maps = DataModel::getItems(1, 100, 'published');
      
      $options = [];
      if (!empty($maps['items'])) {
        foreach ($maps['items'] as $map) {
          $options[] = [
            'value' => (int) $map['id'],
            'label' => $map['title'],
          ];
        }
      }

      return new \WP_REST_Response([
        'message' => esc_html__('Maps have been retrieved.', 'picpoints'),
        'data' => ['options' => $options]
      ], 200);
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to get maps.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function getMap(\WP_REST_Request $request) {
    $id = intval($request->get_param('id'), 10);

    try {
      $item = DataModel::getItem($id);

      if ($item) {
        return new \WP_REST_Response([
          'message' => esc_html__('Map data has been retrieved.', 'picpoints'),
          'data' => [
            'item' => $item
          ]
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to get map data.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to get map data.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function updateMap(\WP_REST_Request $request) {
    $id = intval($request->get_param('id'), 10);
    $data = $request->get_json_params();

    try {
      $result = DataModel::updateItem($id, $data);

      if ($result) {
        return new \WP_REST_Response([
          'message' => esc_html__('Map data has been saved.', 'picpoints')
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to save map data.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to save map data.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function deleteMap(\WP_REST_Request $request) {
    $id = intval($request->get_param('id'), 10);

    try {
      $result = DataModel::deleteItem($id);

      if ($result) {
        return new \WP_REST_Response([
          'message' => esc_html__('Map has been deleted.', 'picpoints')
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to delete map.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to delete map.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function copyMap(\WP_REST_Request $request) {
    $id = intval($request->get_param('id'), 10);

    try {
      $id = DataModel::copyItem($id);

      if ($id) {
        return new \WP_REST_Response([
          'message' => esc_html__('Map has been copied.', 'picpoints'),
          'data' => [
            'id' => $id
          ]
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to copy map.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to copy map.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function updateMapStatus(\WP_REST_Request $request) {
    $id = intval($request->get_param('id'), 10);
    $status = sanitize_key($request->get_param('status'));

    try {
      $result = DataModel::updateItemStatus($id, $status);

      if ($result) {
        return new \WP_REST_Response([
          'message' => esc_html__('Map status has been updated.', 'picpoints')
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to update map status.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to update map status.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function getIconSets( \WP_REST_Request $request ) {
    try {
      $iconSets = DataModel::getIconSets();

      if ($iconSets) {
        return new \WP_REST_Response([
          'message' => esc_html__('Icon sets have been retrieved.', 'picpoints'),
          'data' => $iconSets
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to get icon sets.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to get icon sets.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }

  public function getIcons( \WP_REST_Request $request ) {
    $setId = sanitize_key($request->get_param('set_id'));

    try {
      $icons = DataModel::getIcons($setId);

      if ($icons) {
        return new \WP_REST_Response([
          'message' => esc_html__('Icons have been retrieved.', 'picpoints'),
          'data' => $icons
        ], 200);
      } else {
        return new \WP_REST_Response([
          'message' => esc_html__('Failed to get icons.', 'picpoints')
        ], 400);
      }
    } catch (\Exception $e) {
      return new \WP_REST_Response([
        'message' => esc_html__('Failed to get icons.', 'picpoints') . ' ' . esc_html($e->getMessage())
      ], 500);
    }
  }
}