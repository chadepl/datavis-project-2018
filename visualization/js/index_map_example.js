
var layer_on = false;

var promises = [
    d3.json("us_states.json"),
    d3.csv("us_companies.csv"),
    d3.csv("top_universities_geocoded_final.csv"),
    d3.csv("best_cities_amazon.csv"),
    d3.json("us_county.json")
];

Promise.all(promises).then(files => {
    console.log(files);
    
    let opts = {
        element: document.querySelector(".map-idiom"),
        data: {
            geometry: files[0],
            statal_data: [],
            companies: files[1],
            universities: files[2],
            cnbc_best_cities: files[3],
            us_counties: files[4] // another geometry file. TODO: join with the states one
        } 
    }
    
    console.log(opts);
    map = new MapView(opts);

    d3.select(".map-idiom")
        .on("click", d => {
            if(!layer_on){
                map.drawCNBCBestCitiesLayer();
                layer_on = !layer_on;
            }else{
                map.removeCNBCBestCitiesLayer();
                layer_on = !layer_on;
            }});
})



