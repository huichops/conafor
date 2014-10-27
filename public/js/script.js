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

conaforApp.controller('mainCtrl', function($scope) {
  $scope.message = 'Yolo Swag';
});

conaforApp.controller('aboutCtrl', function($scope) {
  $scope.message = '#thuglife';
});
