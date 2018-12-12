
var layer_on = false;

/* var mapPromises = [
    d3.json("us_states.json"),
    d3.csv("us_companies.csv"),
    d3.csv("top_universities_geocoded_final.csv"),
    d3.csv("best_cities_amazon.csv"),
    d3.json("us_county.json")
];

Promise.all(mapPromises).then(files => {
    
    let opts = {
        element: document.querySelector(".map-idiom"),
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

    d3.select(".map-idiom")
        .on("click", d => {
            if(!layer_on){
                map.drawCNBCBestCitiesLayer();
                layer_on = !layer_on;
            }else{
                map.removeCNBCBestCitiesLayer();
                layer_on = !layer_on;
            }});
}) */

// Pack layout

/* var packPromises = [
    d3.csv("us_companies.csv"),
];

Promise.all(packPromises).then(files => {
    console.log(files);
    
    let opts = {
        element: document.querySelector(".pack-idiom"),
        data: {
            companies: files[0],
        } 
    }
    
    console.log(opts);
    pack = new PackView(opts);

}) */

// Radar

d3.csv("best_cities_amazon_fake.csv").then(cities => {
    console.log(cities);

    var svg = d3.select(".radar-test")
        .append("svg")
        .attr("width", 750)
        .attr("height", 300);

    var radarOpts = {
        element: document.querySelector(".radar-idiom"),
        containerDimensions: [400,500],
        dataFeatures: ["location", "population", "stability", "talent"],
        data: cities
    }

    var radar = new Radar(radarOpts);

    svg.selectAll("circle")
        .data(cities).enter()
        .append("circle")
        .attr("cx", (d, i) => (i + 1) * 750/cities.length)
        .attr("cy", 300/2)
        .attr("r", 10)
        .attr("fill", "black")
        .on("click", function(d){radar.drawPoint(d)});
    
})

