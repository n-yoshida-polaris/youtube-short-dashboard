import 'dotenv/config';
import express from 'express';
import { getDb } from './db';
import { collectSingleChannel } from './collector/channelCollector';
import { collectVideoList } from './collector/videoListCollector';
import { collectStats } from './collector/statsCollector';

const app = express();
const PORT = process.env.PORT ?? 3000;
const HOST = process.env.HOST ?? 'localhost';

app.use(express.json());

// CORS（フロントエンド開発用）
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, POST, DELETE');
  next();
});

// ---------- /channels ----------

/** チャンネル一覧（中央値再生・拡散倍率付き） */
app.get('/channels', (_req, res) => {
  const db = getDb();
  const channels = db
    .prepare(
      `SELECT
         c.channel_id,
         c.type,
         c.title,
         c.subscriber_count,
         c.video_count,
         c.status,
         c.updated_at
       FROM channels c
       ORDER BY c.title`
    )
    .all();

  // 各チャンネルの中央値再生・拡散倍率を計算
  const result = channels.map((ch: any) => {
    const views = db
      .prepare(
        `SELECT vsh.view_count
         FROM video_stats_history vsh
         INNER JOIN (
           SELECT video_id, MAX(collected_at) AS latest
           FROM video_stats_history
           GROUP BY video_id
         ) latest ON vsh.video_id = latest.video_id AND vsh.collected_at = latest.latest
         INNER JOIN videos v ON v.video_id = vsh.video_id
         WHERE v.channel_id = ?
         ORDER BY vsh.view_count
         LIMIT 100`
      )
      .all(ch.channel_id) as { view_count: number }[];

    const medianViews = calcMedian(views.map((v) => v.view_count));
    const spreadRatio =
      ch.subscriber_count > 0 ? medianViews / ch.subscriber_count : 0;
    const hitCount = views.filter((v) => v.view_count > medianViews * 5).length;
    const hitRate = views.length > 0 ? hitCount / views.length : 0;

    // 登録者 / 動画本数・登録者 / 活動日数
    const subsPerVideo =
      ch.video_count > 0 ? parseFloat((ch.subscriber_count / ch.video_count).toFixed(1)) : 0;

    const dateRange = db
      .prepare(
        `SELECT MIN(published_at) AS first_pub, MAX(published_at) AS last_pub
         FROM videos WHERE channel_id = ?`
      )
      .get(ch.channel_id) as { first_pub: string | null; last_pub: string | null };

    let subsPerDay = 0;
    if (dateRange.first_pub && dateRange.last_pub && dateRange.first_pub !== dateRange.last_pub) {
      const days =
        (new Date(dateRange.last_pub).getTime() - new Date(dateRange.first_pub).getTime()) /
        (1000 * 60 * 60 * 24);
      subsPerDay = days > 0 ? parseFloat((ch.subscriber_count / days).toFixed(1)) : 0;
    }

    return {
      ...ch,
      median_views: Math.round(medianViews),
      spread_ratio: parseFloat(spreadRatio.toFixed(2)),
      hit_rate: parseFloat(hitRate.toFixed(3)),
      is_prune_candidate: medianViews < 2000 && spreadRatio < 2,
      subs_per_video: subsPerVideo,
      subs_per_day: subsPerDay,
    };
  });

  res.json(result);
});

/** チャンネル追加 */
app.post('/channels', (req, res) => {
  const { channel_id, type } = req.body as { channel_id?: string; type?: string };
  if (!channel_id || !['own', 'watch'].includes(type ?? '')) {
    return res.status(400).json({ error: 'channel_id と type(own|watch) は必須です' });
  }
  const db = getDb();
  db.prepare(`
    INSERT INTO channels (channel_id, type, title)
    VALUES (?, ?, ?)
    ON CONFLICT(channel_id) DO UPDATE SET type = excluded.type
  `).run(channel_id, type, channel_id);

  res.status(201).json({ ok: true });

  // バックグラウンドで収集（レスポンス後に非同期実行）
  (async () => {
    try {
      console.log(`[server] Auto-collect start: ${channel_id}`);
      await collectSingleChannel(channel_id);
      await collectVideoList(channel_id, type!);
      await collectStats(channel_id);
      console.log(`[server] Auto-collect done: ${channel_id}`);
    } catch (err) {
      console.error(`[server] Auto-collect failed: ${channel_id}`, err);
    }
  })();
});

/** チャンネル詳細 */
app.get('/channels/:id', (req, res) => {
  const db = getDb();
  const ch = db
    .prepare('SELECT * FROM channels WHERE channel_id = ?')
    .get(req.params.id);

  if (!ch) return res.status(404).json({ error: 'Channel not found' });

  const videos = db
    .prepare(
      `SELECT v.video_id, v.title, v.description, v.published_at,
              vsh.view_count, vsh.like_count, vsh.comment_count, vsh.collected_at
       FROM videos v
       INNER JOIN (
         SELECT video_id, MAX(collected_at) AS latest
         FROM video_stats_history GROUP BY video_id
       ) latest ON v.video_id = latest.video_id
       INNER JOIN video_stats_history vsh
         ON vsh.video_id = latest.video_id AND vsh.collected_at = latest.latest
       WHERE v.channel_id = ?
       ORDER BY v.published_at DESC
       LIMIT 100`
    )
    .all(req.params.id) as any[];

  const viewCounts = videos.map((v) => v.view_count);
  const medianViews = calcMedian(viewCounts);

  const videosWithMultiplier = videos.map((v) => ({
    ...v,
    multiplier: medianViews > 0 ? parseFloat((v.view_count / medianViews).toFixed(2)) : 0,
    is_hit: v.view_count > medianViews * 5,
  }));

  res.json({ channel: ch, videos: videosWithMultiplier, median_views: Math.round(medianViews) });
});

/** チャンネル削除 */
app.delete('/channels/:id', (req, res) => {
  const db = getDb();
  const ch = db.prepare('SELECT channel_id FROM channels WHERE channel_id = ?').get(req.params.id);
  if (!ch) return res.status(404).json({ error: 'Channel not found' });

  db.prepare('DELETE FROM video_stats_history WHERE video_id IN (SELECT video_id FROM videos WHERE channel_id = ?)').run(req.params.id);
  db.prepare('DELETE FROM videos WHERE channel_id = ?').run(req.params.id);
  db.prepare('DELETE FROM channels WHERE channel_id = ?').run(req.params.id);

  res.json({ ok: true });
});

/** チャンネルステータス更新 */
app.patch('/channels/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body as { status: string };
  const allowed = ['keep', 'watch', 'prune', 'archived'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.prepare("UPDATE channels SET status = ?, updated_at = datetime('now') WHERE channel_id = ?")
    .run(status, req.params.id);

  res.json({ ok: true });
});

// ---------- /videos ----------

/** ヒット動画一覧 */
app.get('/videos/hits', (_req, res) => {
  const db = getDb();

  // チャンネルごとの中央値を計算してからヒット判定
  const channels = db
    .prepare("SELECT channel_id FROM channels WHERE status != 'archived'")
    .all() as { channel_id: string }[];

  const hits: any[] = [];

  for (const ch of channels) {
    const videos = db
      .prepare(
        `SELECT v.video_id, v.title, v.description, v.published_at,
                c.title AS channel_title, c.channel_id,
                vsh.view_count, vsh.like_count, vsh.comment_count
         FROM videos v
         INNER JOIN (
           SELECT video_id, MAX(collected_at) AS latest
           FROM video_stats_history GROUP BY video_id
         ) latest ON v.video_id = latest.video_id
         INNER JOIN video_stats_history vsh
           ON vsh.video_id = latest.video_id AND vsh.collected_at = latest.latest
         INNER JOIN channels c ON c.channel_id = v.channel_id
         WHERE v.channel_id = ?
         ORDER BY v.published_at DESC LIMIT 100`
      )
      .all(ch.channel_id) as any[];

    const median = calcMedian(videos.map((v) => v.view_count));
    for (const v of videos) {
      if (v.view_count > median * 5) {
        hits.push({ ...v, channel_median: Math.round(median), multiplier: parseFloat((v.view_count / median).toFixed(1)) });
      }
    }
  }

  hits.sort((a, b) => b.multiplier - a.multiplier);
  res.json(hits);
});

// ---------- /research ----------

/** Watchチャンネル一覧 */
app.get('/research/channels', (_req, res) => {
  const db = getDb();
  const channels = db
    .prepare("SELECT * FROM channels WHERE type = 'watch' ORDER BY title")
    .all() as any[];

  const result = channels.map((ch: any) => {
    const views = db
      .prepare(
        `SELECT vsh.view_count
         FROM video_stats_history vsh
         INNER JOIN (
           SELECT video_id, MAX(collected_at) AS latest
           FROM video_stats_history
           GROUP BY video_id
         ) latest ON vsh.video_id = latest.video_id AND vsh.collected_at = latest.latest
         INNER JOIN videos v ON v.video_id = vsh.video_id
         WHERE v.channel_id = ?
         ORDER BY vsh.view_count
         LIMIT 100`
      )
      .all(ch.channel_id) as { view_count: number }[];

    const medianViews = calcMedian(views.map((v) => v.view_count));
    const spreadRatio = ch.subscriber_count > 0 ? medianViews / ch.subscriber_count : 0;
    const hitCount = views.filter((v) => v.view_count > medianViews * 5).length;
    const hitRate = views.length > 0 ? hitCount / views.length : 0;

    return {
      ...ch,
      median_views: Math.round(medianViews),
      spread_ratio: parseFloat(spreadRatio.toFixed(2)),
      hit_rate: parseFloat(hitRate.toFixed(3)),
    };
  });

  res.json(result);
});

// ---------- /ideas ----------

app.get('/ideas', (_req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM ideas ORDER BY created_at DESC').all());
});

app.post('/ideas', (req, res) => {
  const db = getDb();
  const { theme, source_channels = '', notes = '' } = req.body as any;
  if (!theme) return res.status(400).json({ error: 'theme is required' });
  const result = db
    .prepare('INSERT INTO ideas (theme, source_channels, notes) VALUES (?, ?, ?)')
    .run(theme, source_channels, notes);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.patch('/ideas/:id', (req, res) => {
  const db = getDb();
  const { status, notes } = req.body as any;
  db.prepare("UPDATE ideas SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, notes, req.params.id);
  res.json({ ok: true });
});

// ---------- util ----------

function calcMedian(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

app.listen(+PORT, HOST, () => {
  console.log(`[server] Listening on http://${HOST}:${PORT}`);
});
