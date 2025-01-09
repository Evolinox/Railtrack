import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { Train, Station, Operator } from "@/utils/fintraffic.types.ts";
import { toRaw } from "vue";
import { useToast } from "@/components/ui/toast";

const { toast } = useToast();

export const useFintrafficStore = defineStore('fintraffic', {
    state: () => ({
        trains: useLocalStorage<Train[]>('trains', []),
        stations: useLocalStorage<Station[]>('stations', []),
        operators: useLocalStorage<Operator[]>('operators', []),
    }),

    getters: {
        getTrains: (state) => toRaw(state.trains),
        getStations: (state) => toRaw(state.stations),
        getOperators: (state) => toRaw(state.operators),
    },

    actions: {
        addStation(stationEntry: Station) {
            this.stations.push(stationEntry);
        },
        addOperator(operatorEntry: Operator) {
            this.operators.push(operatorEntry);
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
                operatorName: this.getOperatorName(trainData[0].operatorShortCode),
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
        },
        getOperatorName(operatorCode: string): string {
            const operator = this.operators.find(operator => operator.operatorShortCode === operatorCode);
            if (operator != undefined) {
                return operator.operatorName;
            } else {
                return operatorCode;
            }
        }
    },
});
