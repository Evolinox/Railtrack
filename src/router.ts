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
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('./views/Settings.vue'),
    },
    {
        path: '/train',
        name: 'Train',
        component: () => import('./views/TrainSearch.vue'),
        children: [
            {
                path: ':id',
                name: ':id',
                component: () => import('./views/TrainStatus.vue'),
                props: true,
            },
        ],
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;