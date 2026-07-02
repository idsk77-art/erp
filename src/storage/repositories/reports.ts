import { randomUUID } from 'node:crypto';

import type { AudioReport, ReportConversionStatus } from '../../domain/index.js';
import type { Database } from '../database.js';

type AudioReportRow = {
  id: string;
  user_id: string;
  audio_file_path: string;
  status: ReportConversionStatus;
  transcript: string | null;
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAudioReportInput = {
  audioFilePath: string;
  title?: string | undefined;
};

export type UpdateAudioReportInput = {
  status?: ReportConversionStatus | undefined;
  transcript?: string | undefined;
  title?: string | undefined;
  summary?: string | undefined;
};

export class AudioReportRepository {
  constructor(private readonly database: Database) {}

  listByUserId(userId: string): AudioReport[] {
    const rows = this.database
      .prepare(
        `
        SELECT * FROM audio_reports
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      )
      .all(userId) as AudioReportRow[];

    return rows.map(toAudioReport);
  }

  create(userId: string, input: CreateAudioReportInput): AudioReport {
    const now = new Date().toISOString();
    const report: AudioReport = {
      id: randomUUID(),
      userId,
      audioFilePath: input.audioFilePath,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
      ...(input.title ? { title: input.title } : {}),
    };

    this.database
      .prepare(
        `
        INSERT INTO audio_reports (
          id, user_id, audio_file_path, status, transcript, title, summary,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        report.id,
        report.userId,
        report.audioFilePath,
        report.status,
        report.transcript ?? null,
        report.title ?? null,
        report.summary ?? null,
        report.createdAt,
        report.updatedAt,
      );

    return report;
  }

  findById(userId: string, reportId: string): AudioReport | null {
    const row = this.database
      .prepare('SELECT * FROM audio_reports WHERE id = ? AND user_id = ?')
      .get(reportId, userId) as AudioReportRow | undefined;

    return row ? toAudioReport(row) : null;
  }

  update(userId: string, reportId: string, input: UpdateAudioReportInput): AudioReport | null {
    const existing = this.findById(userId, reportId);

    if (!existing) {
      return null;
    }

    const updated = {
      status: input.status ?? existing.status,
      transcript: input.transcript ?? existing.transcript ?? null,
      title: input.title ?? existing.title ?? null,
      summary: input.summary ?? existing.summary ?? null,
      updatedAt: new Date().toISOString(),
    };

    this.database
      .prepare(
        `
        UPDATE audio_reports
        SET status = ?, transcript = ?, title = ?, summary = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `,
      )
      .run(
        updated.status,
        updated.transcript,
        updated.title,
        updated.summary,
        updated.updatedAt,
        reportId,
        userId,
      );

    return this.findById(userId, reportId);
  }

  delete(userId: string, reportId: string): boolean {
    const result = this.database
      .prepare('DELETE FROM audio_reports WHERE id = ? AND user_id = ?')
      .run(reportId, userId);

    return result.changes > 0;
  }
}

function toAudioReport(row: AudioReportRow): AudioReport {
  return {
    id: row.id,
    userId: row.user_id,
    audioFilePath: row.audio_file_path,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.transcript ? { transcript: row.transcript } : {}),
    ...(row.title ? { title: row.title } : {}),
    ...(row.summary ? { summary: row.summary } : {}),
  };
}
