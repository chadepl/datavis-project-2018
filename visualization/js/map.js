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

        // Global attributes of the visualization
        this.width = d3.select(this.element).node().getBoundingClientRect().width;
        this.height = d3.select(this.element).node().getBoundingClientRect().height;
        
        this.svg = d3.select(this.element)
             .append("svg")
             .attr("width", this.width)
             .attr("height", this.height);

        this.projection = d3.geoAlbersUsa()
            .scale(800) 
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

        // Tooltip
        this.tooltip = d3.select(this.element).append("div")	
            .attr("class", "tooltip-map")				
            .style("opacity", 0);


        this.redrawMap();
    }

    /* This is mainly used by app.js to update the visualization */
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
            this.indexColorScale = d3.scaleSequential(d3["interpolate" + feature_info.color_scheme]).domain([51, 1])
        }else if (this.currentFeatures.length > 1) {
            this.indexColorScale = d3.scaleSequential(d3.interpolateRdPu).domain([51, 1]);
        }

        this.drawLegend(this.indexColorScale);

        this.drawTitle();
    
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
            }).on("mouseover", d => {
                // tooltip dimensions: height is 75px width is 200px
                var x = d3.event.pageX - 20 - 100;
                var y = d3.event.pageY - 110;
                this.tooltip.transition()		
                    .duration(200)		
                    .style("opacity", .9)		
                this.tooltip.html(this.generateTooltipHTML(d.properties.NAME.toUpperCase(), this.findStateInfo(d.properties.NAME.toUpperCase(), this.data, this.currentFeatures)))	
                    .style("left", x + "px")		
                    .style("top", y + "px");	
                })					
            .on("mouseout", d => {		
                this.tooltip.transition()		
                    .duration(200)		
                    .style("opacity", 0);	
            });
    }
   
    drawTitle(){

        let text = "Displaying: "; 
        if(this.currentFeatures.length == 0){
            text += "choose a ranking in the scatter pane to start."
        }else if(this.currentFeatures.length == 1){ 
            text += this.metadata.filter(d => d.column_id == this.currentFeatures[0])[0]["column_display_name"];
        }else{
            text += "average of " + this.metadata.filter(d => this.currentFeatures.includes(d.column_id)).map(f => f.column_display_name).join(", ");
        }
        
        this.svg.select(".map-title").remove();

        this.svg
            .append("g")
            .attr("class", "map-title")
            .append("text")
            .attr("x", 10)
            .attr("y", 35)
            .attr("font-weight", "bold")
            .attr("font-size", "1.5em")
            .text(text);
    }

    // Given a feature (column) displays its color map
    drawLegend(targetScale){

        var legendWidth = 260,
            legendHeight = 15,
            legendMargin = {top: 0, right: 25, bottom: 50, left: 0},
            scaleDomain = [targetScale.domain()[1], targetScale.domain()[0]],
            step = (legendWidth / Math.abs(scaleDomain[1] - scaleDomain[0])),
            scaleData = d3.range(d3.min(scaleDomain), d3.max(scaleDomain), 1);
            
        const x = d3.scaleLinear()
            .domain(scaleDomain)
            .rangeRound([0, legendWidth]);
        
        const legend = this.svg.append("g")
            .style("font-size", "0.8rem")
            .style("font-family", "sans-serif")
            .attr("transform", "translate("+(this.width - legendWidth - legendMargin.right)+","+(this.height - legendMargin.bottom)+")");
        
        const label = legend.append("text")
            .attr("y", -8)
            .attr("font-weight", "bold")
            .attr("font-size", "2em")
            .text("Ranking Color Scale");
        
        const scale = legend.append("g")

        console.log(scaleDomain);
    
        scale.selectAll("rect")
            .data(scaleData)
            .enter().append("rect")
                .attr("height", legendHeight)
                .attr("x", d => x(d)) // This should be dynamic
                .attr("width", step * 1.25)
                .attr("fill", d => this.indexColorScale(d));

        legend.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", legendWidth).attr("height", legendHeight)
            .attr("fill", "none")
            .attr("stroke", "black");
        
        scale.call(
        d3.axisBottom(x) // This should be dynamic
            .tickSize(15)
        )
        .select(".domain")
            .remove();
     
    }

    /* Utilities */

    generateTooltipHTML(state, value){

        var html = "";

        html += "<h2>"+ state +"</h2>";

        if (this.currentFeatures.length == 1)
            html += "<h3>"+ this.currentFeatures[0] +": "+ value +"</h3>";
        else
        html += "<h3> Average: "+ value +"</h3>";

        return html;
            
    }

    findStateInfo(stateName, data, features){
        for(var i = 0; i < data.length; i++){
            if(data[i].state == stateName) {
                var average = 0;
                features.forEach(d => average += +data[i][d]);
                return average/features.length;
            };
        }
    }

    /* Setters */

    setStateClickCb(cb){
        this.stateClickCb = cb;
    }

    
}