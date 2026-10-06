(function (blocks, element, blockEditor, components, i18n, apiFetch) {
  'use strict';

  var el = element.createElement;
  var useState = element.useState;
  var useEffect = element.useEffect;
  var __ = i18n.__;
  var InspectorControls = blockEditor.InspectorControls;
  var BlockControls = blockEditor.BlockControls;
  var useBlockProps = blockEditor.useBlockProps;
  var PanelBody = components.PanelBody;
  var SelectControl = components.SelectControl;
  var TextControl = components.TextControl;
  var ToolbarButton = components.ToolbarButton;
  var Placeholder = components.Placeholder;
  var Spinner = components.Spinner;
  var Disabled = components.Disabled;
  var Notice = components.Notice;
  var config = window.yalogica_picpoints_gutenberg_block;

  function MapSelect(props) {
    var options = props.options;
    var value = props.value;
    var onChange = props.onChange;

    return el(SelectControl, {
      label: __('Interactive map', 'picpoints'),
      value: value ? String(value) : '0',
      options: [{ value: '0', label: __('Select a map', 'picpoints') }].concat(
        options.map(function (option) {
          return { value: String(option.value), label: option.label };
        })
      ),
      onChange: function (next) { onChange(parseInt(next, 10) || 0); },
    });
  }

  function Edit(props) {
    var attributes = props.attributes;
    var setAttributes = props.setAttributes;
    var blockProps = useBlockProps();
    var mapId = attributes.mapId || 0;

    var state = useState({ options: null, error: '' });
    var data = state[0];
    var setData = state[1];

    var scenesState = useState([]);
    var scenes = scenesState[0];
    var setScenes = scenesState[1];

    useEffect(function () {
      apiFetch({ url: config.optionsUrl })
        .then(function (response) {
          setData({ options: (response.data && response.data.options) || [], error: '' });
        })
        .catch(function () {
          setData({
            options: [],
            error: __('Failed to load maps. Please check your permissions.', 'picpoints'),
          });
        });
    }, []);

    useEffect(function () {
      setScenes([]);
      if (!mapId) {
        return;
      }
      apiFetch({ url: config.dataUrl + mapId })
        .then(function (response) {
          var item = (response.data && response.data.item) || {};
          var list = item.config && item.config.scenes;
          setScenes(Array.isArray(list) ? list : []);
        })
        .catch(function () {
          setScenes([]);
        });
    }, [mapId]);

    if (data.options === null) {
      return el(Placeholder, { icon: 'format-gallery', label: 'PicPoints' }, el(Spinner, null));
    }

    if (data.error) {
      return el(
        Placeholder,
        { icon: 'format-gallery', label: 'PicPoints' },
        el(Notice, { status: 'error', isDismissible: false }, data.error)
      );
    }

    if (!mapId) {
      return el(
        Placeholder,
        { icon: 'format-gallery', label: 'PicPoints ' + __('Interactive Map', 'picpoints') },
        data.options.length
          ? el(MapSelect, { options: data.options, value: 0, onChange: function (id) { setAttributes({ mapId: id }); } })
          : __('No published maps found. Create and publish a map first.', 'picpoints')
      );
    }

    var previewSrc = config.previewUrl + '&id=' + mapId
      + (attributes.sceneid ? '#scene=' + encodeURIComponent(attributes.sceneid) : '');

    return el(
      'div',
      blockProps,
      config.canEdit
      ? el(
        BlockControls,
        null,
        el(
          components.ToolbarGroup,
          null,
          el(ToolbarButton, {
            icon: 'edit',
            label: __('Edit map', 'picpoints'),
            onClick: function () {
              window.open(config.editUrl + mapId, '_blank', 'noopener');
            },
          })
        )
      )
      : null,
      el(
        InspectorControls,
        null,
        el(PanelBody, { title: __('PicPoints Settings', 'picpoints'), initialOpen: true },
          el(MapSelect, { options: data.options, value: mapId, onChange: function (id) { setAttributes({ mapId: id || 0 }); } }),
          el(TextControl, {
            label: __('Width', 'picpoints'),
            value: attributes.width || '',
            placeholder: '100%',
            help: __('Any valid CSS size, e.g. 100%, 600px, 50vh, auto.', 'picpoints'),
            onChange: function (value) { setAttributes({ width: value }); },
          }),
          el(TextControl, {
            label: __('Height', 'picpoints'),
            value: attributes.height || '',
            placeholder: '400px',
            help: __('Any valid CSS size, e.g. 400px, 100%, 50vh.', 'picpoints'),
            onChange: function (value) { setAttributes({ height: value }); },
          }),
          scenes.length
            ? el(SelectControl, {
                label: __('Initial scene', 'picpoints'),
                value: attributes.sceneid || '',
                options: [{ value: '', label: __('Default (from map settings)', 'picpoints') }].concat(
                  scenes.map(function (scene) {
                    return { value: scene.id, label: scene.name || scene.id };
                  })
                ),
                onChange: function (value) { setAttributes({ sceneid: value }); },
              })
            : null
        )
      ),
      el(Disabled, null,
        el('iframe', {
          src: previewSrc,
          title: __('PicPoints Interactive Map Preview', 'picpoints'),
          style: { 
            width: '100%', 
            height: attributes.height || '400px', 
            border: 'none', 
            display: 'block' 
          },
          loading: 'lazy',
        })
      )
    );
  }

  var icon = element.createElement('svg',
    { viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24 },
    element.createElement('path', { d: 'm 19.5625,13 c -0.368551,0.698031 -0.809758,1.367321 -1.294922,2 h 0.951172 l 1.5,6 H 3.28125 l 1.5,-6 H 5.7324219 C 5.2472578,14.367321 4.806051,13.698031 4.4375,13 H 4 a 1.0001,1.0001 0 0 0 -0.9707031,0.757813 l -2,7.999999 A 1.0001,1.0001 0 0 0 2,23 h 20 a 1.0001,1.0001 0 0 0 0.970703,-1.242188 l -2,-7.999999 A 1.0001,1.0001 0 0 0 20,13 Z' }),
    element.createElement('path', { d: 'M 12,1 C 7.7496699,1 4.2851562,4.4645139 4.2851562,8.7148438 4.2851562,12.965173 8.5714283,17.285714 12,19 15.428571,17.285714 19.714844,12.965173 19.714844,8.7148438 19.714844,4.464514 16.250329,1 12,1 Z m 0,4.2851562 A 3.4285712,3.4285715 0 0 1 15.427734,8.7148438 3.4285712,3.4285715 0 0 1 12,12.142578 3.4285712,3.4285715 0 0 1 8.5722656,8.7148438 3.4285712,3.4285715 0 0 1 12,5.2851562 Z' }),
  );

  blocks.registerBlockType('picpoints/map-embed', {
    icon: icon,
    edit: Edit,
    save: function () {
      return null; // dynamic block, render: php
    },
  });
})(
  window.wp.blocks, 
  window.wp.element, 
  window.wp.blockEditor, 
  window.wp.components, 
  window.wp.i18n, 
  window.wp.apiFetch
);