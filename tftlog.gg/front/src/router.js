import { createWebHistory, createRouter } from "vue-router";
import MainPage from './pages/Main.vue'

const routes = [
  {
    path: "/",
    component: MainPage,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 