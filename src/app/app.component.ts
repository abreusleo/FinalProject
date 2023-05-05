
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl } from '@angular/forms';
import { ApiResponse, ApiMatchesResponse, EventType, ApiEvent, PlayersResponse, Player } from './Utils/interfaces';
import { ApiCaller } from "./Utils/api-caller";
import { GraphPlotter } from "./Utils/graphPlotter";
import { environment } from "src/environments/environment";
import * as d3 from "d3";

export class HeatmapSquare{
  shots: number;
  hit: number;
  miss: number;

  constructor(shots: number, hit: number, miss: number){
    this.shots = shots;
    this.hit = hit;
    this.miss = miss;
  }
}

let caller = new ApiCaller();
let plotter = new GraphPlotter();

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
const heatmapSize = 25;


let heatmap = Array.from(Array(heatmapSize), () => {
  let a = new Array(heatmapSize)
  for(var i = 0; i < heatmapSize; a[i++] = new HeatmapSquare(0,0,0));
  return a;
});


let zoom:any = d3.zoom()
  .on('zoom', handleZoom)
  .scaleExtent([1, 5])
  .translateExtent([[0, 0], [width, height]]);

function handleZoom(e:any) {
  d3.select('svg g').attr('transform', e.transform);
}

function initializeHeatmap(){
  heatmap = Array.from(Array(heatmapSize), () => {
    let a = new Array(heatmapSize)
    for(var i = 0; i < heatmapSize; a[i++] = new HeatmapSquare(0,0,0));
    return a;
  });
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  selectSize = 1;
  title = environment.title;
  eventTypes: EventType[] = [{"code" : "NONE", "name":"Todos"}, {"code" : "A2C, A2E, A3C, A3E", "name":"Arremessos"}];
  matches: ApiMatchesResponse = {"data": []};
  playersData: Player[] = [AllPlayers];

  chosenMatch: any;
  chosenEvent: any;
  chosenPlayers: any;
  chosenGraph: any;

  scaleLimit: number = 0;
  mostShots: number = 0;
  
  graphArray: ApiEvent[] = [];
  handledGraphArray: ApiEvent[] = [];
  overlap: number[] = [];

  apiForm = new FormGroup({
    match: new FormControl(''),
    eventType: new FormControl(''),
    player: new FormControl(''),
    visualization: new FormControl('')
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
    .attr("class", "ImgSvg")
    .call(zoom);

    svg
    .append("image")
    .attr('xlink:href','https://i.imgur.com/yBvF2RJ.png')
    .attr('height', height)
    .attr('width', width)
    .attr('preserveAspectRatio', 'none');
  }

  private drawPlot(): void {
  // create a tooltip
  var tooltip = d3.select("#scatter")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "0.5px")
    .style("border-radius", "5px")
    .style("padding", "5px");

  if(this.chosenGraph == "heatmap")
  {
    let result = plotter.heatmap(tooltip, heatmap, width, height, margin);
    this.scaleLimit = result[0];
    this.mostShots = result[1];
  }
  else if(this.chosenGraph == "scatter")
    plotter.scatter(tooltip, this.graphArray, width, height, svg, false);
  else if(this.chosenGraph == "grouped-scatter")
    plotter.scatter(tooltip, this.handledGraphArray, width, height, svg, true);
  }

  ngOnInit() {
    this.onLoad();
  }
  
  async matchSelected(){
    this.playersData = [AllPlayers];
    const players : PlayersResponse = await caller.callForPlayersFromMatch(this.chosenMatch).then(a => a.json());
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
    this.ResetData();
    const apiData : ApiResponse = await caller.callForMatchEvents(this.apiForm.value.match, this.apiForm.value.eventType, this.apiForm.value.player).then(a => a.json());
    apiData.data.forEach(el => {    
      if(el.team.name == home_team){
        if (el.position.x > 50){
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
      el.radius = 5;
      el.cases = 1;
      this.FillHeatmapData(el);
      if(["A2C", "A3C", "A2E", "A3E"].includes(el.code) && this.chosenGraph == "grouped-scatter")
      {
        this.ScatterOverlapHandler(el);
      }
      this.graphArray.push(el)
    });
    d3.selectAll("svg > g > g").remove();
    this.drawPlot();
  }

  private FillHeatmapData(element : any){
    let hitCodes = ["A2C", "A3C"];
    let missCodes = ["A2E", "A3E"];
    heatmap[Math.floor(element.position.x/(Math.floor(100/heatmapSize)))][heatmapSize - Math.floor(element.position.y/(Math.floor(100/heatmapSize))) - 1].shots += 1;
    if(hitCodes.includes(element.code))
      heatmap[Math.floor(element.position.x/(Math.floor(100/heatmapSize)))][heatmapSize -  Math.floor(element.position.y/(Math.floor(100/heatmapSize))) - 1].hit += 1;
    else if (missCodes.includes(element.code))
      heatmap[Math.floor(element.position.x/(Math.floor(100/heatmapSize)))][heatmapSize -  Math.floor(element.position.y/(Math.floor(100/heatmapSize))) - 1].miss += 1;
  }

  private ScatterOverlapHandler(event: ApiEvent) : void{
    let distance = 0;
    for(const handledEvent of this.handledGraphArray){
      if(handledEvent.code == event.code && handledEvent.event_id != event.event_id && !this.overlap.includes(event.event_id))
      {
        distance = Math.sqrt((handledEvent.position.x - event.position.x) ** 2 + (handledEvent.position.y - event.position.y) ** 2);
        if (distance < event.radius + handledEvent.radius) { // Overlap case
          handledEvent.radius += handledEvent.radius * Math.sqrt(2)/10;
          handledEvent.cases += 1;
          this.overlap.push(event.event_id)
        }
      }
    }
    if(!this.overlap.includes(event.event_id))
    { 
      this.handledGraphArray.push(event);
    } 
  }
  private ResetData(): void{
    this.graphArray = [];
    this.handledGraphArray = [];
    this.overlap = [];
    initializeHeatmap();
  }
}
export class Point{
  constructor(x: number, y:number){
    this.x = x;
    this.y = y;
  }

  public x: number;
  public y: number;
}

export class OverlapEvent{
  constructor(match_id: number, code: string, position: Point, radius: number, cases: number){
    this.match_id = match_id;
    this.code = code;
    this.position = position;
    this.radius = radius;
    this.cases = cases;
    this.events = new Array();
  };

  match_id: number;
  code: string;
  position: Point
  radius: number;
  cases: number;
  events: number[];
}



