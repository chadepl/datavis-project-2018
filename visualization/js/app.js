// var svg = d3.select("svg");

// var path = d3.geoPath();

// d3.json("https://d3js.org/us-10m.v1.json", function(error, us) {
//   if (error) throw error;

//   // console.log(us);
//   var all_states = topojson.feature(us, us.objects.states).features;
//   // all_states.forEach(function(d){console.log(d);});

//   svg.append("g")
//       .attr("class", "states")
//     .selectAll("path")
//     .data(all_states)
//     .enter().append("path")
//       .attr("d", path);

//   svg.append("path")
//       .attr("class", "state-borders")
//       .attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })));
// });

// d3.csv("http://localhost:8888/data/population.csv", function(data) {
//   console.log(data);
// });


var layer_on = false;

var _url = 'http://localhost:8888/data/';

var promises = [
    d3.json(_url+"us_states.json"),
    d3.csv(_url+"us_companies.csv"),
    // d3.csv(_url+"top_universities_geocoded_final.csv"),
    d3.csv(_url+"top_universities_US_geocoded.csv"),
    d3.csv(_url+"best_cities_amazon.csv"),
    d3.json(_url+"us_county.json")
];

Promise.all(promises).then(function(files) {
    let opts = {
        element: "#map",
        data: {
            geometry: files[0],
            statal_data: [],
            companies: files[1],
            universities: files[2],
            cnbc_best_cities: files[3],
            us_counties: files[4] // another geometry file. TODO: join with the states one
        } 
    }
    
    map = new MapView(opts);
    map.setStateClickCb(stateClickCb);

    d3.select(".map-idiom")
        .on("click", d => {
            if(!layer_on){
                map.drawCNBCBestCitiesLayer();
                layer_on = !layer_on;
            }else{
                map.removeCNBCBestCitiesLayer();
                layer_on = !layer_on;
            }});
})

// callbacks

var stateClickCb = function(){
    console.log("cb");
    // can call the radar stuff here
}



