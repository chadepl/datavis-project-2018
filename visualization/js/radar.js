class Radar {
    constructor (opts) {
        
        this.element = opts.element;
        this.data = opts.data;
        this.objectId = opts.objectId
        this.features = d3.entries(this.data[0])
            .filter(d => d.key != this.objectId)
            .map(d => d.key);

        // TODO: fix the ranges to consider all minus the objectId
        this.scoresDomain = d3.extent(this.data, d => +d[this.features[0]]); 

        // General variables
        this.pointsToDisplay = []; 
        this.width = d3.select(this.element).node().getBoundingClientRect().width; 
        this.height = d3.select(this.element).node().getBoundingClientRect().height; 
        
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

        this.featuresScale = this.getFeatureAngle;//d3.scalePoint().domain(this.features).range([0, 2 * Math.PI - (this.features.length - 1) * (2 * Math.PI / this.features.length)]);
        this.scoresScale = d3.scaleLinear().domain(this.scoresDomain).range([this.radius, 0]); 
        console.log(this.scoresScale);
        this.statesScale = d3.scaleOrdinal().domain(this.data.map(d => d.state)).range(d3.schemeCategory10); // TODO: fix

        this.arc = d3.arc();
        this.line = d3.lineRadial();

        this.drawRadar();
        this.drawAnnotationLayer();
        this.drawTitle();
    }

    getFeatureAngle(feature){
        let step = (2 * Math.PI) / this.features.length;
        for(var i = 0; i < this.features.length; i++){
            if(this.features[i] == feature)
                return i * step;
        }
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

        var lineGenerator = d3.radialLine();

        var lines = this.chart.selectAll(".radar-line").data(this.pointsToDisplay, d => d.state);

        lines.exit().remove();

        lines.enter()
            .append("path")
            .attr("class", "radar-line")
            .attr("d", d => {
                var data = [];
                this.features.forEach(f => data.push([this.featuresScale(f), this.scoresScale(+d[f])]));
                data.push([this.featuresScale(this.features[0]), this.scoresScale(+d[this.features[0]])]); // close the line
                return lineGenerator(data); //[[angle1, radius1],[angle2, radius2],...]
            })
            .attr("fill", "none")
            .attr("stroke", d => this.statesScale(d.state))
            .attr("stroke-width", "3");

        /*var testTexts = this.chart.selectAll(".radar-test-text").data(this.features);

        testTexts.exit().remove();

        testTexts.enter()
            .append("text")
            .attr("class", "radar-test-text")
            .attr("x", d => this.getFeaturePosition(d, 40)[0])
            .attr("y", d => this.getFeaturePosition(d, 40)[1])
            .text(d => d);*/
            

        /// Enable if areas are desired
        /*var area = d3.lineRadial();            
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
            .attr("d", d => area(d3.entries(d).filter(d => this.features.includes(d.key))));*/
        
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

        
        console.log(this.features.map(f => [f, this.featuresScale(f)]));

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