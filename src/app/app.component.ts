
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl } from '@angular/forms';
import { ApiResponse, ApiMatchesResponse, EventType, ApiEvent, ApiMatch, PlayersResponse, Player } from './interfaces';
import { ApiCaller } from "./api-caller";
import * as d3 from "d3";
//TODO clean players list
let match: ApiMatch;
let svg: any;
let margin = 50;
let width = 750 ;
let height = 458 ;
let AllPlayers = {
  "id": -1,
  "name": "Todos",
  "nickname": "Todos",
  "number": -1,
  "in_court": true,
  "team": ""
}
let home_team = ""
let away_team = ""
let caller = new ApiCaller();

let zoom:any = d3.zoom()
  .on('zoom', handleZoom)
  .scaleExtent([1, 5])
  .translateExtent([[0, 0], [width, height]]);

function handleZoom(e:any) {
  d3.select('svg g').attr('transform', e.transform);
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  selectSize = 1;
  title = 'Basquete';
  eventTypes: EventType[] = [{"code" : "NONE", "name":"Todos"}, {"code" : "A2C, A2E, A3C, A3E", "name":"Arremessos"}];
  matches: ApiMatchesResponse = {"data": []};
  playersData: Player[] = [AllPlayers];

  selectedValue: any;
  selectedValue2: any;
  selectedValue3: any;

  graphArray: ApiEvent[] = [];
  conditionalboolProperty: boolean = false;

  apiForm = new FormGroup({
    match: new FormControl(''),
    eventType: new FormControl(''),
    player: new FormControl('')
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
    .attr('xlink:href','https://i.imgur.com/D0smQFm.png')
    .attr('height', height)
    .attr('width', width)
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
      tooltip.html("Jogador: " + d.player.name + "<br/>Evento: " + d.code + "<br/>X:" + d.position.x + "<br/>Y:" + d.position.y)
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
  async matchSelected(){
    this.playersData = [AllPlayers];
    const players : PlayersResponse = await caller.callForPlayersFromMatch(this.selectedValue).then(a => a.json());
    let player : Player;

    home_team = players.home_team.name;
    away_team = players.away_team.name;

    players.home_players.forEach(element => {
      player = element;
      player.team = players.home_team.name
      this.playersData.push(player);
    });
    players.away_players.forEach(element => {
      player = element;
      player.team = players.away_team.name
      this.playersData.push(player);
   });
   this.selectSize = this.playersData.length/4;
  }
  async onLoad(){
    const apiEvents : Array<EventType> = await caller.callForEventTypes().then(a => a.json());
    const apiMatches : ApiMatchesResponse = await caller.callForMatches().then(a => a.json());
    apiEvents.forEach(element => {
      this.eventTypes.push(element);
    });
    this.matches = apiMatches;
    this.createSvg();
  }
  async onSubmit() {
    this.graphArray = [];
    const apiData : ApiResponse = await caller.callForMatchEvents(this.apiForm.value.match, this.apiForm.value.eventType, this.apiForm.value.player).then(a => a.json());
    match = this.matches.data.filter(a => String(a.match_id) == this.apiForm.value.match)[0];

    apiData.data.forEach(el => {    
      if(el.team.name == home_team){
        if (el.position.x > 50){
          console.log(el.position.x, 100 - el.position.x)
          el.position.x = 100 - el.position.x;
          el.position.y = 100 - el.position.y;
        }
      }
      else if(el.team.name == away_team){
        if (el.position.x < 50){
          el.position.x = 100 - el.position.x;
          el.position.y = 100 - el.position.y;
        }
      }
      this.graphArray.push(el)
    });

    this.conditionalboolProperty = true;
    d3.selectAll("svg > g > g").remove();
    this.drawPlot();
  }
}
export class Point{
  public x: number;
  public y: number;
}




