import { Geofence } from "./Geofence";

export class LocationType {
    Latitude!: number;
    Longitude!: number;
    Address?: string;

    public equals(location : LocationType): boolean {
        if (this === location)
            return true;

        if (this instanceof Geofence && location instanceof Geofence)
            return this.Label === location.Label;
        return false;
    }
}