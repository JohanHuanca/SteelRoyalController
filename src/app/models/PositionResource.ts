import { ServoResource } from "./ServoResource";

export interface PositionResource{
    id: number, 
    time:number,
    angles: ServoResource[],
    movement_id: number
}
  