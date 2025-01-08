import { useToast } from '@/components/ui/toast';
// Stores
import { useFintrafficStore } from '../stores/fintraffic.store.ts';

const { toast } = useToast();
const fintrafficStore = useFintrafficStore();

// API Endpoints
const trainLocationsLatestUrl = 'https://rata.digitraffic.fi/api/v1/train-locations/latest/';

// Returns a json with all important informations about a train in finland
export async function getTrainPositions() {
    // check store
    if (fintrafficStore.trains.length === 0) {
        // fetch new data
        console.log("Requesting new data from fintraffic api")
        try {
            const response = await fetch(trainLocationsLatestUrl);
            if (response.ok) {
                const trains = await response.json();
                for (const train of trains) {
                    fintrafficStore.addTrain(train);
                }
                return fintrafficStore.getTrains;
            } else {
                // something not ok
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was an error. Code',
            });
        }
    } else {
        // use already present data
        console.log("Using stored data from fintraffic api")
        return fintrafficStore.getTrains;
    }
}