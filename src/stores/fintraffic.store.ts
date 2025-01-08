import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { Train } from "@/utils/fintraffic.types.ts";
import {toRaw} from "vue";

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
            const response = await fetch(trainDataUrl);
            let trainData

            if (!response.ok) {

            } else {
                trainData = await response.json();
            }
            const train: Train = {
                commuterLine: trainData[0].commuterLineID,
                endStop: "",
                location: [trainEntry.location.coordinates[1], trainEntry.location.coordinates[0]],
                nextStop: "",
                operatorCode: trainData[0].operatorShortCode,
                operatorName: "",
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
        getTrainByNumber(trainNumber: number): Train | undefined {
            const train = this.trains.find(train => train.trainNumber === trainNumber);
            if (train != undefined) {
                return train;
            }
        }
    },
});