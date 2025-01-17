<script setup lang="ts">
import {ref, onMounted, onUnmounted, watch} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useColorMode } from '@vueuse/core';
// Shadcn-Vue Components
import Toaster from './components/ui/toast/Toaster.vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// Icons from lucide
import { Map, School, TriangleAlert, Info, Settings, TrainFront } from 'lucide-vue-next';
import { useFintrafficStore } from "@/stores/fintraffic.store.ts";
import SidebarFooter from './components/ui/sidebar/SidebarFooter.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const fintrafficStore = useFintrafficStore();
const lastUpdate = ref('');
const router = useRouter();
const route = useRoute();
const routeLayerTwo = ref(route.name);
const secondLayerRoute = ref(false);
const routeLayerThree = ref('');
const thirdLayerRoute = ref(false);
const liveUpdateVisible = ref(false);

onMounted(() => {
  lastUpdate.value = fintrafficStore.getLastUpdatedTrains;
  const colorMode = useColorMode();
  const appearance = localStorage.getItem('appearance');

  if (appearance === 'light' || appearance === 'dark') {
    colorMode.value = appearance;
  } else {
    colorMode.value = 'auto';
  }

  // Intervals for refresh time
  const refreshTimer = setInterval(async () => {
    lastUpdate.value = fintrafficStore.getLastUpdatedTrains;
  }, 1000);

  // Clear all intervals on unmount
  onUnmounted(() => {
    clearInterval(refreshTimer);
  });
});

/*
Doing funny things with the Breadcumbs in the Header 
basically checking the route name and splitting it to parts
for example "trains/123" would be split to "trains" and "123" and "thirdLayerRoute"
would be set to true, so the breadcrumb would show the second (third) layer of the route.
Also, if the route is "home" the second and third layer routes are set to false, so only
Railtrack will be visible in the breadcrumb.
*/
watch(() => route.name, (newName, oldName) => {
    console.log('Route name changed:', oldName, '->', newName);
    if (typeof newName == "string" && newName?.includes('/') && newName != "Home") {
      secondLayerRoute.value = true;
      thirdLayerRoute.value = true;
      const parts = newName.split('/');
      routeLayerTwo.value = parts[0];
      routeLayerThree.value = route.params.id.toString();
    } else if (newName != "Home") {
      secondLayerRoute.value = true;
      thirdLayerRoute.value = false;
      routeLayerTwo.value = route.name;
    } else if (newName == "Home") {
      secondLayerRoute.value = false;
      thirdLayerRoute.value = false;
    }
  }
);

/*
a simple "routeTo" link function that takes a string and pushes it to the router
*/
async function routeTo(link: string) {
  await router.push(link);
  if (link === '/map') {
    liveUpdateVisible.value = true;
  } else {
    liveUpdateVisible.value = false;
  }
}
</script>

<template>
  <Dialog>
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <!-- Sidebar Header Config, Apptitle and Searchbar for Trains, Stations or Operators -->
        <SidebarHeader>
          <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" @click="routeTo('/')">
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage src="/railtrack_mobile.png" alt="RailtrackLogo" />
              <AvatarFallback class="rounded-lg">
                RT
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">Railtrack</span>
            </div>
          </SidebarMenuButton>
        </SidebarHeader>

        <!-- Sidebar Content Config, Links to Livemap, Servicedisruptions and more -->
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton @click="routeTo('/stations')">
                  <School/>
                  <span>Stations</span>
                </SidebarMenuButton>
                <SidebarMenuButton @click="routeTo('/train')">
                  <TrainFront/>
                  <span>Train</span>
                </SidebarMenuButton>
                <SidebarMenuButton @click="routeTo('/map')">
                  <Map/>
                  <span>Map</span>
                </SidebarMenuButton>
                <SidebarMenuButton @click="routeTo('/disruptions')">
                  <TriangleAlert/>
                  <span>Disruptions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton @click="routeTo('/settings')">
                <Settings/>
                <span>Settings</span>
              </SidebarMenuButton>
              <DialogTrigger asChild>
                <SidebarMenuButton>
                  <Info/>
                  <span>Attributions</span>
                </SidebarMenuButton>
              </DialogTrigger>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <!-- Sidebar Inset Config, Routerview and Nav -->
      <SidebarInset>
        <header class="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1"/>
          <Separator orientation="vertical" class="mr-2 h-4"/>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink @click="routeTo('/')">
                  Railtrack
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="secondLayerRoute" class="hidden md:block"/>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbPage v-if="!thirdLayerRoute && secondLayerRoute">
                  {{ routeLayerTwo }}
                </BreadcrumbPage>
                <BreadcrumbLink v-if="thirdLayerRoute && secondLayerRoute" @click="routeTo('/' + routeLayerTwo?.toString().toLowerCase())">
                  {{ routeLayerTwo }}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator v-if="thirdLayerRoute" class="hidden md:block"/>
              <BreadcrumbItem v-if="thirdLayerRoute" class="hidden md:block">
                <BreadcrumbPage>
                  {{ routeLayerThree }}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div v-if="liveUpdateVisible" class="relative ml-auto md:grow-0">
            <Label class="text-xs font-thin">Last Refreshed: {{ lastUpdate }}</Label>
          </div>
        </header>
        <RouterView />
      </SidebarInset>
    </SidebarProvider>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Attributions</DialogTitle>
        <DialogDescription>Other Software and Data used to create Railtrack</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4 overflow-y-auto px-6">
        <div class="flex flex-col justify-between">
          <p>
            &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>,
          </p>
          <p>
            Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a>
          </p>
          <p>
            <a href="http://www.openstreetmap.org/">OpenStreetMap</a>
          </p>
          Data used for Finland
          <ol>
            <li>
              <a href="https://www.digitraffic.fi/rautatieliikenne/">digitraffic.fi</a>
            </li>
          </ol>
        </div>
      </div>
      <DialogFooter>
        <Label class="text-xs font-thin">Evolinox/Railtrack@0.1.0</Label>
      </DialogFooter>
    </DialogContent>
  <Toaster class="pointer-events-auto" />
  </Dialog>
</template>