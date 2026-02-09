<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { MagnifyingGlassIcon } from '@radix-icons/vue'
import {ref} from "vue";
import {refDebounced} from "@vueuse/core";
import {Button} from "@/components/ui/button";
import {useRouter} from "vue-router";

const router = useRouter();
const searchedTrainNumber = ref('')
const debouncedSearch = refDebounced(searchedTrainNumber, 250)

async function routeToTrainStatus() {
  await router.push("/train/" + debouncedSearch.value?.trim());
}
</script>

<template>
  <div class="border-t px-4 pb-4">
  </div>
  <div class="pr-4 pl-4 relative place-self-center w-full max-w-sm items-center">
    <MagnifyingGlassIcon class="absolute left-6 top-2.5 size-4 text-muted-foreground" />
    <Input v-model="searchedTrainNumber" placeholder="Search Train" class="pl-8" />
  </div>
  <div class="pr-4 pl-4 relative place-self-center w-full max-w-sm items-center">
    <Button @click="routeToTrainStatus">
      View Details
    </Button>
  </div>
</template>

<style scoped>

</style>