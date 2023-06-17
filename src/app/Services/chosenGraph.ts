export class ChosenGraphService {
  private _graph: string;
  private _homeTeam: string;
  private _awayTeam: string;
  private _mostCases: number;
  constructor() {}

  public setGraph(graph: string) {
    this._graph = graph;
  }

  public getGraph(){
    return this._graph;
  }

  public setHomeTeam(homeTeam: string) {
    this._homeTeam = homeTeam;
  }

  public getHomeTeam(){
    return this._homeTeam;
  }

  public setAwayTeam(awayTeam: string) {
    this._awayTeam = awayTeam;
  }

  public getAwayTeam(){
    return this._awayTeam;
  }

  
  public setMostCases(mostCases: number) {
    this._mostCases = mostCases;
  }

  public getMostCases(){
    return this._mostCases;
  }
}