<script setup lang="ts">
import {ScrollArea, ScrollBar} from "@/components/ui/scroll-area";
import {Label} from "@/components/ui/label";
import {onMounted, ref} from "vue";
import {useFintrafficStore} from '../stores/fintraffic.store.ts';
import {Train} from "@/utils/fintraffic.types.ts";
// Icons from lucide
import { CircleAlert } from 'lucide-vue-next';

const props = defineProps({id: String});
const fintrafficStore = useFintrafficStore();
let train: Train | undefined = fintrafficStore.getTrainByNumber(Number(props.id));
const hasComposition = ref(!train?.composition == undefined);

onMounted(() => {
  console.log("Showing status for Train " + props.id);
})
</script>

<template>
  <div class="border rounded-md h-[150px] mr-2">
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
  <div>
    <Label>{{ train?.trainType }} {{ train?.trainNumber }} to {{ train?.endStop }}</Label>
  </div>
</template>

<style scoped>

</style>