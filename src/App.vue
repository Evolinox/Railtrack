<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar';
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";
// Icons from lucide
import {Search, Map, House, TriangleAlert, ChevronsUpDown} from 'lucide-vue-next';

const router = useRouter();
const pageName = ref('');
const search = ref('');

onMounted(() => {
  const colorMode = useColorMode();
  const appearance = localStorage.getItem('appearance');

  if (appearance === 'light' || appearance === 'dark') {
    colorMode.value = appearance;
  } else {
    colorMode.value = 'auto';
  }

  routeTo('/map')
});

async function routeTo(link: string) {
  await router.push(link);
  pageName.value = router.currentRoute.value.name;
}
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <!-- Sidebar Header Config, Apptitle and Searchbar for Trains, Stations or Operators -->
      <SidebarHeader>
        <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar class="h-8 w-8 rounded-lg">
            <AvatarImage src="/tauri.svg" alt="RailtrackLogo" />
            <AvatarFallback class="rounded-lg">
              RT
            </AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">Railtrack</span>
            <span class="truncate text-xs font-thin">Version: 0.0.1</span>
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
      </header>
      <RouterView />
    </SidebarInset>
  </SidebarProvider>
  <Toaster class="pointer-events-auto" />
</template>