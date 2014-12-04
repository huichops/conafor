function calcThreshold(array, field, step) {
  var amount,
      domain = [], 
      max = 0,
      min = 999999999;

  step = step || 5;

  array.forEach(function(elem) {
    var current = elem[field];
    max = max >= current ? max : current; 
    min = min <= current ? min : current; 
  });

  amount = (max-min) / step;

  for (var i = 1; i <= step; i++) {
    domain.push(amount * i);
  }
  return domain;
}
conaforApp.directive('summary', function($http) {
  return {
    restrict: 'EA',
    replace: false,
    templateUrl: '/templates/summary.html'
  }
});

conaforApp.directive('map', function($http) {
    return {
      restrict: 'EA',
      replace: false,
      scope: { 
        data: '=',
        onClick: '&'
      },
      link: function(scope, element, attrs) {

        var width = '100%',
            height = 500,
            svg = d3.select(element[0]).append('svg');

        svg.attr('width', width).attr('height', height);

        scope.$watch('data', function(newVal, oldVal) {
          return scope.render(newVal);
        }, true);

        scope.render = function(data) {
        
          svg.selectAll('*').remove();
          if (!data) return;

          var field = scope.$parent.field;
          var first = data[0][field];
          var last = data[data.length-1][field];
          var diff = last - first;
          console.log(first, last, diff);

          //var stroke_colors = ['#EEEEEE', '#13E140', '#00C22B', '#00881E', '#006115', '#022B0B'];
          var stroke_colors = ['#EEEEEE', '#FFF57E', '#FFDC7E', '#FFCB80', '#FFA97E', '#FF807E'];
          var stroke_range = [0, 1, 2, 3 ,4, 5 ,6];
          var color_domain = stroke_range;
          var legend_labels = ['Otra', 'Norte', 'Centro-Occidente', 'Centro-Oriente', 'Sur', 'Sureste', 'Noreste'];

          var stroke_color = d3.scale.linear() 
          .domain(stroke_range)
          .range(stroke_colors);

          var colors = ['#FFF57E', '#FFDC7E', '#FFCB80', '#FFA97E', '#FF807E'];
          var range = d3.range(first, last, diff / (colors.length-1));
//          var color_domain = range.slice(0);
//          var legend_labels = range.slice(0);
//          legend_labels[0] += ' -';
//          legend_labels[legend_labels.length-1] += ' +';

          var color = d3.scale.threshold()
          .domain(range)
          .range(colors);

          console.log(range, color_domain, legend_labels);
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
          var region_by_code = {};
          

          function build_map(err, mx) {
            data.forEach(function(d) {
              mount_by_code[d._id.code] = (d[field]);
            });
            console.log(region_by_code);

            var states = topojson.feature(mx, mx.objects.states).features;
            if (err) return console.error(err);

            svg.append('g')
            .selectAll('path')
            .data(states)
            .enter().append('path')
            .attr('d', path)
            .attr('stroke-width', 1)
            .attr('state-click', true)
            .style('opacity', 0.5)
            .style('stroke', 'black')
          //  .style('stroke', function(d) {
           //   return stroke_color(region_by_code[d.properties.state_code]);
            //})
            .style('fill', function(d) {
              return stroke_color(region_by_code[d.properties.state_code].region);
            })
            .attr('class', function(d) {
              return 'region-' + region_by_code[d.properties.state_code].name;
            })

            .on('mouseover', function(d) {
              d3.selectAll('.region-' + region_by_code[d.properties.state_code].name).transition().duration(300).style('opacity', 1);
              div.transition().duration(300).style('opacity', 1)
              .style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY - 55) + 'px');

              title.text(d.properties.state_name);
              content_div.text('Region: ' + region_by_code[d.properties.state_code].name);
            })

            .on('mousemove', function(d) {
              div
              .style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY - 55) + 'px')
            })

            .on('mouseout', function(d) {
              d3.selectAll('.region-' + region_by_code[d.properties.state_code].name).transition().duration(300).style('opacity', 0.5);
              div.transition().duration(300).style('opacity', 0);
            })

            .on('click', function(d, i) {
              d.properties.region = region_by_code[d.properties.state_code].region;
              d.properties.name = region_by_code[d.properties.state_code].name;
              return scope.onClick({item: d.properties});
            });
          }

          $http.get('/region_by_code')
          .success(function(data, status, headers, config) {
            data.forEach(function(e) {
              region_by_code[e._id.code] = e._id; 
            });
            d3.json('mx_tj.json', build_map);
            var legend = svg.selectAll("g.legend")
              .data(color_domain)
              .enter().append("g")
              .attr("class", "legend");

            var ls_w = 20, ls_h = 20;

            legend.append("rect")
              .attr("x", 20)
              .attr("y", function(d, i){ 
                return height - (i*ls_h) - 2*ls_h;
              })
              .attr("width", ls_w)
              .attr("height", ls_h)
              .style("fill", function(d, i) { return stroke_color(d); })
              .style("opacity", 0.5);

            legend.append("text")
              .attr("x", 50)
              .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
              .text(function(d, i){ return legend_labels[i]; });
              /*$timeout(function() {
                angular.element('#year-filter').trigger('click');
              });*/
          })
          .error(function(data, status, headers, config) {
            console.log('DAMN');
          });


        };
      }
    };
  });


