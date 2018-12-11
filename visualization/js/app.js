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



