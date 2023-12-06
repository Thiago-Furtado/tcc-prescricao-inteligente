import { createApp, h } from "vue";
import * as VueRouter from "vue-router";
import { vuetify } from "./plugins/vuetify";
import { createPinia } from "pinia";
import App from "./App.vue";
import Home from "./pages/Home.vue";
import Doctor from "./pages/Doctor.vue";
import QrCode from "./pages/QrCode.vue";
import Validation from "./pages/Validation.vue";
import Pharmacist from "./pages/Pharmacist.vue";
import CreatePrescription from "./pages/CreatePrescription.vue";
import ViewPrescription from "./pages/ViewPrescription.vue";
import "./style.css";
import "@fontsource/inter";

const routes = [
  { name: "Home", path: "/", component: Home },
  { name: "Doctor", path: "/doctor", component: Doctor },
  { name: "Validation", path: "/validation/:id", component: Validation },
  { name: "QrCode", path: "/qr-code", component: QrCode },
  { name: "Pharmacist", path: "/pharmacist", component: Pharmacist },
  {
    name: "CreatePrescription",
    path: "/prescription/new",
    component: CreatePrescription,
  },
  {
    name: "ViewPrescription",
    path: "/prescription/:id",
    component: ViewPrescription,
  },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes,
});

const app = createApp({
  render: () => h(App),
});

const pinia = createPinia();
app.use(router);
app.use(vuetify);
app.use(pinia);
app.mount("#app");
