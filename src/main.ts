import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import './assets/index.css';
import router from "@/router.ts";

const app = createApp(App);
const pinia = createPinia()

app.use(router);
app.use(pinia);

// Mount the app to DOM
app.mount("#app");