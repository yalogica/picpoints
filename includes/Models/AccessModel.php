<?php
namespace Yalogica\PicPoints\Models;

defined('ABSPATH') || exit;

class AccessModel {
  public static function currentUserHasAccess() {
    return current_user_can('manage_options');
  }

  public static function getCurrentUserId() {
    return get_current_user_id();
  }

  public static function getCurrentUserRole() {
    $user = wp_get_current_user();
    
    if ( $user->exists() && !empty( $user->roles ) ) {
      return $user->roles[0];
    }
    
    return null;
  }
}