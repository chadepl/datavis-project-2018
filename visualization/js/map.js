class MapView {
    constructor(opts){

        this.cb = null;
        this.geometry = opts.data.geometry;
        this.population = opts.data.population;
        this.stability = opts.data.stability;
        this.talent = opts.data.talent;
        this.development = opts.data.development;
        this.ranks = opts.data.ranks;

        this.element = opts.element;

        // Preprocessing (should not be done by this component)
        // this.universities = this.universities.filter(d => d.year == "2015");

        // Global attributes    
        this.projection = d3.geoAlbersUsa();
        this.path = d3.geoPath().projection(this.projection);

        var containerWidth = d3.select('#map_idiom').style('width').slice(0, -2);

        // this should be responsive
        var width = containerWidth,
            height = 600;

        this.svg = d3.select(this.element + " svg");
            // .append("svg")
            // .attr("width", width)
            // .attr("height", height);

        this.drawMap();
        // process the other datasets and store them in a convenient way?
        this.layers = [];

    }

    drawMap(){

        this.states = topojson.feature(this.geometry, this.geometry.objects.cb_2014_us_state_500k).features;
        var stateNames = this.ranks.map( s =>{
            return s.state;
        })
        console.log(this.states);
        for(var i = 0 ; i < this.states.length ; i++){
            if(!stateNames.includes(this.states[i].properties.NAME.toUpperCase())){
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
        }


        var states_poly = this.svg.selectAll("path")
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

    // Layer 1: population

    updateRanksLayer(pop, tal, dev, stab){
        var numChecked = 0;
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
            });
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