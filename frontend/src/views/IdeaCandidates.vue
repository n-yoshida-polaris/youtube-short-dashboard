<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">アイデア候補</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog = true">新規追加</v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="ideas"
      :loading="loading"
      density="comfortable"
      class="elevation-1"
      items-per-page="100"
    >
      <template #item.status="{ item }">
        <v-chip :color="statusColor(item.status)" size="small">{{ item.status }}</v-chip>
      </template>
      <template #item.created_at="{ item }">
        {{ item.created_at.slice(0, 10) }}
      </template>
    </v-data-table>

    <!-- New Idea Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card title="新規アイデア">
        <v-card-text>
          <v-text-field v-model="form.theme" label="テーマ *" />
          <v-text-field v-model="form.source_channels" label="参考チャンネル" />
          <v-textarea v-model="form.notes" label="メモ" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">キャンセル</v-btn>
          <v-btn color="primary" @click="submit">作成</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Idea } from '../api'

const ideas = ref<Idea[]>([])
const loading = ref(true)
const dialog = ref(false)
const form = ref({ theme: '', source_channels: '', notes: '' })

const headers = [
  { title: 'テーマ', key: 'theme', sortable: true },
  { title: '参考チャンネル', key: 'source_channels', sortable: false },
  { title: 'メモ', key: 'notes', sortable: false },
  { title: 'ステータス', key: 'status', sortable: true },
  { title: '作成日', key: 'created_at', sortable: true },
]

function statusColor(status: string): string {
  const map: Record<string, string> = { draft: 'default', testing: 'info', launched: 'success', dropped: 'error' }
  return map[status] ?? 'default'
}

async function submit() {
  if (!form.value.theme) return
  await api.ideas.create(form.value.theme, form.value.source_channels, form.value.notes)
  ideas.value = await api.ideas.list()
  form.value = { theme: '', source_channels: '', notes: '' }
  dialog.value = false
}

onMounted(async () => {
  ideas.value = await api.ideas.list()
  loading.value = false
})
</script>
