
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

let heatmap = Array.from(Array(100), () => [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

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
    .attr("class", "ImgSvg")
    .call(zoom);

    svg
    .append("image")
    .attr('xlink:href','https://i.imgur.com/D0smQFm.png')
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
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "5px");

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseover = function(d : any) {
    tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }
  var mousemove = function(this: any, e : any, d:any) {
    tooltip
      .html("Quantidade de arremessos: " + d.value)
      .style("left", (e.clientX + 20) + "px")
      .style("top", (e.clientY) + "px")
  }
  var mouseleave = function(d : any) {
    tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
  }
    var myColor = d3.scaleLinear<string, number>()
    .domain([1, 4])
    .range(["grey", "red"])
    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0,heatmap[0].length]);

    var y = d3.scaleLinear()
        .range([0, height])
        .domain([0,heatmap.length]);


    var svg = d3.select(".ImgSvg")
        .attr("width", width + margin*2)
        .attr("height", height + margin*2)
        .append("g");

    var row = svg.selectAll(".row")
      .data(heatmap).enter().append("svg:g")
      .attr("class", "row");

    var col = row.selectAll(".cell")
    .data(function (d,i) { return d.map(function(a) { return {value: a, row: i}; } ) })
            .enter().append("svg:rect")
              .attr("class", "cell")
              .attr("x", function(d, i) { return x(d.row); })
              .attr("y", function(d, i) { return y(i); })
              .attr("width", x(1))
              .attr("height", y(1))
              .style("fill", function(d) { return myColor(d.value); })
              .style("opacity", 0.8)
              .on("mouseover", mouseover)
              .on("mousemove", mousemove)
              .on("mouseleave", mouseleave);
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
      heatmap[el.position.x][el.position.y] += 1;
      console.log(heatmap[el.position.x][el.position.y])
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




