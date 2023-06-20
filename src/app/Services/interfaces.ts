import { NumberValue } from "d3";

export interface ApiEventTypes{
    data: Array<EventType>;
}

export interface EventType{
    code: String,
    name: String
}

export interface ApiResponse{
    data: Array<ApiEvent>
}

export interface ApiMatchesResponse{
    data: Array<ApiMatch>
}

export interface PlayersResponse{
    home_team: any,
    away_team: any,
    home_players: Player[],
    away_players: Player[]
}

export interface Player{
    id: number,
    name: string,
    nickname: string,
    number: number,
    in_court: boolean,
    team: string
}

export interface ApiMatch{
    league_id: number,
    league_name: string,
    match_id: number,
    season: number,
    phase: string,
    home_team: {
        id: number,
        name: string,
        acronym: string
    },
    away_team: {
        id: number,
        name: string,
        acronym: string
    },
    name: string,
    score: {
        home: number,
        away: number
    },
    venue: string,
    has_video: number,
    date: string
}


export interface ApiEvent{
  league_id: number,
  league_name: string,
  match_id: number,
  event_id: number,
  season: number,
  code: string,
  time: {
      quarter: {
          id: number,
          clock: string,
          elapsed_seconds: number,
          remaining_seconds: number
      },
      elapsed_seconds: number,
      date: string
  },
  score: {
      home: number,
      away: number
  },
  player: {
      id: number,
      name: string,
      nickname: string,
      number: number
  },
  team: {
      id: number,
      name: string,
      acronym: string
  },
  position: {
      x: number,
      y: number
  },
  cases : number,
  radius : number
}