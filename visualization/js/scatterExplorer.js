class ScatterExplorerView{

    constructor(opts){

        this.featureClickCb = null;
        this.element = opts.element;
        this.data = opts.data;
        this.metadata = opts.metadata;
        this.objectId = opts.objectId;

        this.currentStates = opts.currentStates;
        this.currentFeatures = opts.currentFeatures;
        this.chartData = [];

        this.allFeaturesOnDisplay = this.metadata
            .filter(d => d.hierarchy == "none" && d.column_id != "state")
            .map(d => d.column_id);

        // Visualization parameters

        this.width = d3.select(this.element).node().getBoundingClientRect().width;
        this.height = d3.select(this.element).node().getBoundingClientRect().height;
        this.margin = {top: 30, right: 100, bottom: 70, left:150}; 
        this.scatterWidth = this.width - this.margin.left - this.margin.right;
        this.scatterHeight = this.height - this.margin.top - this.margin.bottom;

        this.svg = d3.select(this.element)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.scatterArea = this.svg.append("g")
            .attr("transform", "translate("+this.margin.left+","+this.margin.top+")")

        this.scatterArea.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", this.scatterWidth).attr("height", this.scatterHeight)
            .attr("fill", "none")
            .attr("stroke", "gray");

        this.statesGridLines = this.scatterArea
            .append("g")
            .attr("class", "state-grid-lines");
        this.statesGroups = this.scatterArea
            .append("g")
            .attr("class", "scatter-groups");

        this.featuresScale = d3.scaleBand().domain(this.allFeaturesOnDisplay).range([this.height - this.margin.bottom - this.margin.top, 0]);
        this.statesScale = d3.scaleBand().range([0, this.width - this.margin.left - this.margin.right]);

        this.featuresSizeScales = {};
        this.allFeaturesOnDisplay.forEach(f => {
            var scale = d3.scaleLinear();
            var allValuesFeature = this.data.map(d => +d[f]);
            var domain = d3.extent(allValuesFeature);
            scale.domain(domain).range([(this.featuresScale.bandwidth()*2/3) - 2, 5]);
            this.featuresSizeScales[f] = scale;
        });

        this.featuresColorScales = {};
        this.allFeaturesOnDisplay.forEach(f => {
            var feature_info = this.metadata.filter(d => d.column_id == f)[0];
            var scale = d3.scaleSequential(d3["interpolate" + feature_info.color_scheme]);
            var allValuesFeature = this.data.map(d => +d[f]);
            var domain = d3.extent(allValuesFeature);
            scale.domain(domain);
            this.featuresColorScales[f] = scale;
        });
        this.featuresColorScales["average"] = d3.scaleSequential(d3.interpolateRdPu).domain([50, 1]);

        // tooltip
        this.tooltip = d3.select(this.element).append("div")	
            .attr("class", "tooltip")				
            .style("opacity", 0);

        this.updateScatterData(this.data, this.currentStates, this.currentFeatures);
    }

    updateScatterData(filteredData, states, features){

        this.currentStates = states;
        this.currentFeatures = features;

        this.chartData = filteredData;
        this.chartData = this.chartData.filter(d => this.currentStates.includes(d.state));
        this.chartData = this.chartData.map(d => {
            var obj = {state: d.state};
            var average = 0;
            this.allFeaturesOnDisplay.forEach(f => {
                obj[f] = d[f];
                if (this.currentFeatures.includes(f))
                    average += +d[f];
                obj["average"] = average/this.currentFeatures.length;
            });
            return obj;
        });
        
        // sort by the last feature that was added
        this.chartData.sort((a,b) => +b["average"] - a["average"]);
        var orderedStates = this.chartData.map(d => d.state);
        
        // update scales
        this.statesScale.domain(orderedStates).paddingOuter(5);
        this.barsWidth = this.statesScale.bandwidth() * 0.5;

        this.drawScatter();
    }

    drawScatter(){

        var t = d3.transition()
            .duration(500)
            .ease(d3.easeLinear);

        /* Vertical guide lines */

        var lines = this.statesGridLines
            .selectAll("line")
            .data(this.chartData);

        lines.exit().remove();

        lines
            .enter()
            .append("line")
            .attr("y1",0)
            .attr("y2",this.scatterHeight)
            .attr("stroke", "gray")
            .attr("stroke-width", "1")
            .attr("stroke-dasharray", "4 4")
            .merge(lines).transition(t) // update
            .attr("x1", d => this.statesScale(d.state) + (this.statesScale.bandwidth()/2))
            .attr("x2", d => this.statesScale(d.state) + (this.statesScale.bandwidth()/2));

        
        /* State data groups */

        var verticalGroups = this.statesGroups.selectAll("g")
            .data(this.chartData, d => d.state);

        verticalGroups.exit().remove();

        var stateGroup  = verticalGroups.enter()
            .append("g")
            .selectAll("rect")
            .data(d => {
                var state = d.state;
                var average = d.average;
                return d3.entries(d).filter(f => f.key != "state" && f.key != "average").map(g => {
                    return {state: state, feature: g.key, value: g.value, average: average};
                })
             })
        
        stateGroup.enter()
            .append("rect")
            .attr("x", d => this.statesScale(d.state) + (this.statesScale.bandwidth()/2) - (this.barsWidth/2))
            .attr("y", d => this.featuresScale(d.feature))// - (this.featuresScale.bandwidth()/2))
            .attr("height", d => this.featuresSizeScales[d.feature](d.value))
            .attr("width",  this.barsWidth)
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            .attr("fill", d => {
                if(this.currentFeatures.length > 1){
                    if(this.currentFeatures.includes(d.feature)){
                        return this.featuresColorScales["average"](d.average);
                    }else{
                        return "gray";
                    }
                }else{
                    if(this.currentFeatures.includes(d.feature)){
                        return this.featuresColorScales[d.feature](d.value);
                    }else{
                        return "gray";
                    }
                }
            })
            .on("click", function(d){
                console.log(d);
            })
            .on("mouseover", d => {	
                this.tooltip.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                this.tooltip.html(this.generateTooltipHTML(d.state, d.feature))	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px");	
                })					
            .on("mouseout", d => {		
                this.tooltip.transition()		
                    .duration(200)		
                    .style("opacity", 0);	
            });


        verticalGroups.selectAll("rect")
        .transition(t)
            .attr("x", d => this.statesScale(d.state) + (this.statesScale.bandwidth()/2) - (this.barsWidth/2))
            .attr("width",  this.barsWidth)
            .attr("fill", d => {
                if(this.currentFeatures.length > 1){
                    if(this.currentFeatures.includes(d.feature)){
                        return this.featuresColorScales["average"](d.average);
                    }else{
                        return "gray";
                    }
                }else{
                    if(this.currentFeatures.includes(d.feature)){
                        return this.featuresColorScales[d.feature](d.value);
                    }else{
                        return "gray";
                    }
                }
            })


        /* Axes */
        
        // axis features
        d3.select(".axis-features").remove();
        
        var axisFeatures = this.scatterArea.append("g").attr("class", "axis-features")
            .attr("transform", "translate(0, 0)")
            .selectAll(".feature-label")
            .data(this.allFeaturesOnDisplay)
        
            axisFeatures.exit().remove();
        
        var axisFeaturesElements = axisFeatures.enter()
            .append("g").attr("class", "feature-label")
            .attr("transform", d => "translate("+(-this.margin.left)+","+this.featuresScale(d)+")")
            .on("click", d => {
                this.handleFeatureClick(d);
            });
        
        axisFeaturesElements.append("rect")
            .attr("x", (this.margin.left * .10)/2).attr("y", 0)
            .attr("width", this.margin.left * .90).attr("height", 30)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", d => this.currentFeatures.includes(d)? "4" : "1");
        
        axisFeaturesElements.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dx", "0.8em")
            .attr("dy", "1.3em")
            .attr("font-size", "1.5em")
            .attr("font-weight", "bold")
            .text(d => this.metadata.filter(f => f.column_id == d)[0]["column_display_name"]);

        // axis states
        d3.select(".axis-states").remove();
        this.scatterArea.append("g").attr("class", "axis-states")
            .attr("transform", "translate(0,"+(this.height - this.margin.bottom - this.margin.top)+")")
            .call(d3.axisBottom(this.statesScale))
            .selectAll("text")
            .attr("y", 12)
            .attr("x", 8)
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

        this.scatterArea.select(".axis-states").select(".domain").remove();

        this.scatterArea.select(".axis-states").selectAll("text").on("mouseover", d => console.log(d));

    }

    generateTooltipHTML(state, feature){

        var html = "";

        var features = this.metadata
            .filter(d => d.hierarchy == feature && d.enabled)
            .map(d => d.column_id);
        var stateInfo = this.data
            .filter(d => d.state == state)[0];
        var tooltipData = [];
        features.forEach(f => {
            if(f != "state")
                tooltipData.push({feature : f, value: stateInfo[f]});
        })

        html += "<h2>"+ state +"</h2>";
        html += "<h3>"+ feature +": "+ stateInfo[feature] +"</h3>";

        html += "<table style='width:100%'>"
        html += "<tr>"
        html += "<th>feature</th>"
        html += "<th>value</th>"
        html += "</tr>"
        
        tooltipData.forEach(d => {
            html += "<tr>"
            html += "<td>" + d.feature + "</td>"; 
            html += "<td>"+ d.value + "</td>";
            html += "<tr>"
        });

        html += "</table>"
        return html;
            
    }

    handleFeatureClick(feature){

        this.featureClickCb(feature);
    
    }

    setFeatureClickCb(cb){
        this.featureClickCb = cb;
    }

    
}