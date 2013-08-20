angular.module('houseNode.directives').directive('hnDeviceactions', function() {
  return {
    restrict: 'E',
    scope: {
      type: '@',
      source: '@'
    },
    template: '<a ng-repeat="action in actions" href="{{action.link}}">{{action.name}}</a>',
    link: function postLink(scope, element, attrs, controller) {
      var type,
          source;

      attrs.$observe('type', function(value) {
        type = value;
        console.log("*********** type="+type);
      });

      attrs.$observe('source', function(value) {
        source = value;
        console.log("*********** source="+source);
        if (type === 'securitypartition') {
          
        }
      });

    }
  };
});

