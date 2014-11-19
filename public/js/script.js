angular.module('d3', [])
  .factory('d3Service', [function() {
    var d3;

    return d3;
  }]);

conaforApp = angular.module('conaforApp', ['ngRoute', 'd3']);

conaforApp.directive('map', function($http) {
    return {
      restrict: 'EA',
      replace: false,
      scope: { onClick: '&' },
      link: function(scope, element, attrs) {
        var width = '100%',
            height = 500,
            svg = d3.select(element[0]).append('svg');
        console.log(element[0]);


        var color_domain = ['300', '600', '900', '1300'];
        var color = d3.scale.threshold()
        .domain(color_domain)
        .range( ['#FFF57E', '#FFDC7E', '#FFCB80', '#FFA97E', '#FF807E'] );

        var projection = d3.geo.mercator()
            .scale(1350)
            .center([-97.34034978813841, 24.012062015793]);

        var path = d3.geo.path()
            .projection(projection);

        var div = d3.select('body').append('div')   
           .attr('class', 'tip')               
           .style('opacity', 0);

        var title = div.append('h4');
            
        var content_div = div.append('div').append('p');

        var mount_by_code = {};
        
        svg.attr('width', width).attr('height', height);

        function build_map(err, mx) {
          $http.get('/total_solicitado')
          .success( function(data, status, headers, config) {
            data.forEach(function(d) {
              mount_by_code[d._id.code] = (d.total_solicitado / 1000000);
            });

            var states = topojson.feature(mx, mx.objects.states).features;
            console.log(states);
            if (err) return console.error(err);
            console.log(mx);

            svg.append('g')
            .selectAll('path')
            .data(states)
            .enter().append('path')
            .attr('d', path)
            .attr('state-click', true)
            .style('stroke', '#555')
            .style('opacity', 0.6)
            .style('fill', function(d) {
              return color(mount_by_code[d.properties.state_code]);
            })

            .on('mouseover', function(d) {
              d3.select(this).transition().duration(300).style('opacity', 1);
              div.transition().duration(300).style('opacity', 1)
              .style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY - 55) + 'px');

              title.text(d.properties.state_name);
              var amount = (mount_by_code[d.properties.state_code]).toFixed();

              content_div.text(amount + ' MDP');
            })

            .on('mousemove', function(d) {
              div
              .style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY - 55) + 'px')
            })

            .on('mouseout', function(d) {
              d3.select(this).transition().duration(300).style('opacity', 0.8);
              div.transition().duration(300).style('opacity', 0);
            })

            .on('click', function(d, i) {
              return scope.onClick({item: d});
            });
          }).error(function(data, status, headers, config) {
            // yolo
          });
        }
        d3.json('mx_tj.json', build_map);
      }
    };
  });

conaforApp.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: '/templates/map.html',
      controller: 'mainCtrl'
    })
    .when('/about', {
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

conaforApp.controller('mainCtrl', function($scope, $http) {
  $scope.response = 'yolo';
  $scope.message = 'Total solicitado';
  $scope.date = '2010 - 2014';

  $scope.onClick = function(item) {
    $scope.$apply(function() {
      $scope.response = Math.random()*500;
    });
  };
});
