angular.module('houseNode.controllers').controller('DevicesController', function ($scope, socket) {
  $scope.gridOptions = {data: 'devices',
                        columnDefs: [ {field:'name', displayName:'Name', width:'20%'},
                                      {field:'location', displayName:'Location', width:'20%'},
                                      {field:'value', displayName:'Status', width:'20%', cellTemplate:'<div class="ngCellText colt{{$index}}">{{row.getProperty(col.field) | titleCase}}</div>'},
                                      {field:'time', displayName:'Last Change', width:'15%', cellTemplate:'<div class="ngCellText colt{{$index}}">{{row.getProperty(col.field) | date:\'short\'}}</div>'},
                                      {displayName:'Action', width:'25%', sortable:false, cellTemplate:'<div class="ngCellText colt{{$index}}"><hn-deviceactions type="{{row.entity.type}}" source="{{row.entity.source}}"></hn-deviceactions></div>'}
                                    ],
                        aggregateTemplate:'<div ng-click="row.toggleExpand()" ng-style="rowStyle(row)" class="ngAggregate"><span class="ngAggregateText">{{row.label CUSTOM_FILTERS}}</span><div class="{{row.aggClass()}}"></div></div>',
                        plugins: [new ngGridFlexibleHeightPlugin({minHeight: 200})],
                        showFilter: true,
                        groups: ['location'],
                        showGroupPanel: true,
                        groupsCollapsedByDefault: false,
                        enableRowSelection: false,
                        sortInfo: {fields:['location','name'], directions:['asc','asc']}
                      };

  $scope.emitEvent = function(event) {
    console.log("Emitting event: " + event);
    socket.emit('system:event', {event:event, message:{}});
  }

  socket.on('devices:emit', function (data) {
    if (data.isAllDevices) {
      $scope.devices =  data.devices;      
    } else {
      var devices = data.devices;

      // If devices isn't an array, make it an array
      if (!Object.prototype.toString.call(devices) !== '[object Array]') {
        devices = [devices];
      }

      for (var i=0;i<devices.length;i++) {
        for (var j=0;j<$scope.devices.length;j++) {
          if ($scope.devices[j].id === devices[i].id) {
            for (var key in devices[i]) {
              $scope.devices[j][key] = devices[i][key];
            }
            break;
          }
        }      
      }
    }
  });

  socket.emit('devices:get');
});
