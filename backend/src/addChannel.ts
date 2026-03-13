/**
 * チャンネルをDBに追加するユーティリティ
 * 使い方:
 *   ts-node src/addChannel.ts <channel_id> <type: own|watch>
 * 例:
 *   ts-node src/addChannel.ts UCxxxxxxxxxxxxxxxx own
 *   ts-node src/addChannel.ts UCyyyyyyyyyyyyyy watch
 */
import 'dotenv/config';
import { getDb } from './db';

const [, , channelId, type] = process.argv;

if (!channelId || !['own', 'watch'].includes(type)) {
  console.error('Usage: ts-node src/addChannel.ts <channel_id> <own|watch>');
  process.exit(1);
}

const db = getDb();
db.prepare(`
  INSERT INTO channels (channel_id, type, title)
  VALUES (?, ?, ?)
  ON CONFLICT(channel_id) DO UPDATE SET type = excluded.type
`).run(channelId, type, channelId);

console.log(`Channel ${channelId} (${type}) added. Run collector to fetch metadata.`);
