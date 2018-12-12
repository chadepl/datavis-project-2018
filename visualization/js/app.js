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

    // d3.select(".map-idiom")
    //     .on("click", d => {
    //         if(!layer_on){
    //             map.drawCNBCBestCitiesLayer();
    //             layer_on = !layer_on;
    //         }else{
    //             map.removeCNBCBestCitiesLayer();
    //             layer_on = !layer_on;
    //         }});
})

$("#show_pop").click(function(){
    map.drawPopulationLayer();
});

// callbacks

var stateClickCb = function(){
    console.log("cb");
    // can call the radar stuff here
}



