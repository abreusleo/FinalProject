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

export class ApiEventClass{
    league_id: number
    league_name: string
    match_id: number
    event_id: number
    season: number
    code: string
    time: {
        quarter: {
            id: number
            clock: string
            elapsed_seconds: number
            remaining_seconds: number
        }
        elapsed_seconds: number
        date: string
    }
    score: {
        home: number
        away: number
    }
    player: {
        id: number
        name: string
        nickname: string
        number: number
    }
    team: {
        id: number
        name: string
        acronym: string
    }
    position: {
        x: number
        y: number
    }
    cases : number
    radius : number

    constructor(){
        this.position = new Position();
        this.team = new Team();
    }
}

export class Position{
    x: number
    y: number
}

export class Team {
    id: number
    name: string
    acronym: string
}