import { createRouter, createWebHistory } from 'vue-router';

const routes : any[] = [
    {
        path: '/',
        redirect: '/map',
    },
    {
        path: '/map',
        name: 'Live Map',
        component: () => import('./views/Map.vue'),
    },
    {
        path: '/stations',
        name: 'Stations',
        component: () => import('./views/Stations.vue'),
    },
    {
        path: '/disruptions',
        name: 'Disruptions',
        component: () => import('./views/Disruptions.vue'),
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;