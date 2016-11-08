import angular from 'angular';
import './types.visualizer.css';
let d3 = require('d3');

function typesVisualizer($parse, $window) {
  return {
    restrict: 'EA',
    scope: true,
    template: '<div style="overflow:scroll;width:100%;display: block;">' +
              '<svg></svg></div>',
    link: function (scope, elem, attrs) {
      let exp = $parse(attrs.graph),
        graph = exp(scope),
        rawSvg = elem.find('svg'),
        svg = d3.select(rawSvg[0]),
        margin = {top: 20, right: 120, bottom: 20, left: 120},
        width = 1500 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom,
        i = 0,
        duration = 750,
        root,
        tree,
        diagonal;

      function update(source) {
        let nodes = tree.nodes(root).reverse(),
          node,
          links = tree.links(nodes),
          nodeEnter,
          nodeUpdate,
          nodeExit,
          link;

        nodes.forEach(function (d) {
          d.y = d.depth * 280 + 100;
        });
        node = svg.selectAll('g.node')
          .data(nodes, function (d) { return d.id || (d.id = ++i); });

        nodeEnter = node.enter().append('g')
          .attr('class', 'node')
          .attr('transform', function (d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
          .on('click', function click(d) {
            if (d.children) {
              d._children = d.children;
              d.children = null;
            } else {
              d.children = d._children;
              d._children = null;
            }
            update(d);
          });

        nodeEnter.append('circle')
            .attr('r', 1e-6)
            .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#eee'; });

        nodeEnter.append('text')
            .attr('x', function (d) { return d.children || d._children ? -10 : 10; })
            .attr('dy', '.35em')
            .attr('class', 'text')
            .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
            .text(function (d) { return d.name; })
            .on('mouseover', function (d) {
              // d3.select(this).style({fill: 'orange'});
            })
            .on('mouseout', function (d) {
              // d3.select(this).style({fill: '#eee'});
            })
            .on('click', function click(d) {
              /*
              if (!d.isObject) {
                scope.$apply(function () {
                  let fn = $parse(attrs.showAttrs);

                  fn(scope, {uri: d.uri});
                });
              }
              */
            });

        nodeUpdate = node.transition()
            .duration(duration)
            .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; });

        nodeUpdate.select('circle')
            .attr('r', 4.5)
            .style('fill', function (d) { return d._children ? 'lightsteelblue' : '#eee'; });

        nodeUpdate.select('text')
            .style('fill-opacity', 1);

        nodeExit = node.exit().transition()
            .duration(duration)
            .attr('transform', function (d) { return 'translate(' + source.y + ',' + source.x + ')'; })
            .remove();

        nodeExit.select('circle')
            .attr('r', 1e-6);

        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        link = svg.selectAll('path.link')
            .data(links, function (d) { return d.target.id; });

        link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('d', function (d) {
              let o = {x: source.x0, y: source.y0};

              return diagonal({source: o, target: o});
            });

        link.transition()
            .duration(duration)
            .attr('d', diagonal);

        link.exit().transition()
            .duration(duration)
            .attr('d', function (d) {
              let o = {x: source.x, y: source.y};

              return diagonal({source: o, target: o});
            })
            .remove();

        nodes.forEach(function (d) {
          d.x0 = d.x;
          d.y0 = d.y;
        });
      }

      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }

      function render() {
        if (graph !== undefined) {
          tree = d3.layout.tree().size([height, width]);
          diagonal = d3.svg.diagonal().projection(function (d) { return [d.y, d.x]; });

          svg.attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

          root = graph;
          root.x0 = 200;
          root.y0 = 0;

          root.children.forEach(collapse);
          update(root);
        }
      }

      scope.$watchCollection(exp, function (newVal, oldVal) {
        graph = newVal;
        render();
      });

      render();
    }
  };
}

export default angular.module('directives.typesVisualizer', [])
  .directive('typesVisualizer', ['$parse', '$window', typesVisualizer])
  .name;
