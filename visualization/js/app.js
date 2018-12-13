var layer_on = false;

var _url = 'http://localhost:8888/raw_data/';
var map;
var promises = [
    d3.json(_url+"geographic/us_states.json"),
    d3.csv(_url+"population/population.csv"),
    d3.csv(_url+"stability/Stability.csv"),
    d3.csv(_url+"talent/talent.csv"),
    d3.csv(_url+"development/development.csv"),
    d3.csv(_url+"ranks/ranks.csv"),
];

Promise.all(promises).then(function(files) {
    let opts = {
        element: "#map",
        data: {
            geometry: files[0],
            population: files[1],
            stability: files[2],
            talent: files[3],
            development: files[4],
            ranks: files[5],
        } 
    }
    
    map = new MapView(opts);
    map.setStateClickCb(stateClickCb);

    console.log(files[5]);
    var colNames = d3.entries(files[5][0])
        .filter(d => d.key != "state")
        .map(k => k.key);
    var radarOpts = {
        element: "#radar",
        containerDimensions: [600,600],
        dataFeatures: colNames,
        data: files[5]
    }

    var radar = new Radar(radarOpts);

    // svg.selectAll("circle")
    //     .data(cities).enter()
    //     .append("circle")
    //     .attr("cx", (d, i) => (i + 1) * 750/cities.length)
    //     .attr("cy", 300/2)
    //     .attr("r", 10)
    //     .attr("fill", "black")
    //     .on("click", function(d){radar.drawPoint(d)});
})




$("#show_pop").click(function(){
    map.drawPopulationLayer();
});

$("#show_stab").click(function(){
    map.drawStabilityLayer();
});

$("#show_dev").click(function(){
    map.drawDevelopmentLayer();
});

$("#show_tal").click(function(){
    map.drawTalentLayer();
});

// callbacks

var stateClickCb = function(){
    console.log("cb");
    // can call the radar stuff here
}



