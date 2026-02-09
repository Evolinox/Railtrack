import { useToast } from '@/components/ui/toast';
import { Train, TrafficRestriction } from "@/utils/railis.types.ts";

//shadcn-vue
const { toast } = useToast();
// railis
const bearerKey = "lalilu";
const trainLiveLocations = "http://localhost:3000/v1/traffic/trains/";
const trafficRestrictionsUrl = "http://localhost:3000/v1/traffic/disruptions/";

export async function getTrainPositions(): Promise<Train[] | undefined> {
    console.log("Requesting new position data from railis");
    // Do api stuff
    const response = await fetch(trainLiveLocations, {
        method: 'GET',
        headers: {
            'Railis-User': 'Railtrack/Tauri',
            'Authorization': `Bearer ${bearerKey}`,
        }
    });
    if (response.ok) {
        return await response.json();
    } else {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was an error. Code: ' + response.status,
        });
    }
}

export async function getTrafficRestrictions(): Promise<TrafficRestriction[] | undefined> {
    console.log("Requesting traffic restriction data from railis");
    // Do api stuff
    const response = await fetch(trafficRestrictionsUrl, {
        method: 'GET',
        headers: {
            'Railis-User': 'Railtrack/Tauri',
            'Authorization': `Bearer ${bearerKey}`,
        }
    });
    if (response.ok) {
        return await response.json();
    } else {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was an error. Code: ' + response.status,
        });
    }
}