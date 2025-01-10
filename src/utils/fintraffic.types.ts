export interface Train {
    trainNumber: number;
    trainType: string;
    trainCategory: string;
    commuterLine: string;
    operatorName: string;
    operatorCode: string;
    speed: number;
    location: [number, number];
    nextStop: string;
    endStop: string;
    arrivalTimeEnd: Date;
}

export interface Station {
    stationCode: string;
    stationName: string;
    location: [number, number];
}

export interface Operator {
    id: number;
    operatorShortCode: string;
    operatorUICCode: string;
    operatorName: string;
}
