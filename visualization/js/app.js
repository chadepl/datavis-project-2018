var layer_on = false;
var sidePaneMode = "radar";
var ranks_meta;
var _url = 'http://localhost:8888/raw_data/';
var map, radar;
var promises = [
    d3.json("../../raw_data/geographic/us_states.json"),
    d3.json("../../raw_data/joined_data.csv"),
    d3.csv("../../raw_data/ranks/ranks_metadata.csv"),
    d3.csv("../../raw_data/ranks/ranks.csv"),
    //d3.csv("../../raw_data/population/population.csv"),
    //d3.csv("../../raw_data/stability/Stability.csv"),
    //d3.csv("../../raw_data/talent/talent.csv"),
    //d3.csv("../../raw_data/development/development.csv")
];

Promise.all(promises).then(function(files) {
    let mapOpts = {
        element: document.querySelector("#map"),
        data: {
            geometry: files[0],
            data: files[1],
            metadata: files[2],
            ranks: files[3],
        } 
    }
    
    map = new MapView(mapOpts);
    map.setStateClickCb(stateClickCb);

    ranks_meta = files[2];
    for(var i = 0 ; i < ranks_meta.length ; i++){
        var rank = ranks_meta[i];
        if(rank.hierarchy == 'none' && rank.column_id != "state"){
            $("#filters").append("<input class='rank_toggle' id='" +
                rank.column_id + "' type='checkbox' name='" +
                rank.column_id + "' value='" + 
                rank.column_id + "'>" + rank.column_display_name + 
                "<img src='https://image.flaticon.com/icons/svg/60/60995.svg' class='dd_icon'><br id='" + 
                rank.column_id + "_break'><div id='" + rank.column_id + 
                "_container' class='filter_container'></div>");
        }
    }


    for(var i = 0 ; i < ranks_meta.length ; i++){
        var row = ranks_meta[i];
        if(row.hierarchy != "none" && row.column_id != 'state'){
            $("#" + row.hierarchy + "_container").append("<input class='sub_check' value='"+ row.column_id +"' type='radio' name='sub_check'>"+row.column_display_name+"</input>");
        }
    }

    let radarOpts = {
        element: document.querySelector("#radar"),
        data: files[1],
        metadata: files[2],
        objectId: "state"
    };

    radar = new Radar(radarOpts);

})

$(document.body).on('change', '.rank_toggle' ,function(){
    uncheckAllSubChekcs();
    var rank_names = [];
    ranks_meta.forEach(r =>{
        if(r.hierarchy == "none" && r.column_id != 'state'){
            rank_names.push(r.column_id);
        }
    });
    var indices = [];
    rank_names.forEach(r =>{
        if($("#"+r).is(":checked")) indices.push(r);
    })
    map.updateMap(indices);
});

$(document.body).on('click', '.dd_icon' ,function(){
    $(this).next().next().toggle();
});

$(document.body).on('change', '.sub_check' ,function(){
    uncheckAllRanksChecks();
    console.log($(this).val());
    map.updateMap([$(this).val()]);

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



