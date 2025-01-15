<script setup lang="ts">
defineProps({id: String});
</script>

<template>
  <div class="border-t px-4 pb-4">
  </div>
  <div>
    <h1>Train Details</h1>
    <p>Train Number: {{ id }}</p>
  </div>
</template>

<style scoped>

</style>