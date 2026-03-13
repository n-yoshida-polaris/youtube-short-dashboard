<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">リサーチ / 調査チャンネル</h1>

    <v-data-table
      :headers="headers"
      :items="channels"
      :loading="loading"
      density="comfortable"
      class="elevation-1"
      items-per-page="100"
    >
      <template #item.title="{ item }">
        <RouterLink :to="`/channels/${item.channel_id}`" class="text-decoration-none">
          {{ item.title }}
        </RouterLink>
      </template>
      <template #item.subscriber_count="{ item }">
        {{ item.subscriber_count.toLocaleString() }}
      </template>
      <template #item.median_views="{ item }">
        {{ item.median_views.toLocaleString() }}
      </template>
      <template #item.spread_ratio="{ item }">
        {{ item.spread_ratio.toFixed(2) }}x
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { api, type Channel } from '../api'

const channels = ref<Channel[]>([])
const loading = ref(true)

const headers = [
  { title: 'チャンネル', key: 'title', sortable: true },
  { title: '登録者数', key: 'subscriber_count', sortable: true },
  { title: '中央値再生', key: 'median_views', sortable: true },
  { title: '拡散倍率', key: 'spread_ratio', sortable: true },
  { title: 'ヒット率', key: 'hit_rate', sortable: true },
]

onMounted(async () => {
  channels.value = await api.research.channels()
  loading.value = false
})
</script>
