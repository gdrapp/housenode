'use strict';

// Declare app level module which depends on filters, and services

angular.module('houseNode', [
  'ngGrid',
  'houseNode.controllers',
  'houseNode.filters',
  'houseNode.services',
  'houseNode.directives',

  // 3rd party dependencies
  'btford.socket-io'
]);

angular.module('houseNode.controllers', []);
angular.module('houseNode.directives', []);
angular.module('houseNode.filters', []);
angular.module('houseNode.services', []);

angular.module('houseNode').config(function ($routeProvider, $locationProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'partials/home',
      controller: 'HomeController'
    }).
    when('/devices', {
      templateUrl: 'partials/devices',
      controller: 'DevicesController'
    }).
    when('/cameras', {
      templateUrl: 'partials/cameras',
      controller: 'CamerasController'
    }).
    when('/admin', {
      templateUrl: 'partials/admin',
      controller: 'AdminController'
    }).
    when('/about', {
      templateUrl: 'partials/about',
      controller: 'AboutController'
    }).
    otherwise({
      redirectTo: '/'
    });

  $locationProvider.html5Mode(true);
});
