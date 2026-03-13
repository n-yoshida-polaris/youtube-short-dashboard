<template>
  <div v-if="detail">
    <div class="d-flex align-center mb-4">
      <RouterLink to="/channels" class="mr-3">
        <v-btn icon="mdi-arrow-left" variant="text" />
      </RouterLink>
      <h1 class="text-h5 font-weight-bold">{{ detail.channel.title }}</h1>
      <v-chip class="ml-3" :color="detail.channel.type === 'own' ? 'primary' : 'secondary'" size="small">
        {{ detail.channel.type }}
      </v-chip>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col v-for="card in summaryCards" :key="card.label" cols="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-caption text-medium-emphasis">{{ card.label }}</div>
            <div class="text-h6 font-weight-bold">{{ card.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Video Table -->
    <v-data-table
      :headers="headers"
      :items="detail.videos"
      density="comfortable"
      class="elevation-1"
      items-per-page="100"
    >
      <template #item.title="{ item }">
        <a :href="`https://youtu.be/${item.video_id}`" target="_blank" class="text-decoration-none">
          {{ item.title }}
        </a>
      </template>
      <template #item.view_count="{ item }">
        {{ item.view_count.toLocaleString() }}
      </template>
      <template #item.multiplier="{ item }">
        <v-chip :color="item.is_hit ? 'success' : 'default'" size="small">
          {{ item.multiplier }}x
        </v-chip>
      </template>
      <template #item.published_at="{ item }">
        {{ item.published_at.slice(0, 10) }}
      </template>
    </v-data-table>
  </div>
  <v-progress-circular v-else indeterminate class="ma-auto d-block mt-16" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api, type ChannelDetail } from '../api'

const route = useRoute()
const detail = ref<ChannelDetail | null>(null)

const summaryCards = computed(() => {
  if (!detail.value) return []
  const ch = detail.value.channel
  return [
    { label: '登録者数', value: ch.subscriber_count.toLocaleString() },
    { label: '中央値再生', value: detail.value.median_views.toLocaleString() },
    { label: '拡散倍率', value: `${(detail.value.median_views / (ch.subscriber_count || 1)).toFixed(2)}x` },
    { label: 'ステータス', value: ch.status },
  ]
})

const headers = [
  { title: 'タイトル', key: 'title', sortable: true },
  { title: '投稿日', key: 'published_at', sortable: true },
  { title: '再生数', key: 'view_count', sortable: true },
  { title: 'いいね', key: 'like_count', sortable: true },
  { title: '倍率', key: 'multiplier', sortable: true },
]

onMounted(async () => {
  detail.value = await api.channels.get(route.params.id as string)
})
</script>
