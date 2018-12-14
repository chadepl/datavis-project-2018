var layer_on = false;
var sidePaneMode = "radar";
var ranks_meta;
var _url = 'http://localhost:8888/raw_data/';
var map, radar;
var promises = [
    d3.json("../../raw_data/geographic/us_states.json"),
    d3.csv("../../raw_data/population/population.csv"),
    d3.csv("../../raw_data/stability/Stability.csv"),
    d3.csv("../../raw_data/talent/talent.csv"),
    d3.csv("../../raw_data/development/development.csv"),
    d3.csv("../../raw_data/ranks/ranks.csv"),
    d3.csv("../../raw_data/ranks/ranks_metadata.csv")
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

    // var popKeys = Object.keys(files[1][0]);
    // var stabKeys = Object.keys(files[2][0]);
    // var talKeys = Object.keys(files[3][0]);
    // var devKeys = Object.keys(files[4][0]);


    ranks_meta = files[6];
    console.log(ranks_meta);
    for(var i = 0 ; i < ranks_meta.length ; i++){
        var rank = ranks_meta[i];
        if(rank.hiererchy == 'none' && rank.column_id != "state"){
            $("#filters").append("<input class='rank_toggle' id='" + rank.column_id + "' type='checkbox' name='" + rank.column_display_name + "' value='" + rank.column_display_name + "'>" + rank.column_display_name + "<img src='https://image.flaticon.com/icons/svg/60/60995.svg' class='dd_icon'><br id='" + rank.column_id + "_break'>");
        }
    }

    // var markup = "";
    // popKeys.forEach(function(c){
    //     markup += "<input class='sub_check' value='"+ c +"' type='radio' name='pop_sub'>"+c+"</input>";
    // })
    // $("#pop_break").after("<div class='filter_container'>"+ markup + "</div>");
    // var markup = "";
    // stabKeys.forEach(function(c){
    //     markup += "<input class='sub_check' value='"+ c +"' type='radio'' name='stab_sub'>"+c+"</input>";
    // })
    // $("#stab_break").after("<div class='filter_container'>"+ markup + "</div>");
    // var markup = "";
    // talKeys.forEach(function(c){
    //     markup += "<input class='sub_check' value='"+ c +"' type='radio' name='tal_sub'>"+c+"</input>";
    // })
    // $("#tal_break").after("<div class='filter_container'>"+ markup + "</div>");
    // var markup = "";
    // devKeys.forEach(function(c){
    //     markup += "<input class='sub_check' value='"+ c +"' type='radio' name='dev_sub'>"+c+"</input>";
    // })
    // $("#dev_break").after("<div class='filter_container'>"+ markup + "</div>");

    let radarOpts = {
        element: document.querySelector("#radar"),
        data: files[5],
        objectId: "state"
    };

    radar = new Radar(radarOpts);

})

$(document.body).on('change', '.rank_toggle' ,function(){
    uncheckAllSubChekcs();
    var rank_names = [];
    ranks_meta.forEach(r =>{
        if(r.hiererchy == "none" && r.column_id != 'state'){
            rank_names.push(r.column_id);
        }
    });
    var indices = [];
    rank_names.forEach(r =>{
        if($("#"+r).is(":checked")) indices.push(r);
    })
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



