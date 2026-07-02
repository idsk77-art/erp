import type { Database } from './database.js';

export function runMigrations(database: Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      profile_image_url TEXT,
      last_login_at TEXT NOT NULL,
      google_access_token TEXT,
      google_refresh_token TEXT,
      google_token_expiry INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      location TEXT,
      google_event_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_calendar_events_user_starts_at
      ON calendar_events(user_id, starts_at);

    CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_at TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'normal',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_todo_items_user_due_at
      ON todo_items(user_id, due_at);

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      company_name TEXT,
      job_title TEXT,
      phone_number TEXT,
      email TEXT,
      memo TEXT,
      business_card_image_path TEXT,
      google_resource_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_user_name
      ON contacts(user_id, name);

    CREATE TABLE IF NOT EXISTS scanned_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_scanned_documents_user_created
      ON scanned_documents(user_id, created_at);

    CREATE TABLE IF NOT EXISTS audio_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      audio_file_path TEXT NOT NULL,
      status TEXT NOT NULL,
      transcript TEXT,
      title TEXT,
      summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audio_reports_user_created
      ON audio_reports(user_id, created_at);
  `);

  // Run column updates for existing databases
  try {
    database.exec('ALTER TABLE users ADD COLUMN google_access_token TEXT;');
  } catch {}
  try {
    database.exec('ALTER TABLE users ADD COLUMN google_refresh_token TEXT;');
  } catch {}
  try {
    database.exec('ALTER TABLE users ADD COLUMN google_token_expiry INTEGER;');
  } catch {}
  try {
    database.exec('ALTER TABLE calendar_events ADD COLUMN google_event_id TEXT;');
  } catch {}
  try {
    database.exec('ALTER TABLE contacts ADD COLUMN google_resource_name TEXT;');
  } catch {}
}
