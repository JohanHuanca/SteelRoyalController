import { ServoResource } from "./ServoResource";

export interface CreatePositionRequest{
    time:number,
    angles: ServoResource[],
    movement_id: number
}
  