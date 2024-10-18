import { LocationType } from "./LocationType";

export class Geofence extends LocationType{
    Label: string;
    Radius: number = 20;

    constructor(label: string) {
        super();
        this.Label = label;
    }
}