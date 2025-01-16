<script setup lang="ts">
import * as leaflet from 'leaflet';
import { Separator } from '@/components/ui/separator/index.ts';
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from '@/components/ui/card'
import {onMounted, ref} from "vue";
import {useColorMode} from "@vueuse/core";
import {useFintrafficStore} from '../stores/fintraffic.store.ts';
import {Train} from "@/utils/fintraffic.types.ts";
// Icons from lucide
import {CircleAlert} from 'lucide-vue-next';

const colorMode = useColorMode();
const isDark = colorMode.value === 'dark';
const props = defineProps({id: String});
const fintrafficStore = useFintrafficStore();
let train: Train | undefined = fintrafficStore.getTrainByNumber(Number(props.id));
const hasComposition = ref(!train?.composition == undefined);
const validateImage = (url: string, placeholder: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(placeholder);
    img.src = url;
  });
};

onMounted(async () => {
  console.log("Showing status for Train " + props.id);
  let map = leaflet.map("map", {
    center: train?.location,
    dragging: false,
    zoom: 10,
    inertia: true,
    zoomAnimation: true,
    zoomControl: false,
    attributionControl: false,
  });
  leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 10,
        maxZoom: 10,
        className: 'map-tiles'
      }).addTo(map);
  leaflet
      .tileLayer('http://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
            minZoom: 10,
            maxZoom: 10,
            tileSize: 256
          }).addTo(map);
  const operatorImgUrl = new URL(`../assets/finland/operators/${train?.operatorCode}.webp`, import.meta.url).href;
  const hslImgUrl = new URL(`../assets/finland/commuters/${train?.commuterLine}.webp`, import.meta.url).href;
  const genericImgUrl = new URL('../assets/generic.webp', import.meta.url).href;
  const genericHslImgUrl = new URL('../assets/finland/commuters/unknown.webp', import.meta.url).href;
  const validatedImgUrl = await validateImage(operatorImgUrl, genericImgUrl);
  const validatedHslImgUrl = await validateImage(hslImgUrl, genericHslImgUrl);

  let trainIcon;

  if (train?.commuterLine != "") {
    trainIcon = leaflet.icon({
      iconUrl: validatedHslImgUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: 'operator-train-icon'
    });
  } else {
    trainIcon = leaflet.icon({
      iconUrl: validatedImgUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: 'operator-train-icon'
    });
  }
  if (train?.location) {
    const trainMarker = leaflet.marker(train.location, { icon: trainIcon }).addTo(map);
    trainMarker.bindPopup(`<b>${train.trainType} ${train.trainNumber}</b>`);
  }
})
</script>

<template>
  <div class="statusContainer grid w-full h-full gap-2 pb-2 pr-2">
    <div class="compositionContainer border rounded-md h-full">
      <ScrollArea class="whitespace-nowrap" v-if="hasComposition">
        <div class="flex p-4 space-x-4 w-max">
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div class="flex flex-col text-center items-center justify-center py-12" v-if="!hasComposition">
        <CircleAlert class="text-red-500" />
        <span class="mt-2">No Composition found.</span>
      </div>
    </div>
    <div class="overviewContainer h-full w-full">
      <Card class="rounded-md h-full w-full">
        <CardHeader>
          <CardTitle>{{ train?.trainType }} {{ train?.trainNumber }} to {{ train?.endStop }}</CardTitle>
          <CardDescription>{{ train?.operatorName }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col">
          <span>Journey Duration: {{ train?.journeyTime }} hrs</span>
          <span>Allowed Speed: {{ train?.maxSpeed }} km/h</span>
          <span>Total Length: {{ train?.length }} m</span>
        </CardContent>
      </Card>
    </div>
    <div id="map" v-bind:class="(isDark)?'dark':''" class="mapContainer border h-full w-full mr-2 mb-2 z-0"></div>
    <div class="servicePointContainer h-full w-full">
      <Card class="rounded-md h-full w-full">
        <CardHeader>
          <CardTitle>Stations Facilities</CardTitle>
          <CardDescription>All Facilities along the Route of {{ train?.trainType }} {{ train?.trainNumber }}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea class="rounded-md h-[328px] w-full">
            <div class="p-0">
              <div v-for="(stop, index) in train?.stops" :key="stop.stationCode" class="items-center w-full">
                <Separator v-if="index > 0" class="my-2" />
                <div class="text-sm font-bold">
                  {{ stop.stationName }}
                </div>
                <div class="text-sm ml-auto">
                  <span v-if="stop.stationType=='Start'">Departing at {{ stop.departureTime }}</span>
                  <span v-if="stop.stationType=='Stop'">{{ stop.arrivalTime }} / {{ stop.departureTime }}</span>
                  <span v-if="stop.stationType=='End'">Arriving at {{ stop.arrivalTime }}</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style>
.statusContainer {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1.2fr 1.5fr;
}
.compositionContainer {
  grid-column: 1 / 3;
  grid-row: 1;
}
.overviewContainer {
  grid-column: 1;
  grid-row: 2;
}
.mapContainer {
  grid-column: 1;
  grid-row: 3;
}
.servicePointContainer {
  grid-column: 2;
  grid-row: 2 / 4;
}

@media (max-width: 768px) {
  .statusContainer {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2.2fr 0 0;
  }
  .compositionContainer {
    grid-column: 1;
    grid-row: 3;
  }
  .overviewContainer {
    grid-column: 1;
    grid-row: 1;
  }
  .mapContainer {
    grid-column: 1;
    grid-row: 4;
  }
  .servicePointContainer {
    grid-column: 1;
    grid-row: 2;
  }
}
</style>