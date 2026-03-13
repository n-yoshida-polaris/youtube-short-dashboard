<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">ヒット動画</h1>
    <p class="text-caption text-medium-emphasis mb-4">定義: 再生数 &gt; チャンネル中央値 × 5</p>

    <v-data-table
      :headers="headers"
      :items="videos"
      :loading="loading"
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
        <v-chip color="success" size="small">{{ item.multiplier }}x</v-chip>
      </template>
      <template #item.published_at="{ item }">
        {{ item.published_at.slice(0, 10) }}
      </template>
      <template #item.comment_count="{ item }">
        {{ item.comment_count }}
      </template>

    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Video } from '../api'

const videos = ref<Video[]>([])
const loading = ref(true)

const headers = [
  { title: 'タイトル', key: 'title', sortable: true },
  { title: 'チャンネル', key: 'channel_title', sortable: true },
  { title: '投稿日', key: 'published_at', sortable: true },
  { title: '再生数', key: 'view_count', sortable: true },
  { title: '倍率', key: 'multiplier', sortable: true },
  { title: 'いいね', key: 'like_count', sortable: true },
  { title: 'コメント', key: 'comment_count', sortable: true },
]

onMounted(async () => {
  videos.value = await api.videos.hits()
  loading.value = false
})
</script>
