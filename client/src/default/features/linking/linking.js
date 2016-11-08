'use strict';

module.exports = (function () {

  require('jquery-ui');

  let jQuery = require('jquery');
  let angular = require('angular');
  let targetElementId = 'LinkingControllerID';

  function makeDragandDropWithName(theElementName) {
    let delay = 1500, elementName = jQuery('#' + theElementName);

    setTimeout(function () {
      jQuery('.workspace', elementName).draggable({
        cancel: 'a.ui-icon', // clicking an icon won't initiate dragging
        revert: 'invalid', // when not dropped, the item will revert back to its initial position
        helper: 'clone',
        containment: 'document',
        cursor: 'move'
      });
    }, delay);
  }

  function makeDragandDrop() {
    let delay = 1500, elementName = jQuery('#saved_workspaces');

    setTimeout(function () {
      jQuery('.workspace', elementName).draggable({
        cancel: 'a.ui-icon', // clicking an icon won't initiate dragging
        revert: 'invalid', // when not dropped, the item will revert back to its initial position
        helper: 'clone',
        containment: 'document',
        cursor: 'move'
      });
    }, delay);
  }

  function angularAddTripleIntoEditor(resource, row, colType) {
    let scope = angular.element(document.getElementById(targetElementId)).scope();

    scope.$apply(function () {
      scope.linking.addTripleIntoEditor(resource, row, colType);
    });
  }

  function makeDroppableOnEditor(row, colType) {
    let delay = 100, resource, html, eid;

    setTimeout(function () {
      jQuery('.draggable_item_' + row + '_' + colType).droppable({
        accept: '.draggable_item > li',
        hoverClass: 'ui-state-active',
        drop: function (event, ui) {
          resource = {};
          resource.resource_type = ui.draggable.data('resource_type');
          resource.resource_color = ui.draggable.data('resource_color');
          resource.description = ui.draggable.data('description');
          resource.resource_name = ui.draggable.data('resource_name');
          resource.resource_uri = ui.draggable.data('resource_uri');

          html = '<div class="alert alert-default" style="width:100%;">' +
            '<span class="label label-danger"><b>' + resource.resource_type + '</b></span> ' +
            '<b>' + resource.resource_name + '</b><br>' +
            '<a href="' + resource.resource_uri +
            '">' + resource.resource_uri + '</a><br>' + resource.description + '</div>';

          eid = '#item_' + row + '_' + colType;
          jQuery(eid).html(html);
          angularAddTripleIntoEditor(resource, row, colType);
        }
      });
    }, delay);
  }

  return {
    refreshVisFrame: (function () {
      parent.vis.location.reload();
    }),
    activateVisLink: (function (url) {
      parent.vis.location = url;
    }),
    setupDnD: (function () {
      makeDragandDrop();
    }),
    setupDnDWithName: (function (elementName) {
      makeDragandDropWithName(elementName);
    }),
    makeDroppableOnEditor: (function (row, colType) {
      makeDroppableOnEditor(row, colType);
    })
  };

}());
