var svg = d3.select("svg");

var path = d3.geoPath();

d3.json("https://d3js.org/us-10m.v1.json", function(error, us) {
  if (error) throw error;

  // console.log(us);
  var all_states = topojson.feature(us, us.objects.states).features;
  // all_states.forEach(function(d){console.log(d);});

  svg.append("g")
      .attr("class", "states")
    .selectAll("path")
    .data(all_states)
    .enter().append("path")
      .attr("d", path);

  svg.append("path")
      .attr("class", "state-borders")
      .attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })));
});

d3.csv("http://localhost:8888/data/population.csv", function(data) {
  console.log(data);
});