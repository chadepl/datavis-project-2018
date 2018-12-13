var layer_on = false;
var sidePaneMode = "radar";

var _url = 'http://localhost:8888/raw_data/';
var map, radar;
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
        element: document.querySelector("#map"),
        data: {
            geometry: files[0],
            population: files[1],
            stability: files[2],
            talent: files[3],
            development: files[4],
            ranks: files[5],
        } 
    }
    
    map = new MapView(mapOpts);
    map.setStateClickCb(stateClickCb);

    var popKeys = Object.keys(files[1][0]);
    var stabKeys = Object.keys(files[2][0]);
    var talKeys = Object.keys(files[3][0]);
    var devKeys = Object.keys(files[4][0]);

    var markup = "";
    popKeys.forEach(function(c){
        markup += "<input type='checkbox' name='" + c + "'>"+c+"</input>";
    })
    $("#pop_break").after("<div class='filter_container'>"+markup + "</div>");
    var markup = "";
    stabKeys.forEach(function(c){
        markup += "<input type='checkbox' name='" + c + "'>"+c+"</input>";
    })
    $("#stab_break").after("<div class='filter_container'>"+markup + "</div>");
    var markup = "";
    talKeys.forEach(function(c){
        markup += "<input type='checkbox' name='" + c + "'>"+c+"</input>";
    })
    $("#tal_break").after("<div class='filter_container'>"+markup + "</div>");
    var markup = "";
    devKeys.forEach(function(c){
        markup += "<input type='checkbox' name='" + c + "'>"+c+"</input>";
    })
    $("#dev_break").after("<div class='filter_container'>"+markup + "</div>");

    let radarOpts = {
        element: document.querySelector("#radar"),
        data: files[5],
        objectId: "state"
    };

    radar = new Radar(radarOpts);

})

$(".rank_toggle").change(function() {

    var popChecked = $("#show_pop").is(":checked")
    var talChecked = $("#show_tal").is(":checked")
    var devChecked = $("#show_dev").is(":checked")
    var stabChecked = $("#show_stab").is(":checked")
    map.updateRanksLayer(popChecked, talChecked, devChecked, stabChecked);
});

$(".dd_icon").click(function(){
    $(this).next().next().tggle();
});

// $("#show_dev").change(function() {
//     if(this.checked) {
//         map.drawDevelopmentLayer();
//     }
// });

// $("#show_stab").change(function() {
//     if(this.checked) {
//         map.drawStabilityLayer();
//     }
// });

// $("#show_tal").change(function() {
//     if(this.checked) {
//        map.drawTalentLayer();
//     }
// });

// callbacks
var stateClickCb = function(state){
    console.log("cb");
    if(sidePaneMode == "radar"){
        console.log(state);
        radar.drawPoint(state);
    }else if(detailMode){
        console.log("cb");
    }
    // can call the radar stuff here
}



