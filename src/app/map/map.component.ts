import { Component, OnInit } from '@angular/core';
import { ApiEvent } from '../Services/interfaces';
import { GraphPlotter } from "../Services/graphPlotter";
import { environment } from "src/environments/environment";
import { HeatmapSquare } from "../Services/classes";

import * as d3 from "d3";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  chosenGraph: string = "";
  scaleLimit: number = 0;
  mostShots: number = 0;

  width = environment.mapWidth;
  height = environment.mapHeight;
  margin = environment.mapMargin;

  heatmap : Array<Array<HeatmapSquare>>;
  graphArray: ApiEvent[] = [];
  handledGraphArray: ApiEvent[] = [];

  plotter = new GraphPlotter();
  svg: any;

  constructor() { }

  ngOnInit(): void {
    this.createSvg();
  }

  public RenderGraph(graphArray: Array<ApiEvent>, heatmap: Array<Array<HeatmapSquare>>, handledGraphArray: Array<ApiEvent>, chosenGraph: string){
    this.graphArray = graphArray;
    this.heatmap = heatmap;
    this.chosenGraph = chosenGraph;
    this.handledGraphArray = handledGraphArray;
    this.drawPlot();
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

  private drawPlot(): void {
    // create a tooltip
    console.log(this.chosenGraph)
    var tooltip = d3.select("#scatter")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-this.width", "0.5px")
      .style("border-radius", "5px")
      .style("padding", "5px");

    if(this.chosenGraph == "heatmap")
    {
      let result = this.plotter.heatmap(tooltip, this.heatmap);
      this.scaleLimit = result[0];
      this.mostShots = result[1];
    }
    else if(this.chosenGraph == "costumized-heatmap")
    {
      let result = this.plotter.customHeatmap(tooltip, this.graphArray);
      this.scaleLimit = result[0];
      this.mostShots = result[1];
    }
    else if(this.chosenGraph == "scatter")
      this.plotter.scatter(tooltip, this.graphArray, false);
    else if(this.chosenGraph == "grouped-scatter")
      this.plotter.scatter(tooltip, this.handledGraphArray, true);
  }
}
