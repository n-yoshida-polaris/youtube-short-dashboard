import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'db.sqlite');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      channel_id       TEXT PRIMARY KEY,
      type             TEXT NOT NULL CHECK(type IN ('own', 'watch')),
      title            TEXT NOT NULL,
      subscriber_count INTEGER NOT NULL DEFAULT 0,
      video_count      INTEGER NOT NULL DEFAULT 0,
      uploads_playlist TEXT,
      status           TEXT NOT NULL DEFAULT 'keep' CHECK(status IN ('keep', 'watch', 'prune', 'archived')),
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS videos (
      video_id       TEXT PRIMARY KEY,
      channel_id     TEXT NOT NULL REFERENCES channels(channel_id),
      title          TEXT NOT NULL,
      description    TEXT NOT NULL DEFAULT '',
      published_at   TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS video_stats_history (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id      TEXT NOT NULL REFERENCES videos(video_id),
      collected_at  TEXT NOT NULL DEFAULT (datetime('now')),
      view_count    INTEGER NOT NULL DEFAULT 0,
      like_count    INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      theme           TEXT NOT NULL,
      source_channels TEXT NOT NULL DEFAULT '',
      notes           TEXT NOT NULL DEFAULT '',
      status          TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'testing', 'launched', 'dropped')),
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
    CREATE INDEX IF NOT EXISTS idx_vsh_video_id ON video_stats_history(video_id);
    CREATE INDEX IF NOT EXISTS idx_vsh_collected_at ON video_stats_history(collected_at);
  `);
}
