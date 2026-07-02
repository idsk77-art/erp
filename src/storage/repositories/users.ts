import { randomUUID } from 'node:crypto';

import type { UserProfile } from '../../domain/index.js';
import type { Database } from '../database.js';

type UserRow = {
  id: string;
  email: string;
  name: string;
  profile_image_url: string | null;
  last_login_at: string;
};

export type UpsertUserInput = {
  email: string;
  name: string;
  profileImageUrl?: string;
};

export class UserRepository {
  constructor(private readonly database: Database) {}

  ensureLocalUser(id: string): UserProfile {
    const existing = this.findById(id);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const email = `${id}@local.nano-erp`;
    const name = 'Local Development User';

    this.database
      .prepare(
        `
        INSERT INTO users (
          id, email, name, profile_image_url, last_login_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(id, email, name, null, now, now, now);

    return {
      id,
      email,
      name,
      lastLoginAt: now,
    };
  }

  upsertFromGoogleProfile(input: UpsertUserInput): UserProfile {
    const now = new Date().toISOString();
    const existing = this.findByEmail(input.email);
    const id = existing?.id ?? randomUUID();

    this.database
      .prepare(
        `
        INSERT INTO users (
          id, email, name, profile_image_url, last_login_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          profile_image_url = excluded.profile_image_url,
          last_login_at = excluded.last_login_at,
          updated_at = excluded.updated_at
      `,
      )
      .run(id, input.email, input.name, input.profileImageUrl ?? null, now, now, now);

    return (
      this.findByEmail(input.email) ?? {
        id,
        email: input.email,
        name: input.name,
        ...(input.profileImageUrl ? { profileImageUrl: input.profileImageUrl } : {}),
        lastLoginAt: now,
      }
    );
  }

  findByEmail(email: string): UserProfile | null {
    const row = this.database.prepare('SELECT * FROM users WHERE email = ?').get(email) as
      UserRow | undefined;

    return row ? toUserProfile(row) : null;
  }

  findById(id: string): UserProfile | null {
    const row = this.database.prepare('SELECT * FROM users WHERE id = ?').get(id) as
      UserRow | undefined;

    return row ? toUserProfile(row) : null;
  }
}

function toUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    ...(row.profile_image_url ? { profileImageUrl: row.profile_image_url } : {}),
    lastLoginAt: row.last_login_at,
  };
}
