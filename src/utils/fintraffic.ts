import { useToast } from '@/components/ui/toast';
// Stores
import { useFintrafficStore } from '../stores/fintraffic.store.ts';
import {Train} from "@/utils/fintraffic.types.ts";

const { toast } = useToast();
const fintrafficStore = useFintrafficStore();

// API Endpoints
const trainLocationsLatestUrl = 'https://rata.digitraffic.fi/api/v1/train-locations/latest/';

// Returns a json with all important informations about a train in finland
export async function getTrainPositions(): Promise<Train[] | undefined> {
    // check store
    if (fintrafficStore.trains.length === 0) {
        // fetch new data
        console.log("Requesting new data from fintraffic api")

        const response = await fetch(trainLocationsLatestUrl);
        if (response.ok) {
            const trains = await response.json();
            for (const train of trains) {
                await fintrafficStore.addTrain(train);
            }
            return fintrafficStore.getTrains;
        } else {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was an error. Code: ' + response.status,
            });
        }
    } else {
        // use already present data
        console.log("Using stored data from fintraffic api")
        return fintrafficStore.getTrains;
    }
}

export async function getUpdatedTrainPositions(): Promise<Train[] | undefined> {
    console.log("Requesting new position data from fintraffic api")
    const response = await fetch(trainLocationsLatestUrl);
    if (response.ok) {
        const trains = await response.json();
        for (const train of trains) {
            // Update specific Train
            // If update returns false, then this is a new Train and will be added
            if (!fintrafficStore.updateTrain(train.trainNumber, [train.location.coordinates[1], train.location.coordinates[0]], train.speed)) {
                await fintrafficStore.addTrain(train);
            }
        }
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