class Radar {
    constructor (opts) {
        
        this.element = opts.element;
        this.data = opts.data;
        this.features = d3.entries(this.data[0])
            .filter(d => d.key != opts.objectId)
            .map(d => d.key);

        this.scoresDomain = [0, 50]; // TODO: check domain
        /*console.log(this.data.reduce((a,b) => {
            let arr1 = d3.entries(a)
                .filter(o => o.key != "state");
            let arr2 = d3.entries(b)
                .filter(o => o.key != "state");
            return arr1.concat(arr2);
        }));*/
        console.log(opts);
        console.log(this.features);

        // General variables
        this.pointsToDisplay = []; //var x = $("#typehead").parent().width();
        this.width = d3.select(this.element).node().getBoundingClientRect().width; //opts.containerDimensions[0];
        this.height = d3.select(this.element).node().getBoundingClientRect().height; //opts.containerDimensions[1]; 
        
        console.log(d3.select(this.element).node().getBoundingClientRect());
        console.log(this.width + ", " + this.height);
        
        this.svg = d3.select(this.element)
            .append("svg")
            .attr("width", this.width)
            .attr("height",  this.height);

        // Title area variables

        this.titleMargin = {top: 10, right: 5, bottom: 5, left: 5};
        this.titleWidth = this.width;
        this.titleHeight = 0.2 * this.height;

        this.titleContainer = this.svg
            .append("g")
            .attr("class", "title")
            .attr("transform", "translate("+this.titleMargin.left+","+this.titleMargin.top+")");

        // Radar area variables
        
        this.radarMargin = {top: 10, right: 10, bottom: 20, left: 10};
        this.radarWidth = this.width;
        this.radarHeight = 0.8 * this.height;        
        this.radius = d3.min([(this.radarWidth - this.radarMargin.left - this.radarMargin.right)/2, 
            (this.radarHeight - this.radarMargin.top - this.radarMargin.bottom)/2]);

        this.radarContainer = this.svg
            .append("g")
            .attr("class", "radar")
            .attr("transform", "translate(0, "+ this.titleHeight +")");

        this.chart = this.radarContainer.append("g")
            .attr("class", "radar-area")
            .attr("transform", "translate("+(this.radarWidth/2)+","+(this.radarHeight/2)+")");

        this.featuresScale = d3.scalePoint().domain(this.features).range([0, 2 * Math.PI - (this.features.length - 1) * (2 * Math.PI / this.features.length)]);
        this.scoresScale = d3.scaleLinear().domain(this.scoresDomain).range([this.radius, 0]); 
        this.statesScale = d3.scaleOrdinal().domain(this.data.map(d => d.state)).range(d3.schemeCategory10); // TODO: fix

        this.arc = d3.arc();
        this.line = d3.lineRadial();

        this.drawRadar();
        this.drawAnnotationLayer();
        this.drawTitle();
    }

    drawPoint(point){

        var duplicatePoint = false;

        var dataPoint = this.data
            .filter(d => d.state == point.properties.NAME.toUpperCase())[0]; // It should always find the state!
        console.log(dataPoint);

        this.pointsToDisplay.forEach((d, i) => {
            if (d.state == dataPoint.state) { 
                this.pointsToDisplay.splice(i, 1);
                duplicatePoint = true;
            }
        });

        var numberOfStates = this.pointsToDisplay.length;

        if (!duplicatePoint) numberOfStates = this.pointsToDisplay.push(dataPoint);
        
        if (numberOfStates == 3){
            this.pointsToDisplay.shift();
        } 

        this.drawRadar();
        this.drawTitle();

        return this.pointsToDisplay;
    }

    drawTitle(){

        var titles = this.titleContainer.selectAll(".point-title")
            .data(this.pointsToDisplay, d => d.state)

        titles.exit().remove();

        titles.enter()
            .append("text")
            .attr("class", "point-title")
            .merge(titles)
            .attr("x", 10)
            .attr("y", (d, i) => i * 30)
            .attr("dy", "1em")
            .attr("font-size", "2em")
            .attr("fill",d => this.statesScale(d.state))//d => this.statesScale(d.state))
            .text(d => d.state);
    }

    drawRadar(){

        // TODO: Draw axis layer
        console.log(this.pointsToDisplay);

        var area = d3.lineRadial();            
        area.angle(d => this.featuresScale(d.key));
        area.radius(d => this.scoresScale(d.value));

        var areas = this.chart.selectAll(".radar-area").data(this.pointsToDisplay, d => d.state);

        areas.exit().remove();

        areas.enter()
            .append("path")
            .attr("class", "radar-area")
            //.attr("stroke", d => this.statesScale(d.state)) // TODO: check line closing
            .attr("fill", d => {
                var color = d3.color(this.statesScale(d.state)); 
                color.opacity = 0.5;
                return color;})
            .attr("d", d => area(d3.entries(d).filter(d => this.features.includes(d.key))));
        
    }

    drawAnnotationLayer(){

        // Axis

        var dataPoints = d3.range(this.scoresDomain[0], this.scoresDomain[1], 10);

        console.log(dataPoints);

        this.chart.selectAll(".radar-guide-line").data(dataPoints).enter()
            .append("path")
            .attr("stroke", "gray")
            .attr("stroke-width", "1")
            .attr("stroke-dasharray", "2,4")
            .attr("d", d => this.arc({
                innerRadius: this.scoresScale(d),
                outerRadius: this.scoresScale(d),
                startAngle: 0,
                endAngle: 2 * Math.PI
            }));
        
        this.chart.selectAll(".radar-guide-text").data(dataPoints).enter()
            .append("text")
            .attr("x",this.scoresScale)
            .attr("y",0)
            .attr("dx", "-1.5em")
            .attr("dy", "1em")
            .attr("font-size", "0.6em")
            .attr("color", "gray")
            .text(d => d);

        this.chart.selectAll(".radar-axis").data(this.features).enter()
            .append("line")
            .attr("stroke", "gray")
            .attr("stroke-width", "1")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", d => this.getFeaturePosition(d, this.radius)[0])
            .attr("y2", d => this.getFeaturePosition(d, this.radius)[1]);

        this.chart.selectAll(".radar-axis-labels").data(this.features).enter()
            .append("text")                
            .attr("x", d => this.getFeaturePosition(d, this.radius)[0])
            .attr("y", d => this.getFeaturePosition(d, this.radius)[1])
            .attr("text-anchor", d => this.getFeaturePosition(d, this.radius)[0] >= 0? "end" : "start")
            //.attr("dx", lineEnding[0] < 0? -3 : 3)
            .attr("dy", d => {
                var featurePositionY = this.getFeaturePosition(d, this.radius)[1];
                console.log(d + ": " + featurePositionY);
                return this.getFeaturePosition(d, this.radius)[1] >= 0? "-0.5em" : "1em"
            })
            .attr("font-size", "0.85em")
            .attr("color", "gray")
            //.attr("text-anchor", "labsAnchors")
            .text(d => d);

    }

    remove(){
        d3.select(".radar").remove();
    }

    // helpers

    getFeaturePosition(feature, score){
        var angle = this.featuresScale(feature);
        
        var x = score * Math.cos(angle),
            y = score * Math.sin(angle);
        
        return [x, y];
    };

}