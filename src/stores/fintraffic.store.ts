import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { Train } from "@/utils/fintraffic.types.ts";
import { toRaw } from "vue";
import { useToast } from "@/components/ui/toast";

const { toast } = useToast();

export const useFintrafficStore = defineStore('fintraffic', {
    state: () => ({
        trains: useLocalStorage<Train[]>('trains', []),
    }),

    getters: {
        getTrains: (state) => toRaw(state.trains),
    },

    actions: {
        async addTrain(trainEntry: any) {
            const trainDataUrl = "https://rata.digitraffic.fi/api/v1/trains/latest/" + trainEntry.trainNumber;
            const response = await fetch(trainDataUrl, {
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
            const train: Train = {
                commuterLine: trainData[0].commuterLineID,
                endStop: "",
                location: [trainEntry.location.coordinates[1], trainEntry.location.coordinates[0]],
                nextStop: "",
                operatorCode: trainData[0].operatorShortCode,
                operatorName: getOperatorName(trainData[0].operatorShortCode),
                speed: trainEntry.speed,
                trainCategory: trainData[0].trainCategory,
                trainNumber: trainEntry.trainNumber,
                trainType: trainData[0].trainType
            }
            this.trains.push(train);
        },
        removeTrain(trainNumber: number) {
            this.trains = this.trains.filter(train => train.trainNumber !== trainNumber);
        },
        clearTrains() {
            this.trains = [];
        },
        updateTrain(trainNumber: number, location: [number, number], speed: number) {
            const train = this.trains.find(train => train.trainNumber === trainNumber);
            if (train != undefined) {
                train.location = location;
                train.speed = speed;
                return true;
            } else {
                return false;
            }
        },
        getTrainByNumber(trainNumber: number): Train | undefined {
            const train = this.trains.find(train => train.trainNumber === trainNumber);
            if (train != undefined) {
                return train;
            }
        }
    },
});

function getOperatorName(operatorCode: string) {
    switch (operatorCode) {
        case 'vr':
            return 'VR-Yhtymä Oy';
        case 'operail':
            return 'North Rail Oy';
        case 'vr-track':
            return 'VR Track';
        case 'ferfi':
            return 'Fenniarail Oy'
        default:
            return 'Unknown Operator';
    }
}