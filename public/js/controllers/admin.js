angular.module('houseNode.controllers').controller('AdminController', function ($scope, socket) {
  $scope.pluginsGridOptions = {data: 'plugins',
                                columnDefs: [ {field:'name', displayName:'Name'},
                                              {field:'friendlyName', displayName:'Friendly Name'},
                                              {field:'version', displayName:'Version', width:'10%'},
                                              {field:'description', displayName:'Description', width:'50%'}
                                            ],
                                enableRowSelection: false,
                                sortInfo: {fields:['name'], directions:['asc']},
                                plugins: [new ngGridFlexibleHeightPlugin({minHeight: 100})]
                              };

  socket.on('plugin:updateAll', function (data) {
    $scope.plugins =  data.plugins;
  });

  socket.emit('plugin:getAll');
});