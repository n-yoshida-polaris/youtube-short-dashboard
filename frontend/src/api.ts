const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

async function patch(path: string, body: unknown): Promise<void> {
  await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function del(path: string): Promise<void> {
  await fetch(`${BASE}${path}`, { method: 'DELETE' })
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export interface Channel {
  channel_id: string
  type: 'own' | 'watch'
  title: string
  subscriber_count: number
  video_count: number
  status: 'keep' | 'watch' | 'prune' | 'archived'
  median_views: number
  spread_ratio: number
  hit_rate: number
  is_prune_candidate: boolean
  subs_per_video: number
  subs_per_day: number
  updated_at: string
}

export interface Video {
  video_id: string
  channel_id: string
  channel_title: string
  title: string
  description: string
  published_at: string
  view_count: number
  like_count: number
  comment_count: number
  multiplier: number
  is_hit?: boolean
  channel_median?: number
}

export interface ChannelDetail {
  channel: Channel
  videos: Video[]
  median_views: number
}

export interface Idea {
  id: number
  theme: string
  source_channels: string
  notes: string
  status: 'draft' | 'testing' | 'launched' | 'dropped'
  created_at: string
}

export const api = {
  channels: {
    list: () => get<Channel[]>('/channels'),
    get: (id: string) => get<ChannelDetail>(`/channels/${id}`),
    setStatus: (id: string, status: string) => patch(`/channels/${id}/status`, { status }),
    create: (channel_id: string, type: 'own' | 'watch') =>
      post<{ ok: boolean }>('/channels', { channel_id, type }),
    delete: (id: string) => del(`/channels/${id}`),
  },
  videos: {
    hits: () => get<Video[]>('/videos/hits'),
  },
  research: {
    channels: () => get<Channel[]>('/research/channels'),
  },
  ideas: {
    list: () => get<Idea[]>('/ideas'),
    create: (theme: string, source_channels: string, notes: string) =>
      post<{ id: number }>('/ideas', { theme, source_channels, notes }),
    update: (id: number, status: string, notes: string) =>
      patch(`/ideas/${id}`, { status, notes }),
  },
}
