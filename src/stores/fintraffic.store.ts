import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { Train, Station } from "@/utils/fintraffic.types.ts";
import { toRaw } from "vue";
import { useToast } from "@/components/ui/toast";

const { toast } = useToast();

export const useFintrafficStore = defineStore('fintraffic', {
    state: () => ({
        trains: useLocalStorage<Train[]>('trains', []),
        stations: useLocalStorage<Station[]>('stations', []),
    }),

    getters: {
        getTrains: (state) => toRaw(state.trains),
        getStations: (state) => toRaw(state.stations),
    },

    actions: {
        addStation(stationEntry: Station) {
            this.stations.push(stationEntry);
        },
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
                endStop: this.getStationName(trainData[0].timeTableRows[trainData[0].timeTableRows.length - 1].stationShortCode),
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
            console.log("Removing train with number: " + trainNumber);
            this.trains = this.trains.filter(train => train.trainNumber !== trainNumber);
            console.log(this.getTrains);
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
        },
        getStationName(stationCode: string): string {
            const station = this.stations.find(station => station.stationCode === stationCode);
            if (station != undefined) {
                return station.stationName;
            } else {
                return stationCode;
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
            return operatorCode;
    }
}
