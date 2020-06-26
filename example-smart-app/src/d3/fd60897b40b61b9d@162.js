// https://observablehq.com/@danielwhitecerner/worldmap-with-markers@162
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("chart")).define("chart", ["DOM","width","height","d3","projection","sphere","world","colors","markers","drag"], function(DOM,width,height,d3,projection,sphere,world,colors,markers,drag)
{
  const context = DOM.context2d(width, height);
  const path = d3.geoPath(projection, context);

  function render() {
    context.fillStyle = '#111'
    context.fillRect(0, 0, width, height);
    context.beginPath(), path(sphere), context.fillStyle = "#4287f5", context.fill();
    context.beginPath(), path(world),  context.fillStyle=colors.country, context.fill(),context.strokeStyle = "#000", context.stroke();
    context.beginPath(), path(sphere), context.stroke();
    context.beginPath(), path(markers), context.fillStyle = colors.marker, context.fill();
  }

  return d3.select(context.canvas)
    .call(drag(projection).on("drag.render", render))
    .call(render)
    .node();
}
);
  main.variable(observer("drag")).define("drag", ["versor","d3"], function(versor,d3){return(
function drag(projection) {
  let v0, q0, r0;

  function dragstarted() {
    v0 = versor.cartesian(projection.invert(d3.mouse(this)));
    q0 = versor(r0 = projection.rotate());
  }

  function dragged() {
    const v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this)));
    const q1 = versor.multiply(q0, versor.delta(v0, v1));
    projection.rotate(versor.rotation(q1));
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged);
}
)});
  main.variable(observer("projection")).define("projection", ["d3","width","height","sphere"], function(d3,width,height,sphere){return(
d3.geoOrthographic()
    .fitExtent([[1, 1], [width - 1, height - 1]], sphere)
    .translate([width / 2, height / 2])
    .precision(0.1)
)});
  main.variable(observer("height")).define("height", ["width"], function(width){return(
Math.min(640, width)
)});
  main.variable(observer("sphere")).define("sphere", function(){return(
{type: "Sphere"}
)});
  main.variable(observer("world")).define("world", ["d3"], function(d3){return(
d3.json("https://raw.githubusercontent.com/simonepri/geo-maps/master/previews/countries-land.geo.json")
)});
  main.variable(observer("versor")).define("versor", ["require"], function(require){return(
require("versor@0.0.3")
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  main.variable(observer("colors")).define("colors", function(){return(
{
    country: "#0bb02e",
    marker: "#7e06d4"
  }
)});
  main.variable(observer("markers")).define("markers", ["points"], function(points){return(
{
         "type": "MultiPoint",
         "coordinates": points.map(p => ([p.lng, p.lat]))
}
)});
  main.variable(observer("points")).define("points", function(){return(window.coordinates)});
  return main;
}
