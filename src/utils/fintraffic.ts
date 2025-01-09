import { useToast } from '@/components/ui/toast';
// Stores
import { useFintrafficStore } from '../stores/fintraffic.store.ts';
import {Operator, Station, Train} from "@/utils/fintraffic.types.ts";

const { toast } = useToast();
const fintrafficStore = useFintrafficStore();

// API Endpoints
const trainLocationsLatestUrl = 'https://rata.digitraffic.fi/api/v1/train-locations/latest/';
const stationDataUrl = "https://rata.digitraffic.fi/api/v1/metadata/stations";
const operatorDataUrl = "https://rata.digitraffic.fi/api/v1/metadata/operators";

export async function getTrainPositions(): Promise<Train[] | undefined> {
    console.log("Requesting new position data from fintraffic api");
    const response = await fetch(trainLocationsLatestUrl, {
        method: 'GET',
        headers: {
            'Digitraffic-User': 'Evolinox/Railtrack'
        }
    });
    if (response.ok) {
        const trains = await response.json();
        for (const train of trains) {
            // Update specific Train
            // If update returns false, then this is a new Train and will be added
            if (!fintrafficStore.updateTrain(train.trainNumber, [train.location.coordinates[1], train.location.coordinates[0]], train.speed)) {
                await fintrafficStore.addTrain(train);
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