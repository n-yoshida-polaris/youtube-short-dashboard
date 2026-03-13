import { createRouter, createWebHistory } from 'vue-router'
import ChannelOverview from '../views/ChannelOverview.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/channels' },
    { path: '/channels', name: 'channels', component: ChannelOverview },
    { path: '/channels/:id', name: 'channel-detail', component: () => import('../views/ChannelDetail.vue') },
    { path: '/hits', name: 'hits', component: () => import('../views/HitVideos.vue') },
    { path: '/research', name: 'research', component: () => import('../views/Research.vue') },
    { path: '/ideas', name: 'ideas', component: () => import('../views/IdeaCandidates.vue') },
    { path: '/help', name: 'help', component: () => import('../views/HelpPage.vue') },
  ],
})

export default router
