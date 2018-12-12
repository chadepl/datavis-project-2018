class Radar {
    constructor (opts) {
        this.element = opts.element;
        this.data = opts.data;
        this.features = opts.dataFeatures;
        this.scoresDomain = [0, 1]; // TODO: check domain
        console.log(opts);

        // General variables
        this.pointsToDisplay = [];
        this.width = opts.containerDimensions[0];
        this.height = opts.containerDimensions[1]; 
        
        this.svg = d3.select(this.element)
            .append("svg")
            .attr("width", this.width)
            .attr("height",  this.height);

        this.svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "None")
            .attr("stroke", "black");

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

        this.featuresScale = d3.scaleBand().domain(this.features).range([0, 2 * Math.PI]);
        this.scoresScale = d3.scaleLinear().domain(this.scoresDomain).range([0, this.radius]); 
        this.statesScale = d3.scaleOrdinal().domain(this.data.map(d => d.city)).range(d3.schemeCategory10); // TODO: fix

        this.arc = d3.arc();
        this.line = d3.lineRadial();

        this.drawRadar();
        this.drawAnnotationLayer();
        this.drawTitle();
    }

    drawPoint(point){

        var duplicatePoint = false;

        this.pointsToDisplay.forEach((d, i) => {
            if (d.city == point.city) {
                this.pointsToDisplay.splice(i, 1);
                duplicatePoint = true;
            }
        });

        var numberOfStates = this.pointsToDisplay.length;

        if (!duplicatePoint) numberOfStates = this.pointsToDisplay.push(point);
        
        if (numberOfStates == 3){
            this.pointsToDisplay.shift();
        } 

        this.drawRadar();
        this.drawTitle();

        return this.pointsToDisplay;
    }

    drawTitle(){

        var titles = this.titleContainer.selectAll(".point-title")
            .data(this.pointsToDisplay, d => d.city)

        titles.exit().remove();

        titles.enter()
            .append("text")
            .attr("class", "point-title")
            .merge(titles)
            .attr("x", 10)
            .attr("y", (d, i) => i * 30)
            .attr("dy", "1em")
            .attr("font-size", "2em")
            .attr("fill",d => this.statesScale(d.city))//d => this.statesScale(d.city))
            .text(d => d.city);
    }

    drawRadar(){

        // TODO: Draw axis layer

        var area = d3.lineRadial();            
        area.angle(d => this.featuresScale(d.key));
        area.radius(d => this.scoresScale(d.value));

        var areas = this.chart.selectAll(".radar-area").data(this.pointsToDisplay, d => d.city);

        areas.exit().remove();

        areas.enter()
            .append("path")
            .attr("class", "radar-area")
            //.attr("stroke", d => this.statesScale(d.city)) // TODO: check line closing
            .attr("fill", d => {
                var color = d3.color(this.statesScale(d.city)); 
                color.opacity = 0.5;
                return color;})
            .attr("d", d => area(d3.entries(d).filter(d => this.features.includes(d.key))));
        
    }

    drawAnnotationLayer(){

        // Axis

        this.chart.selectAll(".radar-guide-line").data([0.2, 0.4, 0.6, 0.8, 1]).enter()
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
        
        this.chart.selectAll(".radar-guide-text").data([0.2, 0.4, 0.6, 0.8, 1]).enter()
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