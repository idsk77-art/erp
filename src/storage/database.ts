import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { AppConfig } from '../config/env.js';

export type Database = DatabaseSync;

export function openDatabase(config: AppConfig): Database {
  const databasePath = resolveDatabasePath(config.databaseUrl);

  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA journal_mode = WAL;');

  return database;
}

function resolveDatabasePath(databaseUrl: string): string {
  if (databaseUrl === ':memory:') {
    return databaseUrl;
  }

  if (databaseUrl.startsWith('file:')) {
    return databaseUrl.slice('file:'.length);
  }

  return resolve(databaseUrl);
}
