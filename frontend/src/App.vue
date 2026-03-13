<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list-item title="YT Dashboard" subtitle="Shorts 複数チャンネル管理" class="py-4" />
      <v-divider />
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.label"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid class="pa-6">
        <RouterView />
      </v-container>
      <v-footer app class="text-caption text-medium-emphasis justify-center py-2">
        © 2026 · polaris.works
      </v-footer>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'

const navItems = [
  { to: '/channels', icon: 'mdi-view-dashboard', label: 'チャンネル一覧' },
  { to: '/hits', icon: 'mdi-fire', label: 'ヒット動画' },
  { to: '/research', icon: 'mdi-magnify', label: 'リサーチ' },
  { to: '/ideas', icon: 'mdi-lightbulb', label: 'アイデア候補' },
  { to: '/help', icon: 'mdi-help-circle-outline', label: 'ヘルプ・使い方' },
]
</script>
