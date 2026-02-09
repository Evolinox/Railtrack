export interface Train {
    id: number;
    trainName: string;
    trainOperator: string;
    trainOperatorCode: string;
    trainCategory: string;
    countryCode: string;
    commuterLine: string;
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: Date;
    dataSource: string;

    departureStation: Station;
    destinationStation: Station;

    departureScheduledTime: Date;
    departureActualTime: Date;
    destinationScheduledTime: Date;
    destinationActualTime: Date;

    stops: [TrainStop];
}

export interface Station {
    id: number;
    stationCode: string;
    stationName: string;
    latitude: number;
    longitude: number;
}

export interface TrainStop {
    id: number;
    type: string;
    commercialStop: boolean;
    trainStopping: boolean;
    cancelled: boolean;
    scheduledTime: Date;
    actualTime: Date;
    differenceInMinutes: number;
    commercialTrack: string;
    stopOrder: number;

    station: Station;
}

export interface TrafficRestriction {
    id: number;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
}