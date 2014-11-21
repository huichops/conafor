function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
angular.module('d3', [])
  .factory('d3Service', [function() {
    var d3;

    return d3;
  }]);

var conaforApp = angular.module('conaforApp', ['ngRoute', 'd3']);

conaforApp.config(function($routeProvider) {
  $routeProvider
    .when('/eje1', {
      templateUrl: '/templates/map.html',
      controller: 'eje1Ctrl'
    })
    .when('/eje2', {
      templateUrl: '/templates/map.html',
      controller: 'eje2Ctrl'
    })
    .when('/', {
      templateUrl: '/templates/home.html',
      controller: 'aboutCtrl'
    });
});


conaforApp.controller('aboutCtrl', function($scope, $http) {
  $http.get('/JALISCO')
  .success(function(data, status, headers, config) {
    $scope.entries = data;
  }).error(function(data, status, headers, config) {
    // yolo
  });
});

conaforApp.controller('eje1Ctrl', function($scope, $http) { $scope.estado = 'Selecciona un estado';
  function reset() {
      $scope.estado = 'Selecciona un estado';
      $scope.results.length = 0;
  }
  $scope.message = 'Total solicitado';
  $scope.date = '2010 - 2014';
  // [ WARNING
  // IS ONLY FOR NUMERIC FIELDS !!
  $scope.results = [];

  $scope.count = function() {
    reset();
    $scope.fields = [
      { name: 'total', show: 'Total' }
    ];
    $scope.url = '/cantidad_solicitado';
    $scope.field = 'cantidad';
    
    $http.get('/cantidad_solicitado')
    .success(function(data, status, headers, config) {
      $scope.data = data;
    })
    .error(function(data, status, headers, config) {
      console.log('DAMN');
    });
  };

  $scope.monto = function() {
    reset();
    $scope.fields = [
      { name: 'avg', show: 'Promedio' },
      { name: 'total', show: 'Total' }
    ];
    $scope.url = '/total_solicitado';
    $scope.field = 'promedio';

    $http.get('/total_solicitado')
    .success(function(data, status, headers, config) {
      $scope.data = data;
    })
    .error(function(data, status, headers, config) {
      console.log('DAMN');
    });
  };

  $scope.field = 'cantidad';
  $scope.onClick = function(item) {
    $scope.$apply(function() {

      $http.get($scope.url + '/summary/' + item.state_code)
      .success(function(data, status, headers, config) {
        $scope.results.length = 0;
        $scope.estado = item.state_name;
        angular.forEach($scope.fields, function(value, key) {
          $scope.results.push({
              show: value.show, 
              value: numberWithCommas(data[value.name].toFixed()) 
          });
        });
        /*$scope.avg = numberWithCommas('$' + data.avg.toFixed());
        $scope.total = numberWithCommas('$' + data.total.toFixed());*/
      })
      .error(function(data, status, headers, config) {
        $scope.response = 'Error al cargar';
      });
    });
  };
});
