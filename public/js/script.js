var conaforApp = angular.module('conaforApp', ['ngRoute']);

conaforApp.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: '/templates/home.html',
      controller: 'mainCtrl'
    })
    .when('/about', {
      templateUrl: '/templates/home.html',
      controller: 'aboutCtrl'
    });
});

conaforApp.controller('mainCtrl', function($scope, $http) {
  $http.get('/JALISCO/Amacueca')
    .success(function(data, status, headers, config) {
      $scope.entries = data;
    }).error(function(data, status, headers, config) {
    });
});

conaforApp.controller('aboutCtrl', function($scope) {
  $scope.message = '#thuglife';
});
