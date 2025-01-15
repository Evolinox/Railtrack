<script setup lang="ts">
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";

defineProps({id: String});

</script>

<template>
  <ScrollArea class="border rounded-md h-[150px] mr-2 whitespace-nowrap">
    <div class="flex p-4 space-x-4 w-max">
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</template>

<style scoped>

</style>