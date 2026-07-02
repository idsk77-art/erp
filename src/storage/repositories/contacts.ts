import { randomUUID } from 'node:crypto';

import type { Contact } from '../../domain/index.js';
import type { Database } from '../database.js';

type ContactRow = {
  id: string;
  user_id: string;
  name: string;
  company_name: string | null;
  job_title: string | null;
  phone_number: string | null;
  email: string | null;
  memo: string | null;
  business_card_image_path: string | null;
  google_resource_name: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateContactInput = {
  name: string;
  companyName?: string | undefined;
  jobTitle?: string | undefined;
  phoneNumber?: string | undefined;
  email?: string | undefined;
  memo?: string | undefined;
  businessCardImagePath?: string | undefined;
  googleResourceName?: string | undefined;
};

export type UpdateContactInput = {
  name?: string | undefined;
  companyName?: string | undefined;
  jobTitle?: string | undefined;
  phoneNumber?: string | undefined;
  email?: string | undefined;
  memo?: string | undefined;
  businessCardImagePath?: string | undefined;
  googleResourceName?: string | undefined;
};

export class ContactRepository {
  constructor(private readonly database: Database) {}

  listByUserId(userId: string): Contact[] {
    const rows = this.database
      .prepare(
        `
        SELECT * FROM contacts
        WHERE user_id = ?
        ORDER BY name ASC, created_at DESC
      `,
      )
      .all(userId) as ContactRow[];

    return rows.map(toContact);
  }

  create(userId: string, input: CreateContactInput): Contact {
    const now = new Date().toISOString();
    const contact: Contact = {
      id: randomUUID(),
      userId,
      name: input.name,
      createdAt: now,
      updatedAt: now,
      ...(input.companyName ? { companyName: input.companyName } : {}),
      ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
      ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.memo ? { memo: input.memo } : {}),
      ...(input.businessCardImagePath
        ? { businessCardImagePath: input.businessCardImagePath }
        : {}),
      ...(input.googleResourceName ? { googleResourceName: input.googleResourceName } : {}),
    };

    this.database
      .prepare(
        `
        INSERT INTO contacts (
          id, user_id, name, company_name, job_title, phone_number, email, memo,
          business_card_image_path, google_resource_name, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        contact.id,
        contact.userId,
        contact.name,
        contact.companyName ?? null,
        contact.jobTitle ?? null,
        contact.phoneNumber ?? null,
        contact.email ?? null,
        contact.memo ?? null,
        contact.businessCardImagePath ?? null,
        contact.googleResourceName ?? null,
        contact.createdAt,
        contact.updatedAt,
      );

    return contact;
  }

  findById(userId: string, contactId: string): Contact | null {
    const row = this.database
      .prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?')
      .get(contactId, userId) as ContactRow | undefined;

    return row ? toContact(row) : null;
  }

  update(userId: string, contactId: string, input: UpdateContactInput): Contact | null {
    const existing = this.findById(userId, contactId);

    if (!existing) {
      return null;
    }

    const updated = {
      name: input.name ?? existing.name,
      companyName: input.companyName ?? existing.companyName ?? null,
      jobTitle: input.jobTitle ?? existing.jobTitle ?? null,
      phoneNumber: input.phoneNumber ?? existing.phoneNumber ?? null,
      email: input.email ?? existing.email ?? null,
      memo: input.memo ?? existing.memo ?? null,
      businessCardImagePath: input.businessCardImagePath ?? existing.businessCardImagePath ?? null,
      googleResourceName: input.googleResourceName ?? existing.googleResourceName ?? null,
      updatedAt: new Date().toISOString(),
    };

    this.database
      .prepare(
        `
        UPDATE contacts
        SET name = ?, company_name = ?, job_title = ?, phone_number = ?, email = ?,
            memo = ?, business_card_image_path = ?, google_resource_name = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `,
      )
      .run(
        updated.name,
        updated.companyName,
        updated.jobTitle,
        updated.phoneNumber,
        updated.email,
        updated.memo,
        updated.businessCardImagePath,
        updated.googleResourceName,
        updated.updatedAt,
        contactId,
        userId,
      );

    return this.findById(userId, contactId);
  }

  delete(userId: string, contactId: string): boolean {
    const result = this.database
      .prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?')
      .run(contactId, userId);

    return result.changes > 0;
  }
}

function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.company_name ? { companyName: row.company_name } : {}),
    ...(row.job_title ? { jobTitle: row.job_title } : {}),
    ...(row.phone_number ? { phoneNumber: row.phone_number } : {}),
    ...(row.email ? { email: row.email } : {}),
    ...(row.memo ? { memo: row.memo } : {}),
    ...(row.business_card_image_path
      ? { businessCardImagePath: row.business_card_image_path }
      : {}),
    ...(row.google_resource_name ? { googleResourceName: row.google_resource_name } : {}),
  };
}
