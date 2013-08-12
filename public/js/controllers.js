'use strict';

/* Controllers */

angular.module('houseNode.controllers', []).
  controller('AppController', function ($scope, socket) {
    socket.on('send:name', function (data) {
      $scope.name = data.name;
    });
  }).
  controller('HomeController', function ($scope, socket) {
  }).
  controller('DevicesController', function ($scope, socket) {
    $scope.gridOptions = {data: 'devices',
                          columnDefs: [ {field:'name', displayName:'Name'},
                                        {field:'location', displayName:'Location'},
                                        {field:'value', displayName:'Status'},
                                        {field:'time', displayName:'Last Change', cellTemplate:'<div class="ngCellText colt{{$index}}">{{row.getProperty(col.field) | date:\'short\'}}</div>'}
                                      ],
                          aggregateTemplate:'<div ng-click="row.toggleExpand()" ng-style="rowStyle(row)" class="ngAggregate"><span class="ngAggregateText">{{row.label CUSTOM_FILTERS}}</span><div class="{{row.aggClass()}}"></div></div>',
                          plugins: [new ngGridFlexibleHeightPlugin({minHeight: 200})],
                          showFilter: true,
                          groups: ['location'],
                          showGroupPanel: true,
                          groupsCollapsedByDefault: false,
                          sortInfo: {fields:['location','name'], directions:['asc','asc']}
                        };

    socket.on('device:updateAll', function (data) {
      $scope.devices =  data.devices;
    });

    socket.on('device:update', function (data) {
      for (var i=0;i<$scope.devices.length;i++) {
        if ($scope.devices[i].id === data.device.id) {
          for (var key in data.device) {
            $scope.devices[i][key] = data.device[key];
          }
          break;          
        }
      }
    });

    socket.emit('device:getAll');
  }).
  controller('CamerasController', function ($scope, socket) {
    $scope.$on('$routeChangeStart', function(next, current) { 
      //window.stop();
      $("img").attr("src", "#");
      //$("iframe").remove();
    });
  }).
  controller('AdminController', function ($scope, socket) {
    $scope.gridOptions = {data: 'plugins',
                          columnDefs: [ {field:'name', displayName:'Name'},
                                        {field:'friendlyName', displayName:'Friendly Name'},
                                        {field:'version', displayName:'Version', width:'10%'},
                                        {field:'description', displayName:'Description', width:'50%'}
                                      ],
                          plugins: [new ngGridFlexibleHeightPlugin({minHeight: 100})]
                        };

    socket.on('plugin:updateAll', function (data) {
      $scope.plugins =  data.plugins;
    });

    socket.emit('plugin:getAll');
  }).
  controller('AboutController', function ($scope, socket) {
  });

var hashToArray = function(hash) {
  var arr = new Array();
  for (var key in hash) {
    arr.push(hash[key]);
  }
  return arr;
}