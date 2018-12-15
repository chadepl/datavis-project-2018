class MapView {
    constructor(opts){

        this.cb = null;
        this.data = opts.data;
        this.metadata = opts.metadata;
        this.ranks = opts.ranks;
        this.element = opts.element;

        // Preprocessing (should not be done by this component)
        // this.universities = this.universities.filter(d => d.year == "2015");

        // Geometry related attributes
        this.states = topojson.feature(this.geometry, this.geometry.objects.cb_2014_us_state_500k).features;
        this.stateNames = this.ranks.map( s => s.state);
        console.log(this.stateNames);

        // Global attributes    
        this.width = d3.select(this.element).node().getBoundingClientRect().width;
        this.height = d3.select(this.element).node().getBoundingClientRect().height;
        
        this.projection = d3.geoAlbersUsa()
            .scale(1000) // TODO: make this dynamic
            .translate([this.width/2, this.height/2]);
        this.path = d3.geoPath().projection(this.projection);

        this.svg = d3.select(this.element)
             .append("svg")
             .attr("width", this.width)
             .attr("height", this.height);

        // Color scales 

        this.indexColorScale = d3.scaleSequential(d3.interpolateGnBu).domain([50, 1]);

        // Data related attributes
        this.indexToDisplay = [];

        this.drawMap();
        // process the other datasets and store them in a convenient way?
        this.layers = [];

    }

    drawMap(){

        
        /*for(var i = 0 ; i < this.states.length ; i++){
            if(!this.stateNames.includes(this.states[i].properties.NAME.toUpperCase())){
                console.log(this.states[i].properties.NAME.toUpperCase());
                this.states.splice(i,1);
            }
        }
        for(var i = 0 ; i < this.ranks.length ; i++){
            for(var j = 0 ; j < this.states.length; j++){
                var jsonState = this.states[j].properties.NAME;
                if(this.ranks[i].state == jsonState.toUpperCase()){
                    this.states[j].properties.ranks = {
                        "population": this.ranks[i].population,
                        "stability": this.ranks[i].stability,
                        "development": this.ranks[i].development,
                        "talent": this.ranks[i].talent,
                        "total": 1
                    };
                    break;
                }
            }
        }*/


        this.states_poly = this.svg.append("g").selectAll("path")
            .data(this.states)
            .enter()
            .append("path")
                .attr("stroke", "black")
                .attr("class", "state")
                .attr("fill", "white")
                .attr("stroke-linejoin", "round")
                .attr("d", this.path)
                .on("click", d => {
                    // console.log(d.properties.GEOID + ": " + d.properties.NAME);
                    // var state_companies = [];
                    // for (var i = 0; i < this.companies.length; i++){
                    //     if (this.companies[i].state == d.properties.STUSPS) 
                    //         state_companies.push(this.companies[i]);
                    // }
                    // console.log(state_companies);
                    //  this.drawTalentLayer();
                    this.stateClickCb(d);
                });

    }

    // Layers: these correspond to each one of the 4 dimentions of the index

    updateMap(type, elements){
        if(type == "index"){
            this.indexToDisplay = elements;
            this.refreshIndexLayer();
        }
        this.drawLegend("index");
        this.drawTitle(elements);
    }

    drawTitle(featuresOnDisplay){

        let text = "Displaying: "; 
        featuresOnDisplay.forEach(d => text = text + d +  "|");

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
    drawLegend(feature){

        const x = d3.scaleLinear()
            .domain(this.indexColorScale.domain())
            .rangeRound([0, 260]);

        console.log(this.indexColorScale.domain());
        
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

    // Layer 1: population

    findStateInfo(stateName, data, accessor){
        for(var i = 0; i < data.length; i++){
            if(data[i][accessor] == stateName) {
                return data[i];
            };
        }
    }

    refreshIndexLayer(){

        var data = this.ranks.map(d => {
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
        })

        //console.log(this.findStateInfo());

        this.states_poly
            .attr("fill", d => {
                var color = "None";
                var stateInfo = this.findStateInfo(d.properties.NAME.toUpperCase(), data, "state");
                if(stateInfo) color = this.indexColorScale(stateInfo.average)
                return color;
            });

        /*var numChecked = 0;
        numChecked = pop ? numChecked+1 : numChecked;
        numChecked = tal ? numChecked+1 : numChecked;
        numChecked = dev ? numChecked+1 : numChecked;
        numChecked = stab ? numChecked+1: numChecked;

        for(var i = 0 ; i < this.ranks.length ; i++){
            for(var j = 0 ; j < this.states.length ; j++){
                var state = this.states[j].properties.NAME;
                if(this.ranks[i].state == state.toUpperCase()){
                    this.states[j].properties.ranks.total = 0.0;
                    if(pop)
                        this.states[j].properties.ranks.total += this.ranks[i].population / numChecked
                    if(tal)
                        this.states[j].properties.ranks.total += this.ranks[i].talent / numChecked
                    if(dev)
                        this.states[j].properties.ranks.total += this.ranks[i].development / numChecked
                    if(stab)
                        this.states[j].properties.ranks.total += this.ranks[i].stability / numChecked
                    break;
                }
            }    
        }

        this.svg.selectAll(".state")
            .style("fill", function(d) {
                // Get data value
                console.log(d);
                var value = d.properties.ranks.total;
                if (value) {
                    //If value exists…
                    return "rgba(0,184,148, " + value/50+ ")";
                } else {
                    //If value is undefined…
                    return "rgb(213,222,217)";
                }
            });*/
    }

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