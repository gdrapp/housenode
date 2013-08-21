angular.module('houseNode.controllers').controller('DevicesController', function ($scope, socket) {
  $scope.gridOptions = {data: 'devices',
                        columnDefs: [ {field:'name', displayName:'Name'},
                                      {field:'location', displayName:'Location'},
                                      {field:'value', displayName:'Status', cellTemplate:'<div class="ngCellText colt{{$index}}">{{row.getProperty(col.field) | titleCase}}</div>'},
                                      {field:'time', displayName:'Last Change', cellTemplate:'<div class="ngCellText colt{{$index}}">{{row.getProperty(col.field) | date:\'short\'}}</div>'},
                                      {displayName:'Action', cellTemplate:'<div class="ngCellText colt{{$index}}"><hn-deviceactions type="{{row.entity.type}}" source="{{row.entity.source}}"></hn-deviceactions></div>'}
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
    console.log("Emitting event: "+ event);
    socket.emit('system:event', {event:event, message:{}});
  }

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
});
