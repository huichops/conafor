// General
// ------------------------

// Tenemos todas las rutas y controladores de angularJS en este archivo.
// Aquí es donde se encuentra toda la lógica de la aplicación del lado del cliente a 
// excepción de las directivas que están en su propio archivo.

// Misc
// -----------------------

// Esta función sirve para separar por comas las cantidades con tres o más dígitos.
// `Parámetro entero x`
// `Retorna x`
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Aquí se crea una **Factory** de angularJS para poder inyectar la librería 
// d3 a nuestro módulo 
angular.module('d3', [])
  .factory('d3Service', [function() {
    var d3;

    return d3;
  }]);

// Declaramos nuestro módulo con la lista de dependencias a inyectar
var conaforApp = angular.module('conaforApp', ['ngRoute', 'd3']);

// Gestión de rutas
// --------------------

// En esta parte declaramos las rutas para para nuestra aplicación que
// serán gestionadas totalmente por el lado del cliente con el módulo ngRoute.
// Cada ruta recibe como parametro que template y que controlador usará
conaforApp.config(function($routeProvider) {
  $routeProvider
    .when('/graph', {
      templateUrl: '/templates/graph.html',
      controller: 'graphCtrl'
    })
    .when('/map', {
      templateUrl: '/templates/map.html',
      controller: 'mapCtrl'
    })
    .when('/fichas', {
      templateUrl: '/templates/fichas.html',
      controller: 'fichasCtrl'
    })
});

// Controladores
// --------------------

// ### graphController
// El controlador *graphCtrl* contiene lo necesario para pedir los datos 
// usados para crear las gráficas
conaforApp.controller('graphCtrl', function($scope, $http) {
  // Esta función obtiene la cantidad de montos solicitados agrupados por
  // el campo seleccionado de manera asíncrona
  $scope.cantidad = function(filter, name) {
    filter = filter || 'none';

    $scope.filter = filter;

    $http.get( '/by/' + filter)
    .success(function(data, status, headers, config) {
      $scope.data = data;
    })
    .error(function(data, status, headers, config) {
      console.log('Error al obtener los datos');
    });
  };
  // La primera vez que entremos agrupar por región
  $scope.cantidad('region_name');
});

// ### fichasCtrl
// El controlador *fichasCtrl* no contiene lógica, aunque puede agregarse
// el funcionamiento necesario para la vista de las fichas en este controlador
// cuando sea necesario
conaforApp.controller('fichasCtrl', function($scope, $http) { 
});

// ### mapCtrl
// Este controlador contiene todo lo necesario para filtrar la información en el mapa
// así como lo necesario para su funcionamiento
conaforApp.controller('mapCtrl', function($scope, $http) { 
  // Función para reiniciar la lista de resultados y el título de la ficha de resumen
  function reset() {
      $scope.estado = 'Selecciona una región';
      $scope.results = {};
  }

  // Valores por defecto para los títulos
  $scope.estado = 'Selecciona un región';
  $scope.message = 'Montos Solicitados';
  $scope.date = '2009 - 2013';

  // #### Filtrado
  // Cada petición obtiene el dominio (posibles valores) para
  // cada uno de los filtros
  
  // Filtro para los tipos de apoyo
  $http.get('/get_domain/grupo_tipo_apoyo')
  .success(function(data, status, headers, config) {
    $scope.grupos = data;
  })
  // Filtro para los tipos de persona solicitante
  $http.get('/get_domain/tipo_solicitante')
  .success(function(data, status, headers, config) {
    $scope.personas = data;
  })
  .error(function(data, status, headers, config) {
    console.log('Error al obtener los datos');
  });
  // Tipo de solicitante (Ejido, comunidad, etc)
  $http.get('/get_domain/tipo')
  .success(function(data, status, headers, config) {
    $scope.tipos = data;
  })
  .error(function(data, status, headers, config) {
    console.log('Error al obtener los datos');
  });

  $scope.results = {};

  // #### Tratamiento de datos
  // En esta función se obtiene los datos de cantidad, promedio y total
  // gastado en montos solicitados a lo largo de todos los años filtrados
  // por el campo seleccionado
  $scope.monto = function(name, val) {
    reset();
    // Los campos que se van a recibir y como se muestran en el resumen
    $scope.fields = [
      { name: 'cantidad', show: 'Cantidad' },
      { name: 'promedio', show: 'Promedio (MXN)' },
      { name: 'total', show: 'Total (MXN)' }
    ];
    // La ruta donde se buscara
    $scope.url = '/total_solicitado';
    // El campo usado para comparar en el mapa
    $scope.field = 'cantidad';
    // Valores por defecto para el filtro
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
      console.log('Error al obtener los datos');
    });
  };

  // #### Funcionamiento al momento de dar click a una región
  $scope.onClick = function(item) {
    // Es necesario porque d3 funciona fuera del scope de angular
    $scope.$apply(function() {

      // Pedimos el resumen de esa región según el filtro seleccionado
      $http.get($scope.url + '/summary/' + item.region + '/' + $scope.filter + '.' + $scope.filter_val)
      .success(function(data, status, headers, config) {
        $scope.results = {};
        $scope.estado = 'Región ' + item.name;
          
        // Iteramos los anteriores campos que se definieron en la función que pedirá
        // los datos para el mapa para ponerlos en la ficha de resumen.
        // Recorremos cada año y después por cada campo ponemos el valor correspondiente
        // y agregamos comas si es necesario
        // **Solo funciona con valores númericos**
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
      })
      .error(function(data, status, headers, config) {
        $scope.response = 'Error al cargar';
      });
    });
  };
  // La primera vez cargaremos el mapa sin filtros
  $scope.monto();
});
