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

        //this.hierarchy = 
        console.log(this.chartData);

        // Visualization parameters

        this.width = 800;//d3.select(this.element).node().getBoundingClientRect().width;
        this.height = 600;//d3.select(this.element).node().getBoundingClientRect().height;
        this.margin = {top: 30, right: 100, bottom: 50, left:200}; // fix hardcoding

        this.svg = d3.select(this.element)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        // temporal
        this.svg.append("rect")
            .attr("x", 10)
            .attr("y", 10)
            .attr("width", 30)
            .attr("height", 30)
            .on("click", d => {
                console.log("clicked");
                this.updateDataStates("subset", this.generateRandomStateArray())
            });

        this.scatter = this.svg.append("g")
            .attr("transform", "translate("+this.margin.left+","+this.margin.top+")")

        this.statesGridLines = this.scatter.append("g").attr("class", "state-grid-lines");
        this.scatterPoints = this.scatter.append("g").attr("class", "scatter-points");


        this.featuresScale = d3.scalePoint().range([this.height - this.margin.bottom - this.margin.top, 0]);
        this.statesScale = d3.scalePoint().range([0, this.width - this.margin.left - this.margin.right]);
        this.featuresSizeScales = {};

        this.updateScatterData(this.currentStates, this.currentFeatures);
    }

    updateScatterData(states, features){

        console.log("update");
        this.currentStates = states;
        this.currentFeatures = features;

        this.chartData = [];
        this.data.forEach(d => {
            if(this.currentStates.includes(d.state)){
                d3.entries(d).forEach(f => {
                    var temp = {state: d.state};
                    if(this.currentFeatures.includes(f.key)){
                        temp["feature"] = f.key;
                        temp["value"] = +f.value;
                        this.chartData.push(temp);
                    }
                })
            }
            
        });
        
        // Update scales
        this.featuresScale.domain(this.currentFeatures);
        this.statesScale.domain(this.currentStates);

        this.featuresSizeScales = {};
        this.currentFeatures.forEach(f => {
            var scale = d3.scaleLinear();
            var domain = d3.extent(this.chartData, d => {
                if(d.feature == f){
                    return +d.value;
                }
            });
            scale.domain(domain).range([5, 20]);
            this.featuresSizeScales[f] = scale;
        });
        console.log(this.featuresSizeScales);
    
        this.drawScatter();

    }

    drawScatter(){

        var lines = this.statesGridLines.selectAll("line")
            .data(this.currentStates)

        lines.exit().remove();
        
        lines
            .enter()
            .append("line")
            .attr("x1", d => this.statesScale(d)).attr("y1",0)
            .attr("x2", d => this.statesScale(d)).attr("y2",this.height - this.margin.bottom - this.margin.top)
            .attr("stroke", "gray")
            .attr("stroke-width", "1")
            .attr("stroke-dasharray", "4 4");

        var points = this.scatterPoints.selectAll("circle").data(this.chartData);

        points.exit().remove();

        points
            .enter().append("circle")
            .attr("cx", d => this.statesScale(d.state))
            .attr("cy", d => this.featuresScale(d.feature))
            .attr("r", d => this.featuresSizeScales[d.feature](d.value))
            .on("mouseover", function(d){
                d3.select(this).attr("fill", "red");
            })
            .on("mouseout", function(d){
                d3.select(this).attr("fill", "black");
            }).on("click", function(d){
                console.log(d);
            });

        d3.select(".axis-states").remove();
        this.svg.append("g").attr("class", "axis-states")
            .attr("transform", "translate("+this.margin.left+","+(this.height - this.margin.bottom + 30)+")")
            .call(d3.axisBottom(this.statesScale));

        d3.select(".axis-features").remove();
        this.svg.append("g").attr("class", "axis-features")
            .attr("transform", "translate("+(this.margin.left - 30)+","+ this.margin.top +")")
            .call(d3.axisLeft(this.featuresScale));
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