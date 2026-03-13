import { execSync } from 'child_process';
import { getDb } from '../db';
import { fetchPlaylistVideos } from '../youtube';

interface ChannelRow {
  channel_id: string;
  uploads_playlist: string | null;
}

/** yt-dlp で動画リストを取得（quota 節約のため推奨） */
function fetchViaYtDlp(channelId: string, maxVideos: number): Array<{ videoId: string; title: string; description: string; publishedAt: string }> {
  try {
    const url = `https://www.youtube.com/channel/${channelId}/shorts`;
    const output = execSync(
      `yt-dlp --flat-playlist --playlist-end ${maxVideos} --print "%(id)s\t%(title)s\t%(upload_date>%Y-%m-%dT%H:%M:%SZ)s" "${url}"`,
      { encoding: 'utf8', timeout: 60_000 }
    );
    return output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [videoId, title, publishedAt] = line.split('\t');
        return { videoId, title: title ?? '', description: '', publishedAt: publishedAt ?? '' };
      });
  } catch {
    return [];
  }
}

export async function collectVideoList(channelId: string, channelType: string): Promise<void> {
  const db = getDb();
  const maxVideos = 100;

  const ch = db
    .prepare('SELECT channel_id, uploads_playlist FROM channels WHERE channel_id = ?')
    .get(channelId) as ChannelRow | undefined;

  if (!ch) return;

  let videos: Array<{ videoId: string; title: string; description: string; publishedAt: string }> = [];

  // yt-dlp を試みる（watch チャンネルも含め全チャンネル対応）
  videos = fetchViaYtDlp(channelId, maxVideos);

  // fallback: YouTube API
  if (videos.length === 0 && ch.uploads_playlist) {
    console.log(`[videoListCollector] yt-dlp failed for ${channelId}, falling back to API...`);
    const items = await fetchPlaylistVideos(ch.uploads_playlist, maxVideos);
    videos = items.map((item) => ({
      videoId: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
    }));
  }

  if (videos.length === 0) {
    console.warn(`[videoListCollector] No videos found for channel ${channelId}`);
    return;
  }

  const insert = db.prepare(`
    INSERT INTO videos (video_id, channel_id, title, description, published_at)
    VALUES (@video_id, @channel_id, @title, @description, @published_at)
    ON CONFLICT(video_id) DO UPDATE SET
      title       = excluded.title,
      description = excluded.description
  `);

  const run = db.transaction(() => {
    for (const v of videos) {
      insert.run({
        video_id: v.videoId,
        channel_id: channelId,
        title: v.title,
        description: v.description,
        published_at: v.publishedAt,
      });
    }
  });

  run();
  console.log(`[videoListCollector] Upserted ${videos.length} videos for channel ${channelId}`);
}
