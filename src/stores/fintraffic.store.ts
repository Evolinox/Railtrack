import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import {Train, Station, Operator, TrafficRestriction} from "@/utils/fintraffic.types.ts";
import { toRaw } from "vue";

export const useFintrafficStore = defineStore('fintraffic', {
    state: () => ({
        trains: useLocalStorage<Train[]>('trains', []),
        lastUpdatedTrains: useLocalStorage<string>('lastUpdatedTrains', '12:00:00'),
        stations: useLocalStorage<Station[]>('stations', []),
        operators: useLocalStorage<Operator[]>('operators', []),
        trafficRestrictions: useLocalStorage<TrafficRestriction[]>('trafficRestrictions', []),
    }),

    getters: {
        getTrains: (state) => toRaw(state.trains),
        getStations: (state) => toRaw(state.stations),
        getOperators: (state) => toRaw(state.operators),
        getTrafficRestrictions: (state) => toRaw(state.trafficRestrictions),
        getLastUpdatedTrains(): string {
            return this.lastUpdatedTrains;
        },
    },

    actions: {
        setLastUpdatedTrains(date: string) {
            console.log("Setting last updated trains to: " + date);
            this.lastUpdatedTrains = date;
        },
        addStation(stationEntry: Station) {
            this.stations.push(stationEntry);
        },
        addOperator(operatorEntry: Operator) {
            this.operators.push(operatorEntry);
        },
        addTrafficRestriction(restrictionEntry: TrafficRestriction) {
            this.trafficRestrictions.push(restrictionEntry);
        },
        async addTrain(trainEntry: Train) {
            this.trains.push(trainEntry);
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
