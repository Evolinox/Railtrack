<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {useFintrafficStore} from '../stores/fintraffic.store.ts';

const fintrafficStore = useFintrafficStore();

function clearLocalStorage() {
  localStorage.clear();
  fintrafficStore.clearTrains();
}
</script>

<template>
  <div class="border-t px-4 pb-4">
  </div>
  <Button variant="destructive" @click="clearLocalStorage">
    Clear Local Storage
  </Button>
</template>

<style scoped>

</style>