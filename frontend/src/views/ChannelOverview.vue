<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">チャンネル一覧</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" class="mr-3" @click="addDialog = true">チャンネル追加</v-btn>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="検索"
        density="compact"
        hide-details
        style="max-width: 240px"
      />
      <v-select
        v-model="filterStatus"
        :items="['すべて', 'keep', 'watch', 'prune']"
        label="ステータス"
        density="compact"
        hide-details
        class="ml-3"
        style="max-width: 140px"
      />
    </div>

    <v-data-table
      :headers="headers"
      :items="filtered"
      :loading="loading"
      :search="search"
      density="comfortable"
      class="elevation-1"
      items-per-page="100"
    >
      <template #item.title="{ item }">
        <RouterLink :to="`/channels/${item.channel_id}`" class="text-decoration-none">
          {{ item.title }}
        </RouterLink>
      </template>

      <template #item.median_views="{ item }">
        {{ item.median_views.toLocaleString() }}
      </template>

      <template #item.spread_ratio="{ item }">
        <v-chip :color="spreadColor(item.spread_ratio)" size="small">
          {{ item.spread_ratio.toFixed(1) }}x
        </v-chip>
      </template>

      <template #item.hit_rate="{ item }">
        {{ (item.hit_rate * 100).toFixed(1) }}%
      </template>

      <template #item.subs_per_video="{ item }">
        {{ item.subs_per_video.toLocaleString() }}
      </template>

      <template #item.subs_per_day="{ item }">
        {{ item.subs_per_day.toLocaleString() }}
      </template>

      <template #item.is_prune_candidate="{ item }">
        <v-chip v-if="item.is_prune_candidate" color="error" size="small">撤退候補</v-chip>
      </template>

      <template #item.status="{ item }">
        <v-select
          :model-value="item.status"
          :items="['keep', 'watch', 'prune', 'archived']"
          density="compact"
          hide-details
          variant="plain"
          style="width: 110px"
          @update:model-value="(v) => updateStatus(item.channel_id, v)"
        />
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="confirmDelete(item)"
        />
      </template>
    </v-data-table>

    <!-- 削除確認ダイアログ -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card title="チャンネルを削除">
        <v-card-text>
          <strong>{{ deleteTarget?.title }}</strong> を削除しますか？<br />
          関連する動画・統計データもすべて削除されます。この操作は取り消せません。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="submitDelete">削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- チャンネル追加ダイアログ -->
    <v-dialog v-model="addDialog" max-width="480">
      <v-card title="チャンネルを追加">
        <v-card-text>
          <v-text-field
            v-model="addForm.channel_id"
            label="チャンネルID (UC...)"
            placeholder="UCxxxxxxxxxxxxxxxx"
            :error-messages="addError"
          />
          <v-radio-group v-model="addForm.type" inline label="種別">
            <v-radio label="own（自チャンネル）" value="own" />
            <v-radio label="watch（調査用）" value="watch" />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="addDialog = false">キャンセル</v-btn>
          <v-btn color="primary" :loading="addLoading" @click="submitAdd">追加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  <!-- 収集中スナックバー -->
  <v-snackbar v-model="snackbar" timeout="6000" color="info">
    チャンネルを追加しました。バックグラウンドでデータ収集中…
  </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { api, type Channel } from '../api'

const channels = ref<Channel[]>([])
const loading = ref(true)
const search = ref('')
const filterStatus = ref('すべて')

const addDialog = ref(false)
const addLoading = ref(false)
const addError = ref('')
const addForm = ref<{ channel_id: string; type: 'own' | 'watch' }>({ channel_id: '', type: 'own' })
const snackbar = ref(false)

const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteTarget = ref<Channel | null>(null)

const headers = [
  { title: 'チャンネル', key: 'title', sortable: true },
  { title: '種別', key: 'type', sortable: true },
  { title: '登録者数', key: 'subscriber_count', sortable: true },
  { title: '動画数', key: 'video_count', sortable: true },
  { title: '中央値再生', key: 'median_views', sortable: true },
  { title: '拡散倍率', key: 'spread_ratio', sortable: true },
  { title: 'ヒット率', key: 'hit_rate', sortable: true },
  { title: '登録者/本数', key: 'subs_per_video', sortable: true },
  { title: '登録者/日', key: 'subs_per_day', sortable: true },
  { title: '撤退候補', key: 'is_prune_candidate', sortable: false },
  { title: 'ステータス', key: 'status', sortable: true },
  { title: '', key: 'actions', sortable: false },
]

const filtered = computed(() => {
  if (filterStatus.value === 'すべて') return channels.value
  return channels.value.filter((c) => c.status === filterStatus.value)
})

function spreadColor(ratio: number): string {
  if (ratio >= 10) return 'purple'
  if (ratio >= 3) return 'success'
  if (ratio >= 1) return 'info'
  return 'error'
}

async function updateStatus(channelId: string, status: string) {
  await api.channels.setStatus(channelId, status)
  const ch = channels.value.find((c) => c.channel_id === channelId)
  if (ch) ch.status = status as Channel['status']
}

async function submitAdd() {
  addError.value = ''
  if (!addForm.value.channel_id.startsWith('UC')) {
    addError.value = 'チャンネルIDは UC で始まる必要があります'
    return
  }
  addLoading.value = true
  try {
    await api.channels.create(addForm.value.channel_id, addForm.value.type)
    channels.value = await api.channels.list()
    addDialog.value = false
    addForm.value = { channel_id: '', type: 'own' }
    snackbar.value = true
  } finally {
    addLoading.value = false
  }
}

function confirmDelete(channel: Channel) {
  deleteTarget.value = channel
  deleteDialog.value = true
}

async function submitDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await api.channels.delete(deleteTarget.value.channel_id)
    channels.value = channels.value.filter((c) => c.channel_id !== deleteTarget.value!.channel_id)
    deleteDialog.value = false
  } finally {
    deleteLoading.value = false
  }
}

onMounted(async () => {
  channels.value = await api.channels.list()
  loading.value = false
})
</script>
