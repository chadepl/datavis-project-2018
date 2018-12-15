class ScatterExplorerView{

    constructor(opts){

        this.featureClickCb = null;
        this.element = opts.element;
        this.data = opts.data;
        this.metadata = opts.metadata;
        this.objectId = opts.objectId;

        this.currentData = this.data;

        this.currentStates = opts.currentStates;
        this.currentFeatures = opts.currentFeatures;
        this.chartData = [];

        this.allFeaturesOnDisplay = this.metadata
            .filter(d => d.hierarchy == "none" && d.column_id != "state")
            .map(d => d.column_id);

        //this.hierarchy = 
        console.log(this.chartData);
        console.log(this.currentStates);
        console.log(this.currentFeatures);
        console.log(this.allFeaturesOnDisplay);

        // Visualization parameters

        this.width = 800;//d3.select(this.element).node().getBoundingClientRect().width;
        this.height = 600;//d3.select(this.element).node().getBoundingClientRect().height;
        this.margin = {top: 30, right: 100, bottom: 50, left:150}; // fix hardcoding

        this.svg = d3.select(this.element)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.scatter = this.svg.append("g")
            .attr("transform", "translate("+this.margin.left+","+this.margin.top+")")

        this.statesGridLines = this.scatter.append("g").attr("class", "state-grid-lines");
        this.scatterPoints = this.scatter.append("g").attr("class", "scatter-points");

        this.featuresScale = d3.scalePoint().range([this.height - this.margin.bottom - this.margin.top, 0]);
        this.statesScale = d3.scalePoint().range([0, this.width - this.margin.left - this.margin.right]);
        this.featuresSizeScales = {};
        this.featuresColorScales = {};

        // Tooltip
        this.div = d3.select(this.element).append("div")	
            .attr("class", "tooltip")				
            .style("opacity", 0);

        this.updateScatterData(this.currentStates, this.currentFeatures);
    }

    updateScatterData(states, features){

        console.log("update");
        this.currentStates = states;
        this.currentFeatures = features;

        // {state: ALABAMA, talent_rank: 20, population_rank: 10}

        this.chartData = this.data;
        this.chartData = this.data.filter(d => this.currentStates.includes(d.state));
        this.chartData = this.chartData.map(d => {
            var obj = {state: d.state};
            this.allFeaturesOnDisplay.forEach(f => obj[f] = d[f]);
            return obj;
        })
        console.log(this.chartData);
        this.chartData.sort((a,b) => +a[this.currentFeatures[0]] - b[this.currentFeatures[0]]);
        console.log(this.chartData);

        var orderedStates = this.chartData.map(d => d.state);
        
        // Update scales
        this.featuresScale.domain(this.allFeaturesOnDisplay);
        this.statesScale.domain(orderedStates);

        this.featuresSizeScales = {};
        this.allFeaturesOnDisplay.forEach(f => {
            var scale = d3.scaleLinear();
            let allValuesFeature = this.chartData.map(d => +d[f]);
            var domain = d3.extent(allValuesFeature);
            scale.domain(domain).range([5, 20]);
            this.featuresSizeScales[f] = scale;
        });
        console.log(this.featuresSizeScales);

        this.featuresColorScales = {};
        this.allFeaturesOnDisplay.forEach(f => {
            var feature_info = this.metadata.filter(d => d.column_id == f)[0];
            var scale = d3.scaleSequential(d3["interpolate" + feature_info.color_scheme]);
            let allValuesFeature = this.chartData.map(d => +d[f]);
            var domain = d3.extent(allValuesFeature);
            scale.domain(domain);
            this.featuresColorScales[f] = scale;
        });
    
        this.drawScatter();

    }

    drawScatter(){

        var t = d3.transition()
            .duration(750)
            .ease(d3.easeLinear);

        var lines = this.statesGridLines.selectAll("line")
            .data(this.chartData);

        lines.transition(t)
            .attr("x1", d => this.statesScale(d.state))
            .attr("x2", d => this.statesScale(d.state));

        lines.exit().remove();
        
        lines
            .enter()
            .append("line")
            .attr("x1", d => this.statesScale(d.state))
            .attr("x2", d => this.statesScale(d.state))
            .merge(lines)
            .attr("y1",0)
            .attr("y2",this.height - this.margin.bottom - this.margin.top)
            .attr("stroke", "gray")
            .attr("stroke-width", "1")
            .attr("stroke-dasharray", "4 4");

        var verticalGroups = this.scatterPoints.selectAll("g")
            .data(this.chartData, d => d.state);

        // States that were unselected
        verticalGroups.exit().remove();
  
        verticalGroups.selectAll("circle")
        .transition(t)
            .attr("cx", d => this.statesScale(d.state))
            .attr("fill", d => {
                if(d.feature == this.currentFeatures[0]){
                    return this.featuresColorScales[d.feature](d.value);
                }else{
                    return "gray";
                }
            })
  
        verticalGroups.enter()
            .append("g")
            .selectAll("circle")
            .data(d => {
                var state = d.state;
                return d3.entries(d).filter(f => f.key != "state").map(g => {
                    return {state: state, feature: g.key, value: g.value};
                })
            })
            .enter()
            .append("circle")
            .attr("cy", d => this.featuresScale(d.feature))
            .attr("r", d => this.featuresSizeScales[d.feature](d.value))
            .attr("cx", d => this.statesScale(d.state))
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            .attr("fill", d => {
                if(d.feature == this.currentFeatures[0]){
                    return this.featuresColorScales[d.feature](d.value);
                }else{
                    return "gray";
                }
            })
            .on("click", function(d){
                console.log(d);
            })
            .on("mouseover", d => {	
                this.div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                this.div.html(this.generateTooltipHTML(d.state, d.feature))	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px");	
                })					
            .on("mouseout", d => {		
                this.div.transition()		
                    .duration(200)		
                    .style("opacity", 0);	
            });;

        d3.select(".axis-features").remove();
        
        var axisFeatures = this.svg.append("g").attr("class", "axis-features")
            .attr("transform", "translate(0,"+ this.margin.top +")")
            .selectAll(".feature-label")
            .data(this.allFeaturesOnDisplay).enter()
            .append("g").attr("class", "feature-label")
            .attr("transform", d => "translate(0,"+this.featuresScale(d)+")")
            .on("click", d => {
                this.handleFeatureClick(d);
            });
            
        axisFeatures.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dx", "0.8em")
            .attr("dy", "1.5em")
            .text(d => d);

        axisFeatures.append("rect")
            .attr("x", 0).attr("y", 0)
            .attr("width", this.margin.left - 20).attr("height", 20)
            .attr("fill", "none")
            .attr("stroke", "black");

        d3.select(".axis-states").remove();
        this.svg.append("g").attr("class", "axis-states")
            .attr("transform", "translate("+this.margin.left+","+(this.height - this.margin.bottom + 30)+")")
            .call(d3.axisBottom(this.statesScale));

        
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
        html += "<h3>"+ feature +"</h3>";

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

    generateRandomStateArray(){
        const numRand = Math.round(Math.random() * 10);
        var randomIndex = [];
        for(var i = 0; i < numRand; i++){
            var tempRand = Math.round(Math.random()*50);
            if(!randomIndex.includes(tempRand))
                randomIndex.push(tempRand);
        }
        var states = [];
        randomIndex.forEach(i => states.push(this.fullStates()[i]));
        return states;
    }

    fullStates(){ return [
        "ALABAMA",
        "ALASKA",
        "ARIZONA",
        "ARKANSAS",
        "CALIFORNIA",
        "COLORADO",
        "CONNECTICUT",
        "DELAWARE",
        "FLORIDA",
        "GEORGIA",
        "HAWAII",
        "IDAHO",
        "ILLINOIS",
        "INDIANA",
        "IOWA",
        "KANSAS",
        "KENTUCKY",
        "LOUISIANA",
        "MAINE",
        "MARYLAND",
        "MASSACHUSETTS",
        "MICHIGAN",
        "MINNESOTA",
        "MISSISSIPPI",
        "MISSOURI",
        "MONTANA",
        "NEBRASKA",
        "NEVADA",
        "NEW HAMPSHIRE",
        "NEW JERSEY",
        "NEW MEXICO",
        "NEW YORK",
        "NORTH CAROLINA",
        "NORTH DAKOTA",
        "OHIO",
        "OKLAHOMA",
        "OREGON",
        "PENNSYLVANIA",
        "RHODE ISLAND",
        "SOUTH CAROLINA",
        "SOUTH DAKOTA",
        "TENNESSEE",
        "TEXAS",
        "UTAH",
        "VERMONT",
        "VIRGINIA",
        "WASHINGTON",
        "WEST VIRGINIA",
        "WISCONSIN",
        "WYOMING"
      ]}

}