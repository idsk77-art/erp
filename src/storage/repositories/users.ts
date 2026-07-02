import { randomUUID } from 'node:crypto';

import type { UserProfile } from '../../domain/index.js';
import type { Database } from '../database.js';

type UserRow = {
  id: string;
  email: string;
  name: string;
  profile_image_url: string | null;
  last_login_at: string;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: number | null;
};

export type UpsertUserInput = {
  email: string;
  name: string;
  profileImageUrl?: string | undefined;
  googleAccessToken?: string | undefined;
  googleRefreshToken?: string | undefined;
  googleTokenExpiry?: number | undefined;
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

    // Preserve refresh token if not provided in update (Google OAuth only returns it on first consent)
    const existingRow = existing ? (this.database.prepare('SELECT * FROM users WHERE id = ?').get(existing.id) as UserRow | undefined) : null;
    const finalRefreshToken = input.googleRefreshToken ?? existingRow?.google_refresh_token ?? null;

    this.database
      .prepare(
        `
        INSERT INTO users (
          id, email, name, profile_image_url, last_login_at,
          google_access_token, google_refresh_token, google_token_expiry,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          profile_image_url = excluded.profile_image_url,
          last_login_at = excluded.last_login_at,
          google_access_token = COALESCE(excluded.google_access_token, users.google_access_token),
          google_refresh_token = COALESCE(excluded.google_refresh_token, users.google_refresh_token),
          google_token_expiry = COALESCE(excluded.google_token_expiry, users.google_token_expiry),
          updated_at = excluded.updated_at
      `,
      )
      .run(
        id,
        input.email,
        input.name,
        input.profileImageUrl ?? null,
        now,
        input.googleAccessToken ?? null,
        finalRefreshToken,
        input.googleTokenExpiry ?? null,
        now,
        now,
      );

    return (
      this.findByEmail(input.email) ?? {
        id,
        email: input.email,
        name: input.name,
        ...(input.profileImageUrl ? { profileImageUrl: input.profileImageUrl } : {}),
        lastLoginAt: now,
        googleAccessToken: input.googleAccessToken,
        googleRefreshToken: finalRefreshToken ?? undefined,
        googleTokenExpiry: input.googleTokenExpiry,
      }
    );
  }

  updateGoogleTokens(id: string, accessToken: string, tokenExpiry: number): void {
    const now = new Date().toISOString();
    this.database
      .prepare(
        `
        UPDATE users
        SET
          google_access_token = ?,
          google_token_expiry = ?,
          updated_at = ?
        WHERE id = ?
      `,
      )
      .run(accessToken, tokenExpiry, now, id);
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
    ...(row.google_access_token ? { googleAccessToken: row.google_access_token } : {}),
    ...(row.google_refresh_token ? { googleRefreshToken: row.google_refresh_token } : {}),
    ...(row.google_token_expiry ? { googleTokenExpiry: row.google_token_expiry } : {}),
  };
}
