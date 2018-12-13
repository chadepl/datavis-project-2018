var layer_on = false;

var _url = 'http://localhost:8888/raw_data/';
var map;
var promises = [
    d3.json("../../raw_data/geographic/us_states.json"),
    d3.csv("../../raw_data/population/population.csv"),
    d3.csv("../../raw_data/stability/Stability.csv"),
    d3.csv("../../raw_data/talent/talent.csv"),
    d3.csv("../../raw_data/development/development.csv"),
    d3.csv("../../raw_data/ranks/ranks.csv"),
];

Promise.all(promises).then(function(files) {
    let mapOpts = {
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
    
    var map = new MapView(mapOpts);
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

    let radarOpts = {
        element: document.querySelector("#radar"),
        data: files[5],
        objectId: "state"
    };

    var radar = new Radar(radarOpts);

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

var stateClickCb = function(state){
    console.log("cb");
    if(radarMode){

    }else if(detailMode){

    }
    // can call the radar stuff here
}



