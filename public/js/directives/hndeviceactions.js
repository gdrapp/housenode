angular.module('houseNode.directives').directive('hnDeviceactions', function() {
  return {
    restrict: 'E',
    template: '<div ng-repeat="action in actions" style="margin-left:2px;margin-right:2px;float:inline><button type="button" class="btn btn-primary btn-xs" ng-click="emitEvent(action.event)">{{action.name}}</button></div>',
    link: function postLink(scope, element, attrs, controller) {
      var type,
          source;

      attrs.$observe('type', function(value) {
        type = value;
      });

      attrs.$observe('source', function(value) {
        source = value;
        if (type === 'securitypartition') {
          scope.actions = [
            { name: 'Arm', event: source + '/arm' },
            { name: 'Disarm', event: source + '/disarm' },
          ]
        } else if (type === 'securityzone') {
          scope.actions = [
            { name: 'Arm', event: source + '/arm' },
            { name: 'Bypass', event: source + '/bypass' },
          ]
        }

      });

    }
  };
});

