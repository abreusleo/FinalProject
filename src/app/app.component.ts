
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl } from '@angular/forms';
import { ApiResponse, ApiMatchesResponse, EventType, ApiEvent, PlayersResponse, Player} from './Services/interfaces';
import { ApiCaller } from "./Services/api-caller";
import { environment } from "src/environments/environment";
import * as d3 from "d3";
import { MapComponent } from "./map/map.component";
import { HeatmapSquare, ApiEventClass } from "./Services/classes";
import { ChosenGraphService } from "./Services/chosenGraph";

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
  eventTypes: EventType[] = [{"code" : "NONE", "name":"Todos"}, {"code" : "A2C, A2E, A3C, A3E", "name":"Arremessos"}, {"code" : "VIA, V24, VSQ, VVC, V5S, V3S, V8S", "name": "Violações"},  {"code" : "FAC, FAD, FAO, FAT", "name": "Faltas"}, {"code": "ERR", "name": "Erros"}];
  matches: ApiMatchesResponse = {"data": []};
  playersData: Player[] = [AllPlayers];

  caller: ApiCaller = new ApiCaller();

  home_team: string = "";
  away_team: string = "";
  
  width = environment.mapWidth;
  height = environment.mapHeight;

  chosenMatch: string[];
  chosenEvent: string;
  chosenPlayers: string;
  chosenGraph: string;
  showEventCases: string;
  loading: boolean = false;

  heatmapSize: number = 25;

  mostCases: number = 0;

  scaleLimit: number = 0;
  mostShots: number = 0;
  
  graphArray: Array<ApiEvent> = [];
  handledGraphArray: Array<ApiEvent> = [];
  overlap: Array<string> = [];
  heatmap: Array<Array<HeatmapSquare>>;

  apiForm = new FormGroup({
    match: new FormControl(''),
    eventType: new FormControl(''),
    player: new FormControl(''),
    visualization: new FormControl(''),
    eventCases: new FormControl('')
  });

  chosenGraphService = new ChosenGraphService();

  constructor(private comp: MapComponent){  }

  public callMapComponent(): void{
    this.scaleLimit = parseInt(this.comp.RenderGraph(this.graphArray, this.heatmap, this.handledGraphArray, this.chosenGraph, this.mostCases, this.showEventCases).toFixed(2));
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
    let playersFromMatch : Array<string> = new Array<string>();
    this.chosenMatch.forEach(async element => {
      const players : any = await this.caller.callForPlayersFromMatch(element).then(a => a.json());
      let player : Player;
      let teams : string[] = Object.keys(players);
  
      this.home_team = teams[0];
      this.away_team = teams[1];
  
      this.chosenGraphService.setHomeTeam(this.home_team);
      this.chosenGraphService.setAwayTeam(this.away_team);
      
      let home_players : Player[] = players[this.home_team]
      let away_players : Player[] = players[this.away_team]

      home_players.forEach(element => {
        player = element;
        player.team = this.home_team
        if(!playersFromMatch.includes(element.name))
        {
          this.playersData.push(player);
          playersFromMatch.push(element.name);
        }
      });
      away_players.forEach(element => {
        player = element;
        player.team = this.away_team
        if(!playersFromMatch.includes(element.name))
        {
          this.playersData.push(player);
          playersFromMatch.push(element.name);
        }
     });
    })
   this.selectSize = 10;
  }

  async onLoad(){
    const noPositionEvents: Array<String> = ["BOR", "BRE", "FIM", "FIQ", "IQU", "LLC", "LLE", "RDE", "RED", "REO", "ROE", "SBE", "SBS", "TET"]
    const apiEvents : Array<EventType> = await this.caller.callForEventTypes().then(a => a.json());
    const apiMatches : ApiMatchesResponse = await this.caller.callForMatches().then(a => a.json());
    apiEvents.forEach(element => {
      if(!noPositionEvents.includes(element.code))
      this.eventTypes.push(element);
    });
    apiMatches.data.forEach(element => {
      if(element.home_team.name == "Flamengo" || element.away_team.name == "Flamengo" )
        this.matches.data.push(element);
    });
  }

  async onSubmit() {
    this.ResetData();
    this.loading = true;
    let apiData = new Array<ApiEvent>;
    for(let i = 0; i < this.chosenMatch.length; i++){
      let apiResponse : ApiResponse = await this.caller.callForMatchEvents(this.chosenMatch[i], this.apiForm.value.eventType, this.apiForm.value.player).then(a => a.json());
      apiResponse.data.forEach(element => {
        apiData.push(element);
      });
    }

    apiData.forEach(el => {    
      if(el.team.name == "Flamengo"){
        if (el.position.x > 50){
          el.position.x = 100 - el.position.x;
          el.position.y = 100 - el.position.y;
        }
      }
      else if(el.team.name != "Flamengo"){
        if (el.position.x < 50){
          el.position.x = 100 - el.position.x;
          el.position.y = 100 - el.position.y;
        }
      }
      el.radius = 6;
      el.cases = 1;
      if(this.chosenGraph == "heatmap")
        this.FillHeatmapData(el);
      this.graphArray.push(el)
    });
    if(this.chosenGraph == "grouped-scatter")
    {
      this.ScatterOverlapHandler2(apiData);
      apiData.sort(function(a, b){return b.radius - a.radius})
    }
    
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
  //
  private ScatterOverlapHandler(event: ApiEvent) : void{
    let distance = 0;
    for(const handledEvent of this.handledGraphArray){
      if(handledEvent.code == event.code && handledEvent.event_id != event.event_id && !this.overlap.includes(`m${event.match_id}-e${event.event_id}`))
      {
        //if(handledEvent.cases < 25){
          distance = Math.sqrt((handledEvent.position.x - event.position.x) ** 2 + (handledEvent.position.y - event.position.y) ** 2);

          if (distance < 6 + handledEvent.radius) { // Overlap case
            if(handledEvent.cases < 25)
              handledEvent.radius += 1;
            handledEvent.cases += event.cases;

            let newX = (handledEvent.position.x * handledEvent.radius + event.position.x * event.radius) / (handledEvent.radius + event.radius);
            let newY = (handledEvent.position.y * handledEvent.radius + event.position.y * event.radius) / (handledEvent.radius + event.radius);

            handledEvent.position.x = newX;
            handledEvent.position.y = newY;

            if(handledEvent.cases > this.mostCases){
              this.mostCases = handledEvent.cases
              this.chosenGraphService.setMostCases(this.mostCases)
            }
            this.overlap.push(`m${event.match_id}-e${event.event_id}`)
          }
        //}
      }
    }
    if(!this.overlap.includes(`m${event.match_id}-e${event.event_id}`))
    { 
      this.handledGraphArray.push(event);
    }
  }

  private ScatterOverlapHandler2(apiEvents: Array<ApiEvent>) : void{
    let distance = 0;

    let done = false;
    while(!done){
      // let s_max = -1;
      let r_min = 10000;
      let max_event = null;
      let max_event2 = null;
      done = true;
      for(const event of apiEvents){
        for(const event2 of apiEvents){
            
          if(event != event2 && event.code == event2.code)
          {
            if((event.team.acronym == "FLA" && event2.team.acronym == "FLA") || (event2.team.acronym != "FLA" && event2.team.acronym != "FLA")){
              distance = this.distance(event, event2);
              if (distance < event.radius + event2.radius) { // Overlap case
                if (event.radius < r_min || event2.radius < r_min){
                    max_event = event;
                    max_event2 = event2;
                    done = false;
                  }
              }
            }
          }
        }
      }
      if(!done && max_event != null && max_event2 != null){
        let newEvent = new ApiEventClass();
        newEvent.cases = max_event.cases + max_event2.cases
        newEvent.code = max_event.code;
        newEvent.radius = Math.sqrt(newEvent.cases) * 6 
        newEvent.position.x = this.changeXPosition(max_event, max_event2);
        newEvent.position.y = this.changeYPosition(max_event, max_event2);
        newEvent.team.name = max_event.team.acronym == "FLA" ? "Flamengo" : "Adversários";

        apiEvents.splice(apiEvents.indexOf(max_event), 1);
        apiEvents.splice(apiEvents.indexOf(max_event2), 1);

        apiEvents.push(newEvent);
      }
    }
    this.graphArray = apiEvents;
  }

  private distance(event1: ApiEvent, event2: ApiEvent ) : number{
    const x = d3.scaleLinear().domain([0, 100]).range([ 0, this.width ]);
    const y = d3.scaleLinear().domain([0, 100]).range([ this.height, 0]);
    let distance = (Math.sqrt(Math.pow(x(event1.position.x) - x(event2.position.x), 2) + Math.pow(y(event1.position.y) - y(event2.position.y), 2)))
    return distance;
  }

  private changeXPosition(event1: ApiEvent, event2: ApiEvent ){
    let peso1 = event1.radius;
    let peso2 = event2.radius;

    return (event1.position.x * peso1 + event2.position.x * peso2) / (peso1 + peso2);
  }
  private changeYPosition(event1: ApiEvent, event2: ApiEvent ){
    let peso1 = event1.radius;
    let peso2 = event2.radius;
    return (event1.position.y * peso1 + event2.position.y * peso2) / (peso1 + peso2);
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
