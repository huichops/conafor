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

conaforApp.controller('eje1Ctrl', function($scope, $http) { 
  $scope.estado = 'Selecciona un estado';
  function reset() {
      $scope.estado = 'Selecciona un estado';
      $scope.results.length = 0;
  }
  $scope.message = 'Total solicitado';
  $scope.date = '2009 - 2013';
  $http.get('/get_domain/sexo')
  .success(function(data, status, headers, config) {
    $scope.sexos = data;
  })
  .error(function(data, status, headers, config) {
    console.log('DAMN');
  });
  $http.get('/get_domain/tipo')
  .success(function(data, status, headers, config) {
    $scope.tipos = data;
  })
  .error(function(data, status, headers, config) {
    console.log('DAMN');
  });
  $http.get('/get_domain/fecha')
  .success(function(data, status, headers, config) {
    $scope.years = data;
  })
  .error(function(data, status, headers, config) {
    console.log('DAMN');
  });

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
      /*$timeout(function() {
        angular.element('#year-filter').trigger('click');
      });*/
    })
    .error(function(data, status, headers, config) {
      console.log('DAMN');
    });
  };

  $scope.monto = function(name, val) {
    reset();
    $scope.fields = [
      { name: 'cantidad', show: 'Cantidad' },
      { name: 'promedio', show: 'Promedio' },
      { name: 'total', show: 'Total' }
    ];
    $scope.url = '/total_solicitado';
    $scope.field = 'cantidad';
    name = name || 'none';
    val = val || 'none';

    $scope.filter = name;
    $scope.filter_val = val;

    if ( name == 'fecha' && !val ) $scope.date = '2009 - 2013';
    else $scope.date = val;

    $http.get($scope.url + '/' + name + '.'  + val)
    .success(function(data, status, headers, config) {
      $scope.data = data;
    })
    .error(function(data, status, headers, config) {
      console.log('DAMN');
    });
  };

  $scope.onClick = function(item) {
    $scope.$apply(function() {

      console.log($scope.filter, $scope.filter_val);
      $http.get($scope.url + '/summary/' + item.state_code + '/' + $scope.filter + '.' + $scope.filter_val)
      .success(function(data, status, headers, config) {
        $scope.results.length = 0;
        $scope.estado = item.state_name;
          
        angular.forEach($scope.fields, function(value, key) {
          if(data[value.name]) {
            withCommas = numberWithCommas(data[value.name].toFixed());
          } else {
            withCommas = 0;
          }
            
          $scope.results.push({
              show: value.show, 
              value: withCommas
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
  $scope.monto();
});
