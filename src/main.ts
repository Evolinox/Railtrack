import { createApp } from "vue";
import App from "./App.vue";
import './assets/index.css';
import router from "@/router.ts";

const app = createApp(App);

app.use(router);

// Mount the app to DOM
app.mount("#app");