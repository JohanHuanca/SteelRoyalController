import { ServoResource } from "./ServoResource";

export interface UpdatePositionRequest{
    id: number, 
    time:number,
    angles: ServoResource[],
}
  