import { LogLevel, Regions, Token } from "bmw-connected-drive";
import { Geofence } from "./Geofence";

export class Configuration {
    username: string = "";
    password: string = "";
    region: Regions = Regions.RestOfWorld;
    geofences: Geofence[] = [];
    logEnabled: boolean = false;
    logLevel: LogLevel = LogLevel.Warning;
    logRequestCount: number = 20;
    token?: Token;
}