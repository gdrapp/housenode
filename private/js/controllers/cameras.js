angular.module('houseNode.controllers').controller('CamerasController', function ($scope, socket) {
  $scope.$on('$routeChangeStart', function(next, current) {
    // Stop the camera streams when the route changes 
    window.stop();
    document.execCommand("Stop", false);
  });
});