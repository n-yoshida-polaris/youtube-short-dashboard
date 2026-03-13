import { getDb } from '../db';
import { fetchVideoStats } from '../youtube';

export async function collectStats(channelId: string): Promise<void> {
  const db = getDb();

  // own チャンネルのみ時系列を保存（watch は最新スナップショットで十分）
  const ch = db
    .prepare('SELECT type FROM channels WHERE channel_id = ?')
    .get(channelId) as { type: string } | undefined;

  if (!ch) return;

  // 対象動画ID（最新100件）
  const rows = db
    .prepare(
      `SELECT video_id FROM videos WHERE channel_id = ?
       ORDER BY published_at DESC LIMIT 100`
    )
    .all(channelId) as { video_id: string }[];

  if (rows.length === 0) return;

  const videoIds = rows.map((r) => r.video_id);
  const stats = await fetchVideoStats(videoIds);

  const insertHistory = db.prepare(`
    INSERT INTO video_stats_history (video_id, collected_at, view_count, like_count, comment_count)
    VALUES (@video_id, datetime('now'), @view_count, @like_count, @comment_count)
  `);

  // watch チャンネルは最新スナップショットのみ保持（古いものを削除）
  const deleteOldWatch = db.prepare(`
    DELETE FROM video_stats_history
    WHERE video_id = @video_id
      AND id NOT IN (
        SELECT id FROM video_stats_history
        WHERE video_id = @video_id
        ORDER BY collected_at DESC LIMIT 1
      )
  `);

  const run = db.transaction(() => {
    for (const stat of stats) {
      insertHistory.run({
        video_id: stat.id,
        view_count: parseInt(stat.statistics.viewCount ?? '0', 10),
        like_count: parseInt(stat.statistics.likeCount ?? '0', 10),
        comment_count: parseInt(stat.statistics.commentCount ?? '0', 10),
      });

      if (ch.type === 'watch') {
        deleteOldWatch.run({ video_id: stat.id });
      }
    }
  });

  run();
  console.log(`[statsCollector] Saved stats for ${stats.length} videos (channel: ${channelId})`);
}
