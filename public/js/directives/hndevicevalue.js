angular.module('houseNode.directives').directive('hnDevicevalue', function() {
  return {
    restrict: 'E',
    scope: {
      type: '@',
      value: '@'
    },
    link: function postLink(scope, element, attrs, controller) {
      attrs.$observe('type', function(value) {
        console.log("*********** type="+value);
      });

      attrs.$observe('value', function(value) {
        console.log("*********** value="+value);
        element.html('<div class="ngCellText" ng-class="col.colIndex()"><span ng-cell-text>'+value+'</span></div>');
      });

    }
  };
});
