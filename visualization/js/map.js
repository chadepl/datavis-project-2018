class MapView {
    constructor(opts){

        this.stateClickCb = null;
        this.geometry = opts.geometry;
        this.data = opts.data;
        this.metadata = opts.metadata;
        this.ranks = opts.ranks;
        this.element = opts.element;

        this.currentStates = opts.currentStates;
        this.currentFeatures = opts.currentFeatures;
        this.currentData = this.data; // TODO: filter this

        // Geometry related attributes
        this.states = topojson.feature(this.geometry, this.geometry.objects.cb_2014_us_state_500k).features;

        // Global attributes    
        this.width = d3.select(this.element).node().getBoundingClientRect().width;
        this.height = d3.select(this.element).node().getBoundingClientRect().height;
        
        this.svg = d3.select(this.element)
             .append("svg")
             .attr("width", this.width)
             .attr("height", this.height);

        this.projection = d3.geoAlbersUsa()
            .scale(800) // TODO: make this dynamic
            .translate([this.width/2, this.height/2]);
        this.path = d3.geoPath().projection(this.projection);
        
        this.states_shapes = this.svg.append("g").selectAll("path").data(this.states).enter()
            .append("path")
            .attr("stroke", "black")
            .attr("class", "state")
            .attr("fill", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", this.path)
            .on("click", d => {
                this.stateClickCb(d);
            });         
        
        // Color scales 
        this.indexColorScale = d3.scaleSequential();

        this.redrawMap();
    }

    updateMapData(filteredData, states, features){
        this.currentData = filteredData;
        this.currentStates = states;
        this.currentFeatures = features;

        this.redrawMap();

    }

    redrawMap(){

        // 1. first all the logic that its needed to print the correct color scale and shapes, etc
        if(this.currentFeatures.length == 1){
            var feature_info = this.metadata.filter(d => d.column_id == this.currentFeatures[0])[0];
            this.indexColorScale = d3.scaleSequential(d3["interpolate" + feature_info.color_scheme]).domain([50, 1])
        }else if (this.currentFeatures.length > 1) {
            this.indexColorScale = d3.scaleSequential(d3.interpolateRdPu).domain([50, 1]);
        }

        this.drawLegend(this.indexColorScale);
    
        /*var data = this.ranks.map(d => {
            var obj = {"state": d.state};
            this.indexToDisplay.forEach(index => {
                var temp = {};
                temp[index] = d[index];
                Object.assign(obj, temp);
            });
            return obj;
        })

        // update the data with the average

        data.forEach(d => {
            var average = 0;
            d3.entries(d).forEach(i => {
                if (i.key != "state") average = average + +i.value;
            })
            average = average / (d3.entries(d).length - 1);
            Object.assign(d, {"average": average});
        })*/

        // 2. then just update the svg
        // Fill can change if features change and stroke if state changes
        this.states_shapes
            .attr("fill", d => {
                var stateInfo = this.findStateInfo(d.properties.NAME.toUpperCase(), this.data, this.currentFeatures);
                if(stateInfo){
                    // add texture to selected elements
                    var texture = textures.circles().complement().background(this.indexColorScale(stateInfo));
                    this.svg.call(texture);
                    if(this.currentData.map(d => d.state).includes(d.properties.NAME.toUpperCase())){
                        if(this.currentStates.includes(d.properties.NAME.toUpperCase())){
                            return texture.url();
                        }else{
                            return this.indexColorScale(stateInfo);
                        }
                    }else{
                        return "none";
                    }                    
                }else{
                    return "white";
                }       
            });
    }


    findStateInfo(stateName, data, features){
        if(features.length == 1){
            for(var i = 0; i < data.length; i++){
                if(data[i].state == stateName) {
                    return data[i][features[0]];
                };
            }
        }else{
            for(var i = 0; i < data.length; i++){
                if(data[i].state == stateName) {
                    var average = 0;
                    features.forEach(d => average += +data[i][d]);
                    console.log(average/features.length);
                    return average/features.length;
                };
            }
        }
    }
   
    drawTitle(featuresOnDisplay){

        let text = "Displaying: "; 
        this.currentFeatures.forEach(d => text = text + d +  "|");

        const title = this.svg
        .append("g")
        .append("text")
        .attr("x", 10)
        .attr("y", 35)
        .attr("font-weight", "bold")
        .attr("font-size", "2em")
        .text(text);
    }

    // Given a feature (column) displays its color map
    drawLegend(targetScale){

        const x = d3.scaleLinear()
            .domain(targetScale.domain())
            .rangeRound([0, 260]);
        
        const legend = this.svg.append("g")
            .style("font-size", "0.8rem")
            .style("font-family", "sans-serif")
            .attr("transform", "translate("+(this.width/2)+","+(this.height - 40)+")");
        
        const label = legend.append("text")
            .attr("y", -8)
            .attr("font-weight", "bold")
            .attr("font-size", "2em")
            .text("Index Color Scale");
        
        const scale = legend.append("g")
    
        scale.selectAll("rect")
            .data(d3.range(1, 50, 1))
            .enter().append("rect")
                .attr("height", 15)
                .attr("x", d => x(d)) // This should be dynamic
                .attr("width", (260 / 49) * 1.25)
                .attr("fill", d => this.indexColorScale(d));
        
        scale.call(
        d3.axisBottom(x) // This should be dynamic
            .tickSize(15)
        )
        .select(".domain")
            .remove();
     
    }









    //////////////////////

    drawPopulationLayer(){
        console.log("draw population");
        this.svg.selectAll("path")
            .style("fill", function(d) {
                // Get data value
                var value = d.properties.ranks.population;
                if (value) {
                    //If value exists…
                    return "rgba(0,184,148, " + value/50+ ")";
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            });

    }

    changeFill(state){
        
    }

    removePopulationLayer(){
    }

    // Layer 2: economic / stability

    drawStabilityLayer(){
        console.log("draw stability");
        this.svg.selectAll("path")
            .style("fill", function(d) {
                // Get data value
                var value = d.properties.ranks.stability;
                if (value) {
                    //If value exists…
                    return "rgba(0,184,148, " + value/50+ ")";
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            });
    }

    drawDevelopmentLayer(){
        console.log("draw stability");
        this.svg.selectAll("path")
            .style("fill", function(d) {
                // Get data value
                var value = d.properties.ranks.development;
                if (value) {
                    //If value exists…
                    return "rgba(0,184,148, " + value/50+ ")";
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            });
    }

    removeStabilityLayer(){

    }

    // Layer 3: talent

    drawTalentLayer(){
        console.log("draw talent");
        this.svg.selectAll("path")
            .style("fill", function(d) {
                // Get data value
                var value = d.properties.ranks.talent;
                if (value) {
                    //If value exists…
                    return "rgba(0,184,148, " + value/50+ ")";
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            });
        // this.svg.selectAll(".university")
        //     .data(this.universities)
        //     .enter()
        //     .append("circle")
        //     .attr("class", "university")
        //     .attr("cx", d => {
        //         return this.projection([d.lng, d.lat])[0];
        //     })
        //     .attr("cy", d => {
        //         return this.projection([d.lng, d.lat])[1];
        //     })
        //     .attr("r", d => {                
        //         return 5;
        //     })
        //     .attr("stroke", "black")
        //     .attr("fill", "white")
        //     .on("click", d => console.log(d.institution + ": " + d.influence));


    }

    removeTalentLayer(){
        this.svg.selectAll(".university").remove();
    }

    // Layer 4: location
    drawLocationLayer(){

    }

    removeLocationLayer(){

    }

    // Experimental Layers

    drawCNBCBestCitiesLayer(){
        this.us_counties.objects.top_cities = {
            type: "GeometryCollection",
            geometries: this.us_counties.objects.tl_2015_us_county.geometries.filter(g => (this.cnbc_best_cities.map(d => d.city)).includes(g.properties.NAME))
        };
        

        this.svg.selectAll(".cities")
            .data(topojson.feature(this.us_counties, this.us_counties.objects.top_cities).features)
            .enter()
            .append("path")
            .attr("class", "cities")
            .attr("d", this.path);
    }

    removeCNBCBestCitiesLayer(){
        this.svg.selectAll(".cities").remove();
    }

    // setters

    setStateClickCb(cb){
        this.stateClickCb = cb;
    }

    
}