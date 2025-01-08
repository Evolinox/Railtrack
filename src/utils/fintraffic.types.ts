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
}
