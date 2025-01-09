<script setup lang="ts">
import * as leaflet from 'leaflet';
import {onMounted, onUnmounted} from 'vue';
import {useColorMode} from "@vueuse/core";

import { getTrainPositions, removeTrain } from '@/utils/fintraffic.ts';
import {Train} from "@/utils/fintraffic.types.ts";

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

  // Initialize markers by calling all functions
  // fintraffic/digitraffic
  const fintrafficMarkers = new Map();
  await refreshFintrafficMarker(map, fintrafficMarkers);

  // Intervals for live tracking
  const fintrafficMarkerRefresh = setInterval(async () => {
    await refreshFintrafficMarker(map, fintrafficMarkers);
  }, 5000);

  // Clear all intervals on unmount
  onUnmounted(() => {
    clearInterval(fintrafficMarkerRefresh);
  })
});

async function refreshFintrafficMarker(map: leaflet.Map, fintrafficMarkers: Map<any, any>) {    // refresh positions
  console.log('refreshing positions');

  const trainLocations: Train[] | undefined = await getTrainPositions();
  if (!trainLocations) {
    return;
  } else {
    for (const train of trainLocations) {
      const operatorImgUrl = new URL(`../assets/operators/${train.operatorCode}.png`, import.meta.url).href;
      const genericImgUrl = new URL('../assets/operators/generic.png', import.meta.url).href;
      const validatedImgUrl = await validateImage(operatorImgUrl, genericImgUrl);

      const trainIcon = leaflet.icon({
        iconUrl: validatedImgUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        className: 'operator-train-icon'
      });

      if (fintrafficMarkers.has(train.trainNumber)) {
        // If Marker for Train already exists, update position
        const trainMarker = fintrafficMarkers.get(train.trainNumber);
        trainMarker.setLatLng(train.location);
        trainMarker.bindPopup(`<b>${train.operatorName} - ${train.trainType} ${train.trainNumber}</b><br>Type: ${train.trainCategory}<br>Speed: ${train.speed} km/h`);
      } else {
        // If Marker does not exist, create it
        const trainMarker = leaflet.marker(train.location, {icon: trainIcon}).addTo(map);
        trainMarker.bindPopup(`<b>${train.operatorName} - ${train.trainType} ${train.trainNumber}</b><br>Type: ${train.trainCategory}<br>Speed: ${train.speed} km/h`);
        fintrafficMarkers.set(train.trainNumber, trainMarker);
      }
    }
    // Remove old markers
    const updatedTrainNumbers = new Set(trainLocations.map((train) => train.trainNumber));
    const markersToRemove = Array.from(fintrafficMarkers.keys()).filter((trainNumber) => !updatedTrainNumbers.has(trainNumber));
    for (const trainNumber of markersToRemove) {
      const marker = fintrafficMarkers.get(trainNumber);
      map.removeLayer(marker);
      fintrafficMarkers.delete(trainNumber);
      removeTrain(trainNumber);
    }
  }
}
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