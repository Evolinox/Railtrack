<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
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
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// Icons from lucide
import { Map, House, TriangleAlert, Info } from 'lucide-vue-next';
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
const pageName = ref('');

onMounted(() => {
  lastUpdate.value = fintrafficStore.getLastUpdatedTrains;
  const colorMode = useColorMode();
  const appearance = localStorage.getItem('appearance');

  if (appearance === 'light' || appearance === 'dark') {
    colorMode.value = appearance;
  } else {
    colorMode.value = 'auto';
  }

  routeTo('/map')

  // Intervals for refresh time
  const refreshTimer = setInterval(async () => {
    lastUpdate.value = fintrafficStore.getLastUpdatedTrains;
  }, 1000);

  // Clear all intervals on unmount
  onUnmounted(() => {
    clearInterval(refreshTimer);
  })
});

async function routeTo(link: string) {
  await router.push(link);
  pageName.value = router.currentRoute.value.name?.toString() || '';
}
</script>

<template>
  <Dialog>
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <!-- Sidebar Header Config, Apptitle and Searchbar for Trains, Stations or Operators -->
        <SidebarHeader>
          <SidebarMenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage src="/railtrack.png" alt="RailtrackLogo" />
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
                  <House/>
                  <span>Stations</span>
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
              <DialogTrigger asChild>
                <SidebarMenuButton>
                  <Info/>
                  <span>Attributions</span>
                </SidebarMenuButton>
              </DialogTrigger>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail/>
      </Sidebar>

      <!-- Sidebar Inset Config, Routerview and Nav -->
      <SidebarInset>
        <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger class="-ml-1"/>
          <Separator orientation="vertical" class="mr-2 h-4"/>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink>
                  Railtrack
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block"/>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbPage>
                  {{ pageName }}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div class="relative ml-auto md:grow-0">
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