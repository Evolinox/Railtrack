import { useToast } from '@/components/ui/toast';
// Stores
import { useFintrafficStore } from '../stores/fintraffic.store.ts';
import {Train} from "@/utils/fintraffic.types.ts";

const { toast } = useToast();
const fintrafficStore = useFintrafficStore();

// API Endpoints
const trainLocationsLatestUrl = 'https://rata.digitraffic.fi/api/v1/train-locations/latest/';


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