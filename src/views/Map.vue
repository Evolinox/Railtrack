<script setup lang="ts">
import * as leaflet from 'leaflet';
import {onMounted} from 'vue';
import {useColorMode} from "@vueuse/core";

import { getTrainPositions } from '@/utils/fintraffic.ts';
import {Train} from "@/utils/fintraffic.types.ts";
import {useToast} from "@/components/ui/toast";

const { toast } = useToast();
const colorMode = useColorMode();
const isDark = colorMode.value === 'dark';

const validateImage = (url: string, placeholder: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(placeholder);
    img.src = url;
  });
};

onMounted(async () => {
  let map = leaflet.map("map", {
    center: [60.199, 24.935],
    zoom: 12,
    inertia: true,
    zoomAnimation: true,
  });
  leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: 'map-tiles'
      }).addTo(map);
  leaflet
      .tileLayer('http://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
            minZoom: 2,
            maxZoom: 19,
            tileSize: 256
          }).addTo(map);

  // Fintraffic
  const trainLocations: Train[] | undefined = await getTrainPositions();
  if (!trainLocations) {
    toast({
      variant: 'destructive',
      title: 'Uh oh! There are no finnish trains.',
      description: 'trainLocations is undefined.',
    });
  } else {
    for (const train of trainLocations) {
      const operatorImgUrl = new URL(`../assets/operators/${train.operatorCode}.png`, import.meta.url).href;
      const genericImgUrl = new URL('../assets/operators/generic.png', import.meta.url).href;
      const validatedImgUrl = await validateImage(operatorImgUrl, genericImgUrl);

      const trainIcon = leaflet.icon({
        iconUrl: validatedImgUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: 'operator-train-icon'
      });
      const trainMarker = leaflet.marker([train.location[0], train.location[1]], { icon: trainIcon } ).addTo(map);
      trainMarker.bindPopup(`<b>${train.operatorName} - ${train.trainType} ${train.trainNumber}</b><br>Type: ${train.trainCategory}<br>Geschwindigkeit: ${train.speed} km/h`);
    }
  }
});
</script>

<template>
  <div id="map" v-bind:class="(isDark)?'dark':''"></div>
</template>

<style>
#map {
  width: 100%;
  height: 100%;
  z-index: 0;
}

.operator-train-icon {
  border-radius: 50%;
}

.dark .leaflet-attribution-flag {
  filter: invert(100%) hue-rotate(180deg) brightness(1) contrast(100%) !important;
}

.dark .leaflet-control-zoom-in,
.dark .leaflet-control-zoom-out,
.dark .leaflet-control-attribution,
.dark .map-tiles {
  filter: invert(100%) hue-rotate(180deg) brightness(1) contrast(70%);
}
</style>