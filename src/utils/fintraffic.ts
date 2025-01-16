import {useToast} from '@/components/ui/toast';
// Stores
import {useFintrafficStore} from '../stores/fintraffic.store.ts';
import {Operator, Station, TrafficRestriction, Train} from "@/utils/fintraffic.types.ts";

const { toast } = useToast();
const fintrafficStore = useFintrafficStore();
let removedTrainNumbers: number[] = [];

// API Endpoints
const trainLocationsLatestUrl = 'https://rata.digitraffic.fi/api/v1/train-locations/latest/';
const trainDataUrl = "https://rata.digitraffic.fi/api/v1/trains/latest/";
const trainCompositionUrl = "https://rata.digitraffic.fi/api/v1/compositions/";
const stationDataUrl = "https://rata.digitraffic.fi/api/v1/metadata/stations";
const operatorDataUrl = "https://rata.digitraffic.fi/api/v1/metadata/operators";
const trafficRestrictionsUrl = "https://rata.digitraffic.fi/api/v1/trackwork-notifications.json?state=ACTIVE";

export async function getTrainPositions(): Promise<Train[] | undefined> {
    console.log("Requesting new position data from fintraffic api");
    // Get now
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Set last updated fintraffic
    fintrafficStore.setLastUpdatedTrains(`${hours}:${minutes}:${seconds}`);

    // Do api stuff
    const response = await fetch(trainLocationsLatestUrl, {
        method: 'GET',
        headers: {
            'Digitraffic-User': 'Evolinox/Railtrack'
        }
    });
    if (response.ok) {
        const trains = await response.json();
        for (const train of trains) {
            if (!removedTrainNumbers.includes(train.trainNumber)) {
                // Update specific Train
                // If update returns false, then this is a new Train and will be added
                if (!fintrafficStore.updateTrain(train.trainNumber, [train.location.coordinates[1], train.location.coordinates[0]], train.speed)) {
                    const trainEntry = await getTrainData(train);
                    if (trainEntry) {
                        await fintrafficStore.addTrain(trainEntry);
                    }
                }
            }
        }
        // Remove old trains that are not in the current trains list
        const currentTrainNumbers = new Set(trains.map((train: Train) => train.trainNumber));
        fintrafficStore.getTrains
            .filter((storedTrain: Train) => !currentTrainNumbers.has(storedTrain.trainNumber))
            .forEach((oldTrain: Train) => fintrafficStore.removeTrain(oldTrain.trainNumber));
        return fintrafficStore.getTrains;
    } else {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was an error. Code: ' + response.status,
        });
    }
}

export function removeTrain(trainNumber: number) {
    removedTrainNumbers.push(trainNumber);
    fintrafficStore.removeTrain(trainNumber);
}

export async function initializeMetadata() {
    if (fintrafficStore.getStations.length < 1) {
        const response = await fetch(stationDataUrl, {
            method: 'GET',
            headers: {
                'Digitraffic-User': 'Evolinox/Railtrack'
            }
        });
        let stationData;
        if (!response.ok) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was an error fetching data for stations in finland.  Code: ' + response.status,
            });
        } else {
            stationData = await response.json();
            for (const station of stationData) {
                const stationEntry: Station = {
                    stationCode: station.stationShortCode,
                    stationName: station.stationName,
                    location: [station.latitude, station.longitude],
                };
                fintrafficStore.addStation(stationEntry);
            }
        }
    } else {
        console.log("Stations already initialized");
    }
    if (fintrafficStore.getOperators.length < 1) {
        const response = await fetch(operatorDataUrl, {
            method: 'GET',
            headers: {
                'Digitraffic-User': 'Evolinox/Railtrack'
            }
        });
        let operatorData;
        if (!response.ok) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was an error fetching data for operators in finland.  Code: ' + response.status,
            });
        } else {
            operatorData = await response.json();
            for (const operator of operatorData) {
                const operatorEntry: Operator = {
                    id: operator.id,
                    operatorName: operator.operatorName,
                    operatorShortCode: operator.operatorShortCode,
                    operatorUICCode: operator.operatorUICCode,
                };
                fintrafficStore.addOperator(operatorEntry);
            }
        }
    } else {
        console.log("Operators already initialized");
    }
}

export async function updateTrafficRestrictions(): Promise<TrafficRestriction[]> {
    const response = await fetch(trafficRestrictionsUrl, {
        method: 'GET',
        headers: {
            'Digitraffic-User': 'Evolinox/Railtrack'
        }
    });
    if (response.ok) {
        const trafficRestrictions = await response.json();
        for (const restriction of trafficRestrictions) {
            const entry: TrafficRestriction = {
                id: restriction.id,
                state: restriction.state,
                location: [restriction.location[1], restriction.location[0]],
                organization: restriction.organization,
                parts: [0, "", {location: [0, 0], type: ""}]
            }
            fintrafficStore.addTrafficRestriction(entry);
        }
    } else {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was an error. Code: ' + response.status,
        });
    }
    return fintrafficStore.getTrafficRestrictions;
}

async function getTrainData(trainEntry: any): Promise<Train | undefined> {
    const response = await fetch(trainDataUrl + trainEntry.trainNumber, {
        method: 'GET',
        headers: {
            'Digitraffic-User': 'Evolinox/Railtrack'
        }
    });
    let trainData;
    if (!response.ok) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was an error fetching data for Train No.: ' + trainEntry.trainNumber + '. Code: ' + response.status,
        });
    } else {
        trainData = await response.json();
    }
    if (trainData.length > 0) {
        // Get all Service Facilities
        let stops = [];
        for (let i = 0; i <= trainData[0].timeTableRows.length; i = i + 2) {
            if (i == 0) {
                stops.push({
                    stationType: "Start",
                    arrivalTime: "Departure",
                    departureTime: formatTime(trainData[0].timeTableRows[i].scheduledTime),
                    stationName: fintrafficStore.getStationName(trainData[0].timeTableRows[i].stationShortCode),
                    stationCode: trainData[0].timeTableRows[i].stationShortCode
                })
            } else if (i == trainData[0].timeTableRows.length) {
                stops.push({
                    stationType: "End",
                    arrivalTime: formatTime(trainData[0].timeTableRows[i-1].scheduledTime),
                    departureTime: "Arrival",
                    stationName: fintrafficStore.getStationName(trainData[0].timeTableRows[i-1].stationShortCode),
                    stationCode: trainData[0].timeTableRows[i-1].stationShortCode
                })
            } else {
                stops.push({
                    stationType: "Stop",
                    arrivalTime: formatTime(trainData[0].timeTableRows[i-1].scheduledTime),
                    departureTime: formatTime(trainData[0].timeTableRows[i].scheduledTime),
                    stationName: fintrafficStore.getStationName(trainData[0].timeTableRows[i].stationShortCode),
                    stationCode: trainData[0].timeTableRows[i].stationShortCode
                })
            }
        }
        // Get Composition of Train
        const composition = await getTrainComposition(trainEntry.trainNumber);

        // Calculate Journey Time
        const start: Date = new Date(trainData[0].timeTableRows[0].scheduledTime);
        const end: Date = new Date(trainData[0].timeTableRows[trainData[0].timeTableRows.length - 1].scheduledTime);

        const differenceInMilliseconds = end.getTime() - start.getTime();

        const totalMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const formattedTimeDifference = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Train
        return {
            arrivalTimeEnd: trainData[0].timeTableRows[trainData[0].timeTableRows.length - 1].scheduledTime,
            commuterLine: trainData[0].commuterLineID,
            composition: composition.vehicles,
            length: composition.length,
            endStop: fintrafficStore.getStationName(trainData[0].timeTableRows[trainData[0].timeTableRows.length - 1].stationShortCode),
            location: [trainEntry.location.coordinates[1], trainEntry.location.coordinates[0]],
            nextStop: "",
            operatorCode: trainData[0].operatorShortCode,
            operatorName: fintrafficStore.getOperatorName(trainData[0].operatorShortCode),
            speed: trainEntry.speed,
            maxSpeed: composition.maxSpeed,
            journeyTime: formattedTimeDifference,
            trainCategory: trainData[0].trainCategory,
            trainNumber: trainEntry.trainNumber,
            trainType: trainData[0].trainType,
            stops: stops,
        };
    } else {
        console.log("Train data for " + trainEntry.trainNumber + " is empty");
    }
}

async function getTrainComposition(trainNumber: number): Promise<any> {
    const response = await fetch(trainCompositionUrl + "2025-01-16/" + trainNumber, {
        method: 'GET',
        headers: {
            'Digitraffic-User': 'Evolinox/Railtrack'
        }
    });
    let trainComposition;
    if (!response.ok) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was an error fetching composition data for Train No.: ' + trainNumber + '. Code: ' + response.status,
        });
    } else {
        trainComposition = await response.json();
    }
    if (trainComposition.trainNumber != undefined) {
        console.log(trainComposition);
        return { 
            vehicles: [{ vehicleNumber: 0, vehicleName: "" }],
            maxSpeed: trainComposition.journeySections[0].maximumSpeed,
            length: trainComposition.journeySections[0].totalLength
        };
    } else {
        return { 
            vehicles: [{ vehicleNumber: 0, vehicleName: "" }],
            maxSpeed: "n/a",
            length: "n/a"
        };
    }
}

function formatTime(input: string) {
    const time = new Date(input);
    return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  }