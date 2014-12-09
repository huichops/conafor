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
    .when('/graph', {
      templateUrl: '/templates/graph.html',
      controller: 'graphCtrl'
    })
    .when('/eje1', {
      templateUrl: '/templates/map.html',
      controller: 'eje1Ctrl'
    })
    .when('/fichas', {
      templateUrl: '/templates/fichas.html',
      controller: 'fichasCtrl'
    })
    .when('/', {
      templateUrl: '/templates/home.html',
      controller: 'aboutCtrl'
    });
});

conaforApp.controller('graphCtrl', function($scope, $http) {
  $scope.cantidad = function(filter, name) {
    filter = filter || 'none';

    $scope.filter = filter;

    $http.get( '/by/' + filter)
    .success(function(data, status, headers, config) {
      $scope.data = data;
    })
    .error(function(data, status, headers, config) {
      console.log('DAMN');
    });
  };
  $scope.cantidad('region_name');
});

conaforApp.controller('aboutCtrl', function($scope, $http) {
  $http.get('/JALISCO')
  .success(function(data, status, headers, config) {
    $scope.entries = data;
  }).error(function(data, status, headers, config) {
    // yolo
  });
});

conaforApp.controller('fichasCtrl', function($scope, $http) { 
});

conaforApp.controller('eje1Ctrl', function($scope, $http) { 
  $scope.estado = 'Selecciona un región';
  function reset() {
      $scope.estado = 'Selecciona una región';
      $scope.results = {};
  }
  $scope.message = 'Total Montos Solicitados';
  $scope.date = '2009 - 2013';
  $http.get('/get_domain/grupo_tipo_apoyo')
  .success(function(data, status, headers, config) {
    $scope.grupos = data;
  })
  $http.get('/get_domain/tipo_solicitante')
  .success(function(data, status, headers, config) {
    $scope.personas = data;
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

  // WARNING!!
  // SOLO CAMPOS NUMERICOS 
  $scope.results = {};

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
      { name: 'promedio', show: 'Promedio (MXN)' },
      { name: 'total', show: 'Total (MXN)' }
    ];
    $scope.url = '/total_solicitado';
    $scope.field = 'cantidad';
    name = name || 'none';
    val = val || 'none';

    $scope.filter = name;
    $scope.filter_val = val;

    if ( val == 'none' ) $scope.date = 'General';
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
      $http.get($scope.url + '/summary/' + item.region + '/' + $scope.filter + '.' + $scope.filter_val)
      .success(function(data, status, headers, config) {
        $scope.results = {};
        $scope.estado = 'Región ' + item.name;
          
        angular.forEach(data, function(v, k) {
          $scope.results[v.fecha] = [];
          angular.forEach($scope.fields, function(field, key) {
            if (v[field.name]) {
              withCommas = numberWithCommas(v[field.name].toFixed());
            } else {
              withCommas = 0;
            }
              
            $scope.results[v.fecha].push({
                show: field.show, 
                value: withCommas
            });
          });
        });
        console.log($scope.results);
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
