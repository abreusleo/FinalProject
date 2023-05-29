
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl } from '@angular/forms';
import { ApiResponse, ApiMatchesResponse, EventType, ApiEvent, PlayersResponse, Player } from './Services/interfaces';
import { ApiCaller } from "./Services/api-caller";
import { environment } from "src/environments/environment";
import * as d3 from "d3";
import { MapComponent } from "./map/map.component";
import { HeatmapSquare } from "./Services/classes";

let AllPlayers = {
  "id": -1,
  "name": "Todos",
  "nickname": "Todos",
  "number": -1,
  "in_court": true,
  "team": ""
}

@Component({
  providers: [MapComponent],
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

  caller: ApiCaller = new ApiCaller();

  home_team: string = "";
  away_team: string = "";

  chosenMatch: string;
  chosenEvent: string;
  chosenPlayers: string;
  chosenGraph: string;

  heatmapSize: number = 25;

  scaleLimit: number = 0;
  mostShots: number = 0;
  
  graphArray: Array<ApiEvent> = [];
  handledGraphArray: Array<ApiEvent> = [];
  overlap: Array<number> = [];
  heatmap: Array<Array<HeatmapSquare>>;

  apiForm = new FormGroup({
    match: new FormControl(''),
    eventType: new FormControl(''),
    player: new FormControl(''),
    visualization: new FormControl('')
  });

  constructor(private comp: MapComponent){  }

  public callMapComponent(): void{
    this.comp.RenderGraph(this.graphArray, this.heatmap, this.handledGraphArray, this.chosenGraph);
  }

  ngOnInit() {
    this.heatmap = Array.from(Array(this.heatmapSize), () => {
      let arr = new Array(this.heatmapSize)
      for(var i = 0; i < this.heatmapSize; arr[i++] = new HeatmapSquare(0,0,0));
      return arr;
    });
    this.onLoad();
  }
  
  async matchSelected(){
    this.playersData = [AllPlayers];
    const players : PlayersResponse = await this.caller.callForPlayersFromMatch(this.chosenMatch).then(a => a.json());
    let player : Player;

    this.home_team = players.home_team.name;
    this.away_team = players.away_team.name;

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
    const apiEvents : Array<EventType> = await this.caller.callForEventTypes().then(a => a.json());
    const apiMatches : ApiMatchesResponse = await this.caller.callForMatches().then(a => a.json());
    apiEvents.forEach(element => {
      this.eventTypes.push(element);
    });
    this.matches = apiMatches;
  }

  async onSubmit() {
    this.ResetData();
    const apiData : ApiResponse = await this.caller.callForMatchEvents(this.apiForm.value.match, this.apiForm.value.eventType, this.apiForm.value.player).then(a => a.json());
    apiData.data.forEach(el => {    
      if(el.team.name == this.home_team){
        if (el.position.x > 50){
          el.position.x = 100 - el.position.x;
          el.position.y = 100 - el.position.y;
        }
      }
      else if(el.team.name == this.away_team){
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
    this.callMapComponent();
  }

  private FillHeatmapData(element : any){
    let hitCodes = ["A2C", "A3C"];
    let missCodes = ["A2E", "A3E"];
    this.heatmap[Math.floor(element.position.x/(Math.floor(100/this.heatmapSize)))][this.heatmapSize - Math.floor(element.position.y/(Math.floor(100/this.heatmapSize))) - 1].shots += 1;
    if(hitCodes.includes(element.code))
      this.heatmap[Math.floor(element.position.x/(Math.floor(100/this.heatmapSize)))][this.heatmapSize -  Math.floor(element.position.y/(Math.floor(100/this.heatmapSize))) - 1].hit += 1;
    else if (missCodes.includes(element.code))
      this.heatmap[Math.floor(element.position.x/(Math.floor(100/this.heatmapSize)))][this.heatmapSize -  Math.floor(element.position.y/(Math.floor(100/this.heatmapSize))) - 1].miss += 1;
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

  private initializeHeatmap(){
    this.heatmap = Array.from(Array(this.heatmapSize), () => {
      let arr = new Array(this.heatmapSize)
      for(var i = 0; i < this.heatmapSize; arr[i++] = new HeatmapSquare(0,0,0));
      return arr;
    });
  }
  private ResetData(): void{
    this.graphArray = [];
    this.handledGraphArray = [];
    this.overlap = [];
    this.initializeHeatmap();
  }
}
