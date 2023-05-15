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