import { randomUUID } from 'node:crypto';

import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '../../domain/index.js';
import type { Database } from '../database.js';

type CalendarEventRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  created_at: string;
  updated_at: string;
};

export class CalendarEventRepository {
  constructor(private readonly database: Database) {}

  listByUserId(userId: string): CalendarEvent[] {
    const rows = this.database
      .prepare(
        `
        SELECT * FROM calendar_events
        WHERE user_id = ?
        ORDER BY starts_at ASC
      `,
      )
      .all(userId) as CalendarEventRow[];

    return rows.map(toCalendarEvent);
  }

  create(userId: string, input: CreateCalendarEventInput): CalendarEvent {
    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id: randomUUID(),
      userId,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdAt: now,
      updatedAt: now,
      ...(input.description ? { description: input.description } : {}),
      ...(input.location ? { location: input.location } : {}),
    };

    this.database
      .prepare(
        `
        INSERT INTO calendar_events (
          id, user_id, title, description, starts_at, ends_at, location, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        event.id,
        event.userId,
        event.title,
        event.description ?? null,
        event.startsAt,
        event.endsAt,
        event.location ?? null,
        event.createdAt,
        event.updatedAt,
      );

    return event;
  }

  findById(userId: string, eventId: string): CalendarEvent | null {
    const row = this.database
      .prepare('SELECT * FROM calendar_events WHERE id = ? AND user_id = ?')
      .get(eventId, userId) as CalendarEventRow | undefined;

    return row ? toCalendarEvent(row) : null;
  }

  update(userId: string, eventId: string, input: UpdateCalendarEventInput): CalendarEvent | null {
    const existing = this.findById(userId, eventId);

    if (!existing) {
      return null;
    }

    const updated = {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description ?? null,
      startsAt: input.startsAt ?? existing.startsAt,
      endsAt: input.endsAt ?? existing.endsAt,
      location: input.location ?? existing.location ?? null,
      updatedAt: new Date().toISOString(),
    };

    this.database
      .prepare(
        `
        UPDATE calendar_events
        SET title = ?, description = ?, starts_at = ?, ends_at = ?, location = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `,
      )
      .run(
        updated.title,
        updated.description,
        updated.startsAt,
        updated.endsAt,
        updated.location,
        updated.updatedAt,
        eventId,
        userId,
      );

    return this.findById(userId, eventId);
  }

  delete(userId: string, eventId: string): boolean {
    const result = this.database
      .prepare('DELETE FROM calendar_events WHERE id = ? AND user_id = ?')
      .run(eventId, userId);

    return result.changes > 0;
  }
}

function toCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.description ? { description: row.description } : {}),
    ...(row.location ? { location: row.location } : {}),
  };
}
