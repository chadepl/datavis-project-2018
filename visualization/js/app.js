var layer_on = false;
var sidePaneMode = "radar";

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
        markup += "<input class='sub_check' value='"+ c +"' type='radio' name='pop_sub'>"+c+"</input>";
    })
    $("#pop_break").after("<div class='filter_container'>"+ markup + "</div>");
    var markup = "";
    stabKeys.forEach(function(c){
        markup += "<input class='sub_check' value='"+ c +"' type='radio'' name='stab_sub'>"+c+"</input>";
    })
    $("#stab_break").after("<div class='filter_container'>"+ markup + "</div>");
    var markup = "";
    talKeys.forEach(function(c){
        markup += "<input class='sub_check' value='"+ c +"' type='radio' name='tal_sub'>"+c+"</input>";
    })
    $("#tal_break").after("<div class='filter_container'>"+ markup + "</div>");
    var markup = "";
    devKeys.forEach(function(c){
        markup += "<input class='sub_check' value='"+ c +"' type='radio' name='dev_sub'>"+c+"</input>";
    })
    $("#dev_break").after("<div class='filter_container'>"+ markup + "</div>");

    let radarOpts = {
        element: document.querySelector("#radar"),
        data: files[5],
        objectId: "state"
    };

    radar = new Radar(radarOpts);

    let summarizationOpts = {
        element: document.querySelector("#summarization"),
        data: files[1]
    }

    summarization = new Summarization(summarizationOpts);

    

})

$(".rank_toggle").change(function() {
    uncheckAllSubChekcs();
    var indices = [];
    if($("#show_pop").is(":checked")) indices.push("population");
    if($("#show_tal").is(":checked")) indices.push("talent");
    if($("#show_dev").is(":checked")) indices.push("development");
    if($("#show_stab").is(":checked")) indices.push("stability");
    
    map.updateMap("index", indices);
});

$(".dd_icon").click(function(){
    $(this).next().next().toggle();
});

$(document.body).on('change', '.sub_check' ,function(){
    uncheckAllRanksChecks();
    var event = {
        checked: $(this).is(":checked"),
        col_name: $(this).val()
    }
    console.log(event);
    // send event of change

});

var uncheckAllSubChekcs = function(){
    $(".filter_container").each(function(){
        $(this).children().prop('checked', false);
    });
}

var uncheckAllRanksChecks = function(){
    $(".rank_toggle").prop("checked", false);
}

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



