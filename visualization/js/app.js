var layer_on = false;
var sidePaneMode = "radar";
var sliderValues = {};
var ranks_meta, statesStatus, currentStates, currentFeatures, filteredData, fullData;
var map, radar;
var promises = [
    d3.json("../../raw_data/geographic/us_states.json"),
    d3.csv("../../raw_data/joined_data.csv"),
    d3.csv("../../raw_data/ranks_metadata.csv"),
    d3.csv("../../raw_data/ranks/ranks.csv")
];

Promise.all(promises).then(function(files) {

    /* Initializes global state */
    fullData = files[1];
    filteredData = fullData; // TODO: not working
    initializeFilters(files[2], files[1]);

    // state of selected states and features
    statesStatus = {};
    files[3].forEach(x => {
        statesStatus[x.state] = Math.round(Math.random() - 0.4);
    })
    currentFeatures = ["talent_rank"];
    currentStates = getCurrentStates(statesStatus);

    /* Initializes map */
    let mapOpts = {
        element: document.querySelector("#map"),
        geometry: files[0],
        data: fullData,
        metadata: files[2],
        ranks: files[3],
        currentStates: currentStates,
        currentFeatures: currentFeatures
    }

    map = new MapView(mapOpts);
    map.setStateClickCb(stateClickCb);

    /* Initializes scatter */
    let scatterExplorerOpts = {
        element: document.querySelector("#scatter-explorer"),
        data: fullData,
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


/* Callbacks */

var stateClickCb = function(state){
    statesStatus[state.properties.NAME.toUpperCase()] ^= true;
    currentStates = getCurrentStates(statesStatus);
    map.updateMapData(filteredData, currentStates, currentFeatures);
    scatterExplorer.updateScatterData(filteredData, currentStates, currentFeatures);
}  

var featureClickCb = function(feature){
    var wasSelected = false;
    currentFeatures.forEach((f, i) => {
        if(f == feature){
            currentFeatures.splice(i, 1);
            wasSelected = true;
        }
    });
    if(!wasSelected){
        currentFeatures.push(feature);
    }
    map.updateMapData(filteredData, currentStates, currentFeatures);
    scatterExplorer.updateScatterData(filteredData, currentStates, currentFeatures);
}  

/* HTML events handling */

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


/* Filters */

function initializeFilters(ranks_meta, data)
{
    for(var i = 0 ; i < ranks_meta.length ; i++){
        var $rank = ranks_meta[i];
        if($rank.filter == "TRUE" && $rank.column_id != "state" && $rank.column_id != "talent_rank"){
            var minmax = min_max(data,$rank.column_id);
            var $filterContainer = "<div class='f_container'>";
            var $label = "<p class='label_container'><label for='" + $rank.column_id + "_amount'>" + $rank.column_display_name + "</label>" + 
                "<input class='amount_lbl' type='text' id='" + $rank.column_id + "_amount' readonly></p>"
            $("#filters").append($filterContainer + $label + "<div id='"+$rank.column_id+"_slider' class='slider-input' /><br></div>")

            var range = (minmax[1] - minmax[0])/20;
            var rangeInfo = {
                range: true,
                min: minmax[0],
                max: minmax[1],
                step: range,
                values: minmax,
                stop: onSliderChange
                }
            $( "#"+$rank.column_id+"_slider" ).slider(rangeInfo);
            $( "#"+$rank.column_id+"_amount" ).val($( "#"+$rank.column_id+"_slider" ).slider( "values", 0 ) +
                " - " + $( "#"+$rank.column_id+"_slider" ).slider( "values", 1 ) );
            sliderValues[$rank.column_id] = minmax;
        }
    }
}

var onSliderChange = function(event, ui){
    var col_id = event.target.id.replace('_slider','');
    $( "#"+col_id+"_amount" ).val(ui.values[0] + " - " + ui.values[1] );
    sliderValues[col_id] = ui.values.slice();
    filterData();
}

function min_max(data,column){
    var min = +data [0][column];
    var max = +data [0][column];
    for(var i = 0 ; i < data.length ; i++){
       var number =  +data[i][column];
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

var filterData = function(){
    filteredData = new Array();
    for(var i = 0 ; i < fullData.length ; i++){
        var passFilter = true;
        for(var c_id in sliderValues){
            if(+fullData[i][c_id] < sliderValues[c_id][0] || +fullData[i][c_id] > sliderValues[c_id][1]){
                passFilter = false;
            }
        }
        if(passFilter)
            filteredData.push(fullData[i]);
    }
    scatterExplorer.updateScatterData(filteredData, currentStates, currentFeatures);
    map.updateMapData(filteredData, currentStates, currentFeatures);
    
}

/* Sliding Menu */

// Set the width of the side navigation to 250px
function openNav() {
  document.getElementById("mySidenav").style.width = "300px";
}

// Set the width of the side navigation to 0
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}



