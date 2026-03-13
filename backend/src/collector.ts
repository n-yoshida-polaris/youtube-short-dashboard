/**
 * collector.ts - メインエントリーポイント
 * cron: 0 *\/6 * * *  (6時間ごと)
 */
import 'dotenv/config';
import pLimit from 'p-limit';
import { getDb } from './db';
import { collectChannels } from './collector/channelCollector';
import { collectVideoList } from './collector/videoListCollector';
import { collectStats } from './collector/statsCollector';

const CONCURRENCY = 5;

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[collector] ${label} failed (attempt ${i + 1}/${retries}): ${msg}`);
    }
  }
  console.error(`[collector] ${label} skipped after ${retries} retries.`);
  return null;
}

async function main(): Promise<void> {
  console.log(`[collector] Start: ${new Date().toISOString()}`);

  // 1. チャンネル情報を更新
  await withRetry(() => collectChannels(), 'collectChannels');

  // 2. 全チャンネルの動画リスト + 統計を並列収集
  const db = getDb();
  const channels = db
    .prepare("SELECT channel_id, type FROM channels WHERE status != 'archived'")
    .all() as { channel_id: string; type: string }[];

  console.log(`[collector] Processing ${channels.length} channels...`);

  const limit = pLimit(CONCURRENCY);

  await Promise.all(
    channels.map((ch) =>
      limit(async () => {
        const label = `channel ${ch.channel_id}`;
        await withRetry(() => collectVideoList(ch.channel_id, ch.type), `videoList ${label}`);
        await withRetry(() => collectStats(ch.channel_id), `stats ${label}`);
      })
    )
  );

  console.log(`[collector] Done: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error('[collector] Fatal error:', err);
  process.exit(1);
});
