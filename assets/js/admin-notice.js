jQuery(function ($) {
  $(document).on("click", ".picpoints-admin-notice.is-dismissible .notice-dismiss", function () {
    $.post(yalogica_picpoints_globals_admin_notice.ajaxurl, {
      action: "picpoints_dismiss_admin_notice",
      nonce: yalogica_picpoints_globals_admin_notice.nonce,
    });
  });
});