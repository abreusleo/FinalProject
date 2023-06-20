import { Component, OnInit, Input } from '@angular/core';
import { ApiEvent } from '../Services/interfaces';
import { GraphPlotter } from "../Services/graphPlotter";
import { environment } from "src/environments/environment";
import { HeatmapSquare } from "../Services/classes";
import { ChosenGraphService } from "../Services/chosenGraph";

import * as d3 from "d3";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  @Input()
  scaleLimit: number = 0;
  mostShots: number = 0;

  width = environment.mapWidth;
  height = environment.mapHeight;
  margin = environment.mapMargin;

  heatmap : Array<Array<HeatmapSquare>>;
  graphArray: ApiEvent[] = [];
  handledGraphArray: ApiEvent[] = [];
  loading: boolean = false;

  plotter = new GraphPlotter();
  chosenGraphService = new ChosenGraphService();
  svg: any;

  showEventCases : string;

  constructor() { }

  ngOnInit(): void {
    this.createSvg();
  }

  public verificarCondicao(){
    return this.chosenGraphService.getGraph() == "heatmap";
  }

  public RenderGraph(graphArray: Array<ApiEvent>, heatmap: Array<Array<HeatmapSquare>>, handledGraphArray: Array<ApiEvent>, chosenGraph: string, mostCases: number, showEventCases: string){
    this.graphArray = graphArray;
    this.heatmap = heatmap;
    this.handledGraphArray = handledGraphArray;
    this.chosenGraphService.setGraph(chosenGraph);
    this.mostShots = mostCases;
    this.showEventCases = showEventCases;
    return this.drawPlot();
  }

  private handleZoom(e:any) {
    d3.select('svg g').attr('transform', e.transform);
  }

  private createSvg(): void {
    let zoom:any = d3.zoom()
    .on('zoom', this.handleZoom)
    .scaleExtent([1, 5])
    .translateExtent([[0, 0], [this.width, this.height]]);

    this.svg = d3.select("figure#scatter")
      .append("svg")
      .attr("width", this.width + (this.margin * 2))
      .attr("height", this.height + (this.margin * 2))
      .style("border", '1px solid black')
      .style('display', 'block')
      .style('margin', 'auto')
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")")
      .attr("class", "ImgSvg")
      .call(zoom);

    this.svg
      .append("image")
      .attr('xlink:href','https://i.imgur.com/cTl8Y6e.png')
      .attr('height', this.height)
      .attr('width', this.width)
      .attr('preserveAspectRatio', 'none');
  }

  private drawPlot(): number {
    // create a tooltip
    var tooltip = d3.select("#scatter")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-this.width", "0.5px")
      .style("border-radius", "5px")
      .style("padding", "5px");

    console.log(this.showEventCases)
    if(this.chosenGraphService.getGraph() == "heatmap")
    {
      let result = this.plotter.heatmap(tooltip, this.heatmap);
      this.scaleLimit = result[0];
      this.mostShots = result[1];
    }
    else if(this.chosenGraphService.getGraph() == "customized-heatmap")
    {
      let result = this.plotter.customHeatmap(tooltip, this.graphArray);
      this.scaleLimit = result[0];
      this.mostShots = result[1];
    }
    else if(this.chosenGraphService.getGraph() == "scatter")
      this.plotter.scatter(tooltip, this.graphArray, false, this.mostShots, this.showEventCases);
    else if(this.chosenGraphService.getGraph() == "grouped-scatter")
      this.plotter.scatter(tooltip, this.graphArray, true, this.mostShots, this.showEventCases);
    
    return this.scaleLimit;
  }
}
