import { createRouter, createWebHistory } from "vue-router";
import Home from "./components/views/HomeView.vue";
import Test from "./components/views/TestView.vue";

const routes = [
  { path: '/', component: Home },
  { path: '/test', component: Test },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router;
