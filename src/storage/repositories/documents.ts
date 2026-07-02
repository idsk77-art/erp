import { randomUUID } from 'node:crypto';

import type { ScannedDocument } from '../../domain/index.js';
import type { Database } from '../database.js';

type ScannedDocumentRow = {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_type: string;
  tags_json: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateScannedDocumentInput = {
  title: string;
  filePath: string;
  fileType: string;
  tags?: string[] | undefined;
  description?: string | undefined;
};

export type UpdateScannedDocumentInput = {
  title?: string | undefined;
  tags?: string[] | undefined;
  description?: string | undefined;
};

export class ScannedDocumentRepository {
  constructor(private readonly database: Database) {}

  listByUserId(userId: string): ScannedDocument[] {
    const rows = this.database
      .prepare(
        `
        SELECT * FROM scanned_documents
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      )
      .all(userId) as ScannedDocumentRow[];

    return rows.map(toScannedDocument);
  }

  create(userId: string, input: CreateScannedDocumentInput): ScannedDocument {
    const now = new Date().toISOString();
    const document: ScannedDocument = {
      id: randomUUID(),
      userId,
      title: input.title,
      filePath: input.filePath,
      fileType: input.fileType,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
      ...(input.description ? { description: input.description } : {}),
    };

    this.database
      .prepare(
        `
        INSERT INTO scanned_documents (
          id, user_id, title, file_path, file_type, tags_json, description,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        document.id,
        document.userId,
        document.title,
        document.filePath,
        document.fileType,
        JSON.stringify(document.tags),
        document.description ?? null,
        document.createdAt,
        document.updatedAt,
      );

    return document;
  }

  findById(userId: string, documentId: string): ScannedDocument | null {
    const row = this.database
      .prepare('SELECT * FROM scanned_documents WHERE id = ? AND user_id = ?')
      .get(documentId, userId) as ScannedDocumentRow | undefined;

    return row ? toScannedDocument(row) : null;
  }

  update(
    userId: string,
    documentId: string,
    input: UpdateScannedDocumentInput,
  ): ScannedDocument | null {
    const existing = this.findById(userId, documentId);

    if (!existing) {
      return null;
    }

    const updated = {
      title: input.title ?? existing.title,
      tags: input.tags ?? existing.tags,
      description: input.description ?? existing.description ?? null,
      updatedAt: new Date().toISOString(),
    };

    this.database
      .prepare(
        `
        UPDATE scanned_documents
        SET title = ?, tags_json = ?, description = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `,
      )
      .run(
        updated.title,
        JSON.stringify(updated.tags),
        updated.description,
        updated.updatedAt,
        documentId,
        userId,
      );

    return this.findById(userId, documentId);
  }

  delete(userId: string, documentId: string): boolean {
    const result = this.database
      .prepare('DELETE FROM scanned_documents WHERE id = ? AND user_id = ?')
      .run(documentId, userId);

    return result.changes > 0;
  }
}

function toScannedDocument(row: ScannedDocumentRow): ScannedDocument {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    filePath: row.file_path,
    fileType: row.file_type,
    tags: parseTags(row.tags_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.description ? { description: row.description } : {}),
  };
}

function parseTags(value: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === 'string')
    : [];
}
