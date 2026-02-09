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

import {getTrafficRestrictions, getTrainPositions} from "@/utils/railis.service.ts";
import {TrafficRestriction, Train} from "@/utils/railis.types.ts";

const colorMode = useColorMode();
//const { coords } = useGeolocation();
const isDark = colorMode.value === 'dark';
const mapType = ref('standard')
const showDisruption = ref(false);
const trainMarkers: Map<number, leaflet.Marker> = new Map();
const disruptionMarkers: Map<number, leaflet.Marker> = new Map();
let map: leaflet.Map;
let orwTileLayer: leaflet.Layer
const tileTypes = {
    standard: "https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
    signals: "https://tiles.openrailwaymap.org/signals/{z}/{x}/{y}.png",
    maxspeed: "https://tiles.openrailwaymap.org/maxspeed/{z}/{x}/{y}.png",
    electrification: "https://tiles.openrailwaymap.org/electrified/{z}/{x}/{y}.png",
    gauge: "https://tiles.openrailwaymap.org/gauge/{z}/{x}/{y}.png",
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

    // Intervals for live tracking
    const trainMarkerRefresh = setInterval(async () => {
        await refreshTrainMarker(map, trainMarkers);
    }, 5000);

    // Clear all intervals on unmount
    onUnmounted(() => {
        clearInterval(trainMarkerRefresh);
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
        case 'electrification':
            map.removeLayer(orwTileLayer);
            orwTileLayer = leaflet.tileLayer(tileTypes.electrification,
                {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
                    minZoom: 2,
                    maxZoom: 19,
                    tileSize: 256
                }).addTo(map);
            break;
        case 'gauge':
            map.removeLayer(orwTileLayer);
            orwTileLayer = leaflet.tileLayer(tileTypes.gauge,
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
        const trafficRestrictions: TrafficRestriction[] | undefined = await getTrafficRestrictions();
        if (!trafficRestrictions) {
            return;
        } else {
            const restrictionIcon = leaflet.icon({
                iconUrl: new URL(`../assets/restriction.webp`, import.meta.url).href,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -16],
            });
            for (const restriction of trafficRestrictions) {
                const marker = leaflet.marker(leaflet.latLng(restriction.latitude, restriction.longitude), {icon: restrictionIcon}).addTo(map);
                marker.bindPopup(`<b>${restriction.name}</b><br>${restriction.description}</br>`);
                disruptionMarkers.set(restriction.id, marker);
            }
        }
    } else {
        for (const markerKey of disruptionMarkers.keys()) {
            const marker = disruptionMarkers.get(markerKey);
            if (marker) {
                map.removeLayer(marker);
                disruptionMarkers.delete(markerKey);
            }
        }
    }
});

async function refreshTrainMarker(map: leaflet.Map, trainMarkers: Map<number, leaflet.Marker>) {
    console.log('refreshing positions');
    const trainLocations: Train[] | undefined = await getTrainPositions();
    if (!trainLocations) {
        return;
    } else {
        for (const train of trainLocations) {
            // If train is already on map, update it, else create new one
            if (trainMarkers.has(train.id)) {
                const marker = trainMarkers.get(train.id);
                if (marker) {
                    const location: leaflet.LatLng = leaflet.latLng(train.latitude, train.longitude);
                    marker.bindPopup(`<b>${train.trainName} - ${train.trainOperator}</b><br>Towards: ${train.destinationStation.stationName}<br>Arriving: ${train.destinationScheduledTime}<br>Type: ${train.trainCategory}<br>Speed: ${train.speed} km/h`);
                    marker.setLatLng(location);
                }
            } else {
                const operatorImgUrl = new URL(`../assets/finland/operators/${train.trainOperatorCode}.webp`, import.meta.url).href;
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
                const marker = leaflet.marker(leaflet.latLng(train.latitude, train.longitude), {icon: trainIcon}).addTo(map);
                marker.bindPopup(`<b>${train.trainName} - ${train.trainOperator}</b><br>Towards: ${train.destinationStation.stationName}<br>Arriving: ${train.destinationScheduledTime}<br>Type: ${train.trainCategory}<br>Speed: ${train.speed} km/h`);
                trainMarkers.set(train.id, marker);
            }
        }
        // Remove old markers
        const updatedTrainId = new Set(trainLocations.map((train) => train.id));
        const markersToRemove = Array.from(trainMarkers.keys()).filter((trainId) => !updatedTrainId.has(trainId));
        for (const trainId of markersToRemove) {
            const marker = trainMarkers.get(trainId);
            if (marker) {
                map.removeLayer(marker);
                trainMarkers.delete(trainId);
            }
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
                <ContextMenuSeparator/>
                <ContextMenuRadioItem value="standard">
                    Standard
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="signals">
                    Signalling
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="maxspeed">
                    Speed
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="electrification">
                    Electrification
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="gauge">
                    Gauge
                </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
            <ContextMenuLabel>
                Map Options
            </ContextMenuLabel>
            <ContextMenuSeparator/>
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