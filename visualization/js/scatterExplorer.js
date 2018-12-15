class ScatterExplorerView{

    constructor(opts){
        this.element = opts.element;
        this.data = opts.data;
        this.metadata = opts.metadata;
        this.objectId = opts.objectId;

        this.currentData = this.data;

        this.states = [];
        this.currentFeatures = [];
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



        this.featuresScale = d3.scalePoint().domain(this.currentFeatures).range([this.height - this.margin.bottom - this.margin.top, 0]);
        this.statesScale = d3.scalePoint().domain(this.states).range([0, this.width - this.margin.left - this.margin.right]);
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

        //this.updateDataStates("all", []);
        this.updateDataStates("subset", ["MAINE", "MONTANA", "VERMONT", "NORTH CAROLINA"]);
        this.draw();
    }

    updateDataStates(type, states){
        // first update general data
        if(type == "all"){
            this.currentData = this.data;
        }else if(type == "subset"){
            this.currentData = this.data.filter(d => states.includes(d.state));
        }

        // then update all dependencies
        this.states = this.currentData.map(d => d.state);

        this.currentFeatures = [];
        this.metadata.forEach(d => {
            if(d.hierarchy == "none" && d.column_id != "state")
                this.currentFeatures.push(d.column_id);
        });

        this.chartData = [];
        this.currentData.forEach(d => {
            d3.entries(d).forEach(f => {
                var temp = {state: d.state};
                if(this.currentFeatures.includes(f.key)){
                    temp["feature"] = f.key;
                    temp["value"] = +f.value;
                    this.chartData.push(temp);
                }
            })
        }); 

        this.featuresScale.domain(this.currentFeatures);
        this.statesScale.domain(this.states);
        console.log(this.statesScale);
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
        console.log(this.currentData);


        this.draw();
    }

    draw(){

        var lines = this.statesGridLines.selectAll("line")
            .data(this.states)

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

    generateRandomStateArray(){
        const numRand = Math.round(Math.random() * 50);
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