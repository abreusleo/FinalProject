
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl } from '@angular/forms';
import { ApiResponse, ApiMatchesResponse, EventType, ApiEvent, ApiMatch } from './interfaces';
import * as d3 from "d3";

let match: ApiMatch;
let svg: any;
let margin = 50;
let width = 750 - (margin * 2);
let height = 400 - (margin * 2);

let zoom:any = d3.zoom()
  .on('zoom', handleZoom)
  .scaleExtent([1, 5])
  .translateExtent([[0, 0], [width, height]]);

function handleZoom(e:any) {
  d3.select('svg g').attr('transform', e.transform);
  //d3.selectAll('svg g g circle').attr("r", 1)
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'Basquete';
  eventTypes: EventType[] = [{"code" : "NONE", "name":"Todos"}];
  matches: ApiMatchesResponse = {"data": []};
  selectedValue: any;
  selectedValue2: any;
  graphArray: ApiEvent[] = [];
  conditionalboolProperty: boolean = false;
  apiForm = new FormGroup({
    match: new FormControl(''),
    eventType: new FormControl('')
  });

  private createSvg(): void {
    svg = d3.select("figure#scatter")
    .append("svg")
    .attr("width", width + (margin * 2))
    .attr("height", height + (margin * 2))
    .style("border", '1px solid black')
    .style('display', 'block')
    .style('margin', 'auto')
    .append("g")
    .attr("transform", "translate(" + margin + "," + margin + ")")
    .call(zoom);

    svg
    .append("image")
    .attr('xlink:href','https://i.imgur.com/h0ng2pY.png')
    .attr('height', 300)
    .attr('width', 650)
    .attr('preserveAspectRatio', 'none');
  }
  private drawPlot(): void {
    var tooltip = d3.select("figure#scatter")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    var mouseover = function(d: any) {
      tooltip.style("opacity", 1)
    }
  
    var mousemove = function(this: any, e : any, d:any) {
      tooltip.html("Jogador: " + d.player.name + "<br/>Evento: " + d.code)
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
    .data(this.graphArray)
    .enter()
    .append("circle")
    .attr("cx", (d: any) => x(d.position.x))
    .attr("cy",  (d: any) => y(d.position.y))
    .attr("r", 5)
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
  }

  ngOnInit() {
    this.onLoad();
  }

  async onLoad(){
    const apiEvents : Array<EventType> = await this.callForEventTypes().then(a => a.json());
    const apiMatches : ApiMatchesResponse = await this.callForMatches().then(a => a.json());
    apiEvents.forEach(element => {
      this.eventTypes.push(element);
    });
    this.matches = apiMatches;
  }

  async onSubmit() {
    this.graphArray = [];
    const apiData : ApiResponse = await this.callForMatchEvents(this.apiForm.value.match, this.apiForm.value.eventType).then(a => a.json());
    match = this.matches.data.filter(a => String(a.match_id) == this.apiForm.value.match)[0];

    apiData.data.forEach(el => {
      this.graphArray.push(el)
    });
    this.conditionalboolProperty = true;
    this.createSvg();
    this.drawPlot();
  }
  
  public async callForMatchEvents(match: any, eventType: any){
    let link = ""
    if(eventType == undefined || eventType == "NONE"){
      link = `https://apibird.tecgraf.puc-rio.br/v1/events/1/${match}?has_position=true&page=1&limit=500`;
    }
    else{
      link = `https://apibird.tecgraf.puc-rio.br/v1/events/1/${match}?event_types=${eventType}&has_position=true&page=1&limit=500`;
    }
    const response = await fetch(link,
    {
      method: 'GET',
      headers: {'accept' : 'application/json', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhcGlfdG9rZW46MSIsInNjb3BlcyI6ImNvcmUifQ.6AgyEAU-RQ8NBJwI3rZz9HCRdVTggE9tOCgSSxZlVio'},
    });
    return response;
  }

  public async callForMatches(){
    const response = await fetch(`https://apibird.tecgraf.puc-rio.br/v1/matches/1?season=2021`,
    {
      method: 'GET',
      headers: {'accept' : 'application/json', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhcGlfdG9rZW46MSIsInNjb3BlcyI6ImNvcmUifQ.6AgyEAU-RQ8NBJwI3rZz9HCRdVTggE9tOCgSSxZlVio'},
    });
    return response;
  }

  public async callForEventTypes(){
    const response = await fetch(`https://apibird.tecgraf.puc-rio.br/v1/events/types`,
    {
      method: 'GET',
      headers: {'accept' : 'application/json', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhcGlfdG9rZW46MSIsInNjb3BlcyI6ImNvcmUifQ.6AgyEAU-RQ8NBJwI3rZz9HCRdVTggE9tOCgSSxZlVio'},
    });
    return response;
  }
}
export class Point{
  public x: number;
  public y: number;
}




