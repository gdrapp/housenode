angular.module('houseNode.directives').directive('hnDeviceactions', function() {
  return {
    restrict: 'E',
    template: '<div ng-repeat="action in actions" style="margin-left:2px;margin-right:2px;float:inline><button type="button" class="btn btn-primary btn-xs" ng-click="emitEvent(action.event)">{{action.name}}</button></div>',
    //template: '<div class="btn-group"><button type="button" class="btn btn-primary btn-xs dropdown-toggle" data-toggle="dropdown">Action <span class="caret"></span></button><ul class="dropdown-menu" role="menu"><li ng-repeat="action in actions"><a ng-click="emitEvent(action.event)">{{action.name}}</a></li></ul></div>',
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
            { name: 'Arm Away', event: source + '/armAway' },
            { name: 'Arm Stay', event: source + '/armNoEntryDelay' },
            { name: 'Disarm', event: source + '/disarm' },
          ]
        } else if (type === 'securityzone') {
          scope.actions = [
            { name: 'Bypass', event: source + '/bypasszone' }
          ]
        }

      });

    }
  };
});

