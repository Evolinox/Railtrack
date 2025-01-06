<script setup lang="ts">
import leaflet from 'leaflet';
import {onMounted, ref} from 'vue';
import {useColorMode} from "@vueuse/core";

const colorMode = useColorMode();
const isDark = true;

onMounted(() => {
  let map = leaflet.map("map", {
    center: [60.199, 24.935],
    zoom: 11,
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