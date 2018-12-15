var layer_on = false;
var sidePaneMode = "radar";
var ranks_meta, statesStatus, currentStates, currentFeatures;
var _url = 'http://localhost:8888/raw_data/';
var map, radar;
var promises = [
    d3.json("../../raw_data/geographic/us_states.json"),
    d3.csv("../../raw_data/joined_data.csv"),
    d3.csv("../../raw_data/ranks_metadata.csv"),
    d3.csv("../../raw_data/ranks/ranks.csv")
    //d3.csv("../../raw_data/population/population.csv"),
    //d3.csv("../../raw_data/stability/Stability.csv"),
    //d3.csv("../../raw_data/talent/talent.csv"),
    //d3.csv("../../raw_data/development/development.csv")
];

Promise.all(promises).then(function(files) {
    console.log(files);

    var ans = {};
    files[3].map(function(x){
        ans[x.state] = Math.round(Math.random() - 0.3);
        return ans;
    })
    statesStatus = ans;

    currentFeatures = ["population_rank"];
    currentStates = getCurrentStates(statesStatus);

    let mapOpts = {
        element: document.querySelector("#map"),
        geometry: files[0],
        data: files[1],
        metadata: files[2],
        ranks: files[3],
        currentStates: currentStates,
        currentFeatures: currentFeatures
    }

    map = new MapView(mapOpts);
    map.setStateClickCb(stateClickCb);


 
    initializeFilters(files[2], files[1])

    for(var i = 0 ; i < ranks_meta.length ; i++){
        var row = ranks_meta[i];
        if(row.hierarchy != "none" && row.column_id != 'state' && row.enabled == "TRUE"){
            $("#" + row.hierarchy + "_container").append("<input class='sub_check' value='"+ row.column_id +"' type='radio' name='sub_check'>"+row.column_display_name+"</input><br>");
        }
    }

    let scatterExplorerOpts = {
        element: document.querySelector("#scatter-explorer"),
        data: files[1],
        metadata: files[2],
        objectId: "state",
        currentStates: currentStates,
        currentFeatures: currentFeatures
    };

    scatterExplorer = new ScatterExplorerView(scatterExplorerOpts); 
    scatterExplorer.setFeatureClickCb(featureClickCb);


})

var getCurrentStates = function(statesStatus){
    var temp = [];
    d3.entries(statesStatus).forEach(e => {
        if(e.value == 1){
            temp.push(e.key);
        }
    })
    return temp;
}

// callbacks
var stateClickCb = function(state){
    statesStatus[state.properties.NAME.toUpperCase()] ^= true;
    console.log(statesStatus);
    console.log(state);
    currentStates = getCurrentStates(statesStatus);
    
    map.updateMapData(currentStates, currentFeatures);
    scatterExplorer.updateDataStates("subset", currentStates);
}  

var featureClickCb = function(feature){
    console.log(feature);
    if(currentFeatures.includes(feature)){

    }else{
        currentFeatures.push(feature)
    }
}  

// HTML events handling

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



//filter setup

function initializeFilters(ranks_meta,data)
{
    for(var i = 0 ; i < ranks_meta.length ; i++){
        var rank = ranks_meta[i];
        if(rank.filter == "TRUE"){

            var minmax = min_max(data,rank.column_id);
            var steps = Math.floor((minmax[1] - minmax[0])/20);
            $("#filters").append("<input type='hidden' id='"+rank.column_id+"' class='slider-input' /><br><br>")
            $("#"+rank.column_id+"").jRange({
                from: minmax[0],
                to: minmax[1],
                format: '%s',
                width: "80%",
                theme: 'theme-blue',
                showLabels: true,
                isRange : true
            });
            
        }
    }
}

function min_max(data,column){
    var min = data [0][column];
    var max = data [0][column];
    for(var i = 0 ; i < data.length ; i++){
       var number =  data[i][column];
       if(number == ""){
           number = 0;
       }
       if(number < min){
           min = number;
       }
       if(number > max){
           max = number;
       }
    }
    var answer = [min,max];
    return answer;
}



