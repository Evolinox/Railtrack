<script setup lang="ts">
import { Button } from '@/components/ui/button'

function clearLocalStorage() {
  localStorage.clear()
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