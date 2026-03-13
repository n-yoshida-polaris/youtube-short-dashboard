import axios from 'axios';

const API_KEY = process.env.YOUTUBE_API_KEY ?? '';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface ChannelResource {
  id: string;
  snippet: { title: string };
  statistics: { subscriberCount: string; videoCount: string; viewCount: string };
  contentDetails: { relatedPlaylists: { uploads: string } };
}

export interface PlaylistItemResource {
  contentDetails: { videoId: string };
  snippet: { title: string; description: string; publishedAt: string };
}

export interface VideoStatResource {
  id: string;
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

/** 自分が管理するチャンネル一覧を取得（OAuth不要な場合はIDリストで代替） */
export async function fetchChannelsByIds(ids: string[]): Promise<ChannelResource[]> {
  const results: ChannelResource[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50).join(',');
    const res = await axios.get(`${BASE_URL}/channels`, {
      params: {
        key: API_KEY,
        id: chunk,
        part: 'snippet,statistics,contentDetails',
        maxResults: 50,
      },
    });
    results.push(...res.data.items);
  }
  return results;
}

/** uploads playlist から動画リストを取得 */
export async function fetchPlaylistVideos(
  playlistId: string,
  maxVideos = 100
): Promise<PlaylistItemResource[]> {
  const results: PlaylistItemResource[] = [];
  let pageToken: string | undefined;

  while (results.length < maxVideos) {
    const res = await axios.get(`${BASE_URL}/playlistItems`, {
      params: {
        key: API_KEY,
        playlistId,
        part: 'snippet,contentDetails',
        maxResults: 50,
        pageToken,
      },
    });
    results.push(...res.data.items);
    pageToken = res.data.nextPageToken;
    if (!pageToken) break;
  }

  return results.slice(0, maxVideos);
}

/** 動画IDリストの統計を一括取得（50件バッチ） */
export async function fetchVideoStats(videoIds: string[]): Promise<VideoStatResource[]> {
  const results: VideoStatResource[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50).join(',');
    const res = await axios.get(`${BASE_URL}/videos`, {
      params: {
        key: API_KEY,
        id: chunk,
        part: 'statistics',
        maxResults: 50,
      },
    });
    results.push(...res.data.items);
  }
  return results;
}
