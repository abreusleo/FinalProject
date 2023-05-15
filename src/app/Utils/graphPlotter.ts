import * as d3 from "d3";
import { HeatmapSquare } from "../Utils/classes";
import { ApiEvent } from './interfaces';
import { environment } from "src/environments/environment";
const { pathDataToPolys } = require('node_modules/svg-path-to-polygons');

let pathData;
let heatmapPolygons = environment.heatmapPolygons; 
let width = environment.mapWidth;
let height = environment.mapHeight;
let margin = environment.mapMargin;

const x = d3.scaleLinear().domain([0, 100]).range([ 0, width ]);
const y = d3.scaleLinear().domain([0, 100]).range([ height, 0]);

export class GraphPlotter {
  bestBalance : number;
  worstBalance : number;
  mostShots : number;
  scaleLimit : number;

  public scatter(tooltip: any, points: any, isGrouped: boolean){
    var svg = d3.select(".ImgSvg")
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

  public heatmap(tooltip: any, heatmap: any)
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
        .style("opacity", function(d: any) { return opacityScale(d.value.shots); })
    }

    var colorScale = d3.scaleSequential<string, number>().interpolator(d3.interpolateRdYlGn).domain([0, this.scaleLimit])

    var opacityScale = d3.scaleLinear().range([0.6, 1]).domain([0, this.mostShots]);
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
              .attr("width", function(d: any) {return x(1);})
              .attr("height", function(d: any) {return y(1);})
              .style("fill", function(d : any) { 
                  if(d.value.shots != 0)
                  return colorScale(d.value.hit/d.value.shots * 100); 
                  else
                    return "#FFFFFF"
                })
              .style("opacity",  function(d : any) { return opacityScale(d.value.shots); })
              .on("mouseover", mouseover)
              .on("mousemove", mousemove)
              .on("mouseleave", mouseleave);
    return [this.scaleLimit, this.mostShots];
  }
  private heatmapScale(heatmapData : Array<Array<HeatmapSquare>>){
    this.bestBalance = 0;
    this.worstBalance = 1;
    this.mostShots = 1;
    let balance = 0;
    heatmapData.forEach(heatmapRow => {
      heatmapRow.forEach(heatmapSquare =>{
        balance = heatmapSquare.hit/heatmapSquare.shots * 100;
        if(balance > this.bestBalance)
          this.bestBalance = balance;
        else if (balance < this.worstBalance)
          this.worstBalance = balance;
        if(heatmapSquare.shots > this.mostShots)
          this.mostShots = heatmapSquare.shots;
      })
    });
    this.scaleLimit = Math.max(this.bestBalance, Math.sqrt(this.worstBalance ** 2))
  }

  public customHeatmap(tooltip: any, data: any){
    var svg = d3.select(".ImgSvg")
    .attr("width", width + margin*2)
    .attr("height", height + margin*2)
    .append("g");
    this.scaleLimit = 100;
    for(let i = 0; i < heatmapPolygons.length; i++){
      this.drawPolygons(svg, heatmapPolygons[i], data, tooltip)
    }
    return [this.scaleLimit, this.mostShots]
  }
  private drawPolygons(svg: any, pathData : string, data: ApiEvent[], tooltip: any){
    let points = pathDataToPolys(pathData)[0];
    var colorScale = d3.scaleSequential<string, number>().interpolator(d3.interpolateRdYlGn).domain([0, this.scaleLimit])    
    var mouseover = function(d : any) {
      tooltip
        .style("opacity", 1)
      d3.select(this)
        .style("opacity", 0.8)
    }
    var mouseleave = function(d : any) {
      tooltip
        .style("opacity", 0)
      d3.select(this)
        .style("opacity", function(d: any) { return 0.6; })
    }

    let hitCases = 0;
    let missCases = 0;
    let totalCases = 0;
    for(let i = 0; i < data.length; i++){
      if(d3.polygonContains(points, [x(data[i].position.x), y(data[i].position.y)]))
      {
        if (data[i].code == "A2E" || data[i].code == "A3E")
        {
          missCases += 1;
        }
        else if (data[i].code == "A2C" || data[i].code == "A3C")
        {
          hitCases += 1;
        }
        if(data[i].code == "A2E" || data[i].code == "A3E" || data[i].code == "A2C" || data[i].code == "A3C")
          totalCases += 1;
      }
    }
    var center = d3.polygonCentroid(points);
    if(totalCases > this.mostShots)
      this.mostShots = totalCases;

    var mousemove = function(e : any) {
        tooltip
          .html("Quantidade de arremessos: " + totalCases + "</br>Acertos: " + hitCases + "</br>Erros: " + missCases)
          .style("left", (e.clientX + 20) + "px")
          .style("top", (e.clientY) + "px")
    }
    let percentage = hitCases/totalCases * 100;
    
    svg.append("polygon")
      .attr("points", points)
      .style("stroke", "black")
      .style("stroke-width", "3px")
      .attr("fill", function(d : any) { 
        if (isNaN(percentage))
          return "#FFFFFF"
        return colorScale(percentage); 
      })
      .style("opacity", 0.6)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);;
    
    svg.append("text")
      .text(totalCases)
      .attr("x", center[0] - 20)
      .attr("y", center[1])
      .style("font-size", "100%")
      .style("text-align", "center")
    if(!isNaN(percentage))
      svg.append("text")
        .text(percentage.toFixed(2)+"%")
        .attr("x", center[0] - 20)
        .attr("y", center[1] + 20)
        .style("font-size", "100%")
        .style("text-align", "center")
  }
}