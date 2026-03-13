import { getDb } from '../db';
import { fetchChannelsByIds } from '../youtube';

export async function collectChannels(): Promise<void> {
  const db = getDb();

  // DB に登録済みのチャンネルIDを取得
  const rows = db.prepare('SELECT channel_id FROM channels').all() as { channel_id: string }[];
  const ids = rows.map((r) => r.channel_id);

  if (ids.length === 0) {
    console.log('[channelCollector] No channels registered. Add channels to DB first.');
    return;
  }

  console.log(`[channelCollector] Fetching ${ids.length} channels...`);

  const channels = await fetchChannelsByIds(ids);

  const upsert = db.prepare(`
    INSERT INTO channels (channel_id, type, title, subscriber_count, video_count, uploads_playlist, updated_at)
    VALUES (@channel_id, @type, @title, @subscriber_count, @video_count, @uploads_playlist, datetime('now'))
    ON CONFLICT(channel_id) DO UPDATE SET
      title            = excluded.title,
      subscriber_count = excluded.subscriber_count,
      video_count      = excluded.video_count,
      uploads_playlist = excluded.uploads_playlist,
      updated_at       = datetime('now')
  `);

  const run = db.transaction(() => {
    for (const ch of channels) {
      // 既存レコードの type を保持するため SELECT で取得
      const existing = db
        .prepare('SELECT type FROM channels WHERE channel_id = ?')
        .get(ch.id) as { type: string } | undefined;

      upsert.run({
        channel_id: ch.id,
        type: existing?.type ?? 'own',
        title: ch.snippet.title,
        subscriber_count: parseInt(ch.statistics.subscriberCount ?? '0', 10),
        video_count: parseInt(ch.statistics.videoCount ?? '0', 10),
        uploads_playlist: ch.contentDetails.relatedPlaylists.uploads,
      });
    }
  });

  run();
  console.log(`[channelCollector] Updated ${channels.length} channels.`);
}

/** 単一チャンネルのメタデータを取得・更新 */
export async function collectSingleChannel(channelId: string): Promise<void> {
  const db = getDb();
  const channels = await fetchChannelsByIds([channelId]);
  if (channels.length === 0) {
    console.warn(`[channelCollector] Channel not found: ${channelId}`);
    return;
  }
  const ch = channels[0];
  const existing = db
    .prepare('SELECT type FROM channels WHERE channel_id = ?')
    .get(channelId) as { type: string } | undefined;

  db.prepare(`
    INSERT INTO channels (channel_id, type, title, subscriber_count, video_count, uploads_playlist, updated_at)
    VALUES (@channel_id, @type, @title, @subscriber_count, @video_count, @uploads_playlist, datetime('now'))
    ON CONFLICT(channel_id) DO UPDATE SET
      title            = excluded.title,
      subscriber_count = excluded.subscriber_count,
      video_count      = excluded.video_count,
      uploads_playlist = excluded.uploads_playlist,
      updated_at       = datetime('now')
  `).run({
    channel_id: ch.id,
    type: existing?.type ?? 'own',
    title: ch.snippet.title,
    subscriber_count: parseInt(ch.statistics.subscriberCount ?? '0', 10),
    video_count: parseInt(ch.statistics.videoCount ?? '0', 10),
    uploads_playlist: ch.contentDetails.relatedPlaylists.uploads,
  });
  console.log(`[channelCollector] Updated channel: ${ch.snippet.title}`);
}
