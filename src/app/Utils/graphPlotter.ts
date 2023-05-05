import * as d3 from "d3";
import { HeatmapSquare } from "../app.component";

export class GraphPlotter {
  bestBalance : number;
  worstBalance : number;
  mostShots : number;
  scaleLimit : number;
  public heatmap(tooltip: any, heatmap: any, width: number, height: number, margin: number)
  {
    this.heatmapScale(heatmap);
    var mouseover = function(d : any) {
      tooltip
        .style("opacity", 1)
      d3.select(this)
        .style("stroke", "black")
        .style("stroke-dasharray", "5,5")
        .style("opacity", 0.8)
    }
    var mousemove = function(e : any, d : any) {
        tooltip
          .html("Quantidade de arremessos: " + d.value.shots+"</br>Taxa de conversão: " + Number(d.value.hit/d.value.shots * 100).toFixed(2)+"%" + "</br>Saldo: " + (d.value.hit - d.value.miss))
          .style("left", (e.clientX + 20) + "px")
          .style("top", (e.clientY) + "px")
    }
    var mouseleave = function(d : any) {
      tooltip
        .style("opacity", 0)
      d3.select(this)
        .style("stroke", "none")
        .style("opacity", function(d: any) { return myOpacity(d.value.shots); })
    }

    var myColor = d3.scaleSequential<string, number>().interpolator(d3.interpolateRdYlGn).domain([0, this.scaleLimit])

    var myOpacity = d3.scaleLinear().range([0.6, 1]).domain([0, this.mostShots]);
    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0,heatmap[0].length]);
  
    var y = d3.scaleLinear()
        .range([0, height])
        .domain([0,heatmap[1].length]);
  
    var svg = d3.select(".ImgSvg")
    .attr("width", width + margin*2)
    .attr("height", height + margin*2)
    .append("g");

    var row = svg.selectAll(".row")
      .data(heatmap).enter().append("svg:g")
      .attr("class", "row");

    var col = row.selectAll(".cell")
    .data(function (d : any,i) { return d.map(function(a : any) { return {value: a, row: i}; } ) })
            .enter()
              .append("svg:rect")
              .attr("class", "cell")
              .attr("x", function(d : any, i) { return x(d.row); })
              .attr("y", function(d, i: any) { return y(i); })
              .attr("width", function(d: any) {if(d.value.shots != 0) return x(1); else return x(0);})
              .attr("height", function(d: any) {if(d.value.shots != 0) return y(1); else return y(0);})
              .style("fill", function(d : any) { return myColor(d.value.hit/d.value.shots); })
              .style("opacity",  function(d : any) { return myOpacity(d.value.shots); })
              .on("mouseover", mouseover)
              .on("mousemove", mousemove)
              .on("mouseleave", mouseleave);
    return [this.scaleLimit, this.mostShots];
  }
  public scatter(tooltip: any, points: any, width: number, height: number, svg: any, isGrouped: boolean){
    var mouseover = function(d: any) {
      tooltip.style("opacity", 1)
    }
  
    var mousemove = function(this: any, e : any, d:any) {
      tooltip.html("Cases: " + d.cases + "<br/>Evento: " + d.code)
        .style("left", (e.clientX+10) + "px")
        .style("top", (e.clientY-40) + "px");
    }
  
    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    var mouseleave = function(d : any) {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0)
    }
    // Add X axis
    const x = d3.scaleLinear()
    .domain([0, 100])
    .range([ 0, width ]);

    // Add Y axis
    const y = d3.scaleLinear()
    .domain([0, 100])
    .range([ height, 0]);
    // Add dots
    const dots = svg.append('g');
    dots.selectAll("dot")
    .data(points)
    .enter()
    .append("circle")
    .attr("cx", (d: any) => x(d.position.x))
    .attr("cy",  (d: any) => y(d.position.y))
    .attr("r", (d: any) => {
        if(isGrouped) 
          return d.radius;
        else
          return 5;
      })
    .style("opacity",.5)
    .style("fill", function(d : any){
      if(d.code == "A2C" || d.code == "A3C" || d.code == "LLC" || d.code == "ENT"){
        return "#00ff00"
      }
      else if(d.code == "A2E" || d.code == "A3E" || d.code == "LLE" || d.code == "ENE"){
        return "#ff0000";
      }
      else if(d.code == "ASS"){
        return "#ffff00"
      }
      else if(d.code == "BOR" || d.code == "BRE" || d.code == "RDE" || d.code == "RED" || d.code == "REO" || d.code == "ERR"){
        return "#81007f"
      }
      return "#ffffff";
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    return dots;
  }
  private heatmapScale(heatmapData : Array<Array<HeatmapSquare>>){
    this.bestBalance = 0;
    this.worstBalance = 1;
    this.mostShots = 1;
    let balance = 0;
    heatmapData.forEach(heatmapRow => {
      heatmapRow.forEach(heatmapSquare =>{
        balance = heatmapSquare.hit/heatmapSquare.shots;
        if(balance > this.bestBalance)
          this.bestBalance = balance;
        else if (balance < this.worstBalance)
          this.worstBalance = balance;
        if(heatmapSquare.shots > this.mostShots)
          this.mostShots = heatmapSquare.shots;
      })
    });
    console.log(this.bestBalance, this.worstBalance, this.mostShots)
    this.scaleLimit = Math.max(this.bestBalance, Math.sqrt(this.worstBalance ** 2))
  }
}