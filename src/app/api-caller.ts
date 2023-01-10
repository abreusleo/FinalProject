export class ApiCaller{
  public async callForMatchEvents(match: any, eventType: any, player: any){
    let link = ""
    if(eventType == undefined || eventType == "NONE"){
      link = `https://apibird.tecgraf.puc-rio.br/v1/events/1/${match}?has_position=true&page=1&limit=500`;
    }
    else{
      link = `https://apibird.tecgraf.puc-rio.br/v1/events/1/${match}?event_types=${eventType}&has_position=true&page=1&limit=500`;
    }
    if(player != undefined && !player.includes(-1)){
      link = link + `&players=${player}`;
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

  public async callForPlayersFromMatch(match: any){
    const response = await fetch(`https://apibird.tecgraf.puc-rio.br/v1/matches/1/${match}/players`,
    {
      method: 'GET',
      headers: {'accept' : 'application/json', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhcGlfdG9rZW46MSIsInNjb3BlcyI6ImNvcmUifQ.6AgyEAU-RQ8NBJwI3rZz9HCRdVTggE9tOCgSSxZlVio'},
    });
    return response;
  }
}