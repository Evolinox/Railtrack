<script setup lang="ts">
import * as leaflet from 'leaflet';
import {onMounted, onUnmounted, ref, watch} from 'vue';
import {useColorMode} from "@vueuse/core";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

import { getTrainPositions, removeTrain, initializeMetadata, updateTrafficRestrictions } from '@/utils/fintraffic.ts';
import {Train} from "@/utils/fintraffic.types.ts";

const colorMode = useColorMode();
//const { coords } = useGeolocation();
const isDark = colorMode.value === 'dark';
const mapType = ref('standard')
const showDisruption = ref(false);
const disruptionMarkers: leaflet.Marker[] = [];
let map: leaflet.Map;
let orwTileLayer: leaflet.Layer
const tileTypes = {
  standard: "http://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
  signals: "http://tiles.openrailwaymap.org/signals/{z}/{x}/{y}.png",
  maxspeed: "http://tiles.openrailwaymap.org/maxspeed/{z}/{x}/{y}.png",
};

const validateImage = (url: string, placeholder: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(placeholder);
    img.src = url;
  });
};

onMounted(async () => {
  map = leaflet.map("map", {
    center: [60.199, 24.935],
    zoom: 12,
    inertia: true,
    zoomAnimation: true,
    zoomControl: false,
    attributionControl: false,
  });
  leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: 'map-tiles'
      }).addTo(map);

  orwTileLayer = leaflet.tileLayer(tileTypes.standard,
      {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
          minZoom: 2,
          maxZoom: 19,
          tileSize: 256
      }).addTo(map);
  // Initialize markers by calling all functions
  // fintraffic/digitraffic
  const fintrafficMarkers = new Map();
  await initializeMetadata();
  await refreshFintrafficMarker(map, fintrafficMarkers);

  // Intervals for live tracking
  const fintrafficMarkerRefresh = setInterval(async () => {
    await refreshFintrafficMarker(map, fintrafficMarkers);
  }, 5000);

  // Clear all intervals on unmount
  onUnmounted(() => {
    clearInterval(fintrafficMarkerRefresh);
  })
  /* Try fetch the current location
  map.setView([coords.value.latitude, coords.value.longitude], 12);
  const userIcon = leaflet.icon({
    iconUrl: new URL(`../assets/user.webp`, import.meta.url).href,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
  const userMarker = leaflet.marker([coords.value.latitude, coords.value.longitude], {icon: userIcon}).addTo(map);
  userMarker.bindPopup(`<b>You</b><br>Located: ${locatedAt.value}<br>Lat: ${coords.value.latitude}<br>Lon: ${coords.value.longitude}`);
  */
});

/*
watch(() => coords.value, async() => {
  console.log('Location changed');
  console.log(coords.value);
  map.setView([coords.value.latitude, coords.value.longitude], 12);
})
*/

// Watch mapType and handle a change event
watch(mapType, async (type, newType) => {
  console.log('mapType changed from', type, 'to', newType);
  switch (type) {
    case 'standard':
      map.removeLayer(orwTileLayer);
      orwTileLayer = leaflet.tileLayer(tileTypes.standard,
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
            minZoom: 2,
            maxZoom: 19,
            tileSize: 256
          }).addTo(map);
      break;
    case 'signals':
      map.removeLayer(orwTileLayer);
      orwTileLayer = leaflet.tileLayer(tileTypes.signals,
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
            minZoom: 2,
            maxZoom: 19,
            tileSize: 256
          }).addTo(map);
      break;
    case 'maxspeed':
      map.removeLayer(orwTileLayer);
      orwTileLayer = leaflet.tileLayer(tileTypes.maxspeed,
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
            minZoom: 2,
            maxZoom: 19,
            tileSize: 256
          }).addTo(map);
      break;
  }
})

// Watch showDisruption and handle a change event
watch(showDisruption, async (show, isShown) => {
  console.log('showDisruption changed from', isShown, 'to', show);
  // New state
  if (show) {
    // Create Marker Icon
    const restIcon = leaflet.icon({
      iconUrl: new URL(`../assets/restriction.webp`, import.meta.url).href,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
    // Get Traffic Restrictions
    const trafficRestrictions = await updateTrafficRestrictions();
    // Create Markers and add them to the Map
    for (const restriction of trafficRestrictions) {
      const restMarker = leaflet.marker(restriction.location, {icon: restIcon}).addTo(map);
      restMarker.bindPopup(`<b>Traffic Restriction</b><br>Organization: ${restriction.organization}<br>Starting: DD.MM.YY`);
      disruptionMarkers.push(restMarker);
    }
  } else {
    // Delete all Markers
    for (const marker of disruptionMarkers) {
      map.removeLayer(marker);
    }
  }
});

async function refreshFintrafficMarker(map: leaflet.Map, fintrafficMarkers: Map<any, any>) {    // refresh positions
  console.log('refreshing positions');

  const trainLocations: Train[] | undefined = await getTrainPositions();
  if (!trainLocations) {
    return;
  } else {
    for (const train of trainLocations) {
      const time = new Date(train.arrivalTimeEnd);
      const arrivalTime = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')} (${time.getTimezoneOffset()})`;

      if (fintrafficMarkers.has(train.trainNumber)) {
        // If Marker for Train already exists, update position
        const trainMarker = fintrafficMarkers.get(train.trainNumber);
        trainMarker.setLatLng(train.location);
        trainMarker.bindPopup(`<b>${train.operatorName} - ${train.trainType} ${train.trainNumber}</b><br>Towards: ${train.endStop}<br>Arriving: ${arrivalTime}<br>Type: ${train.trainCategory}<br>Speed: ${train.speed} km/h`);
      } else {
        // If Marker does not exist, create it
        const operatorImgUrl = new URL(`../assets/finland/operators/${train.operatorCode}.webp`, import.meta.url).href;
        const hslImgUrl = new URL(`../assets/finland/commuters/${train.commuterLine}.webp`, import.meta.url).href;
        const genericImgUrl = new URL('../assets/generic.webp', import.meta.url).href;
        const genericHslImgUrl = new URL('../assets/finland/commuters/unknown.webp', import.meta.url).href;
        const validatedImgUrl = await validateImage(operatorImgUrl, genericImgUrl);
        const validatedHslImgUrl = await validateImage(hslImgUrl, genericHslImgUrl);

        let trainIcon;

        if (train.commuterLine != "") {
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
        const trainMarker = leaflet.marker(train.location, {icon: trainIcon}).addTo(map);
        trainMarker.bindPopup(`<b>${train.operatorName} - ${train.trainType} ${train.trainNumber}</b><br>Towards: ${train.endStop}<br>Arriving: ${arrivalTime}<br>Type: ${train.trainCategory}<br>Speed: ${train.speed} km/h`);
        fintrafficMarkers.set(train.trainNumber, trainMarker);
      }
      // Remove trains, that have arrived at the endstation after 2 min
      const now = new Date();
      const target = new Date(train.arrivalTimeEnd);
      // Add 2 minutes buffer
      const minuteBuffer = 2;
      target.setTime(target.getTime() + minuteBuffer * 60 * 1000);
      if (now > target) {
        const marker = fintrafficMarkers.get(train.trainNumber);
        map.removeLayer(marker);
        fintrafficMarkers.delete(train.trainNumber);
        removeTrain(train.trainNumber);
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
  <ContextMenu>
    <ContextMenuTrigger class="h-full pb-2">
      <div id="map" v-bind:class="(isDark)?'dark':''" class="border h-full mr-2 mb-2 z-0"></div>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuRadioGroup v-model="mapType">
        <ContextMenuLabel>
          Map Type
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuRadioItem value="standard">
          Standard
        </ContextMenuRadioItem>
        <ContextMenuRadioItem value="signals">
          Signalling
        </ContextMenuRadioItem>
        <ContextMenuRadioItem value="maxspeed">
          Speed
        </ContextMenuRadioItem>
      </ContextMenuRadioGroup>
      <ContextMenuLabel>
        Map Options
      </ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuCheckboxItem v-model:checked="showDisruption">Show Disruptions</ContextMenuCheckboxItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<style>
#map {
  border-radius: 7px;
}

.operator-train-icon {
  border-radius: 50%;
}

.dark .map-tiles {
  filter: invert(100%) hue-rotate(180deg) brightness(1) contrast(70%);
}

.leaflet-container {
  @apply bg-sidebar-accent;
}
.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
  @apply bg-background text-foreground;
}
</style>