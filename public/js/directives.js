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

          var colors = ['#FFF57E', '#FFDC7E', '#FFCB80', '#FFA97E', '#FF807E'];
          var range = d3.range(first, last, diff / (colors.length-1));
          var color_domain = range.slice(0);
          var legend_labels = range.slice(0);
          legend_labels[0] += ' -';
          legend_labels[legend_labels.length-1] += ' +';

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
              region_by_code[d._id.code] = d._id.region || 'otra';
            });

            var states = topojson.feature(mx, mx.objects.states).features;
            if (err) return console.error(err);

            svg.append('g')
            .selectAll('path')
            .data(states)
            .enter().append('path')
            .attr('d', path)
            .attr('state-click', true)
            .style('stroke', '#555')
            .style('opacity', 0.8)
            .style('fill', function(d) {
              return color(mount_by_code[d.properties.state_code]);
            })

            .on('mouseover', function(d) {
              d3.select(this).transition().duration(300).style('opacity', 1);
              div.transition().duration(300).style('opacity', 1)
              .style('left', (d3.event.pageX + 10) + 'px')
              .style('top', (d3.event.pageY - 55) + 'px');

              title.text(d.properties.state_name);
              content_div.text('Region: ' + region_by_code[d.properties.state_code]);
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
              return scope.onClick({item: d.properties});
            });
          }
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
            .style("fill", function(d, i) { return color(d); })
            .style("opacity", 0.8);

          legend.append("text")
            .attr("x", 50)
            .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
            .text(function(d, i){ return legend_labels[i]; });

        };
      }
    };
  });


