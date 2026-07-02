import { randomUUID } from 'node:crypto';

import type { CreateTodoInput, TodoItem, UpdateTodoInput } from '../../domain/index.js';
import type { Database } from '../database.js';

type TodoRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  completed: number;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  updated_at: string;
};

export class TodoRepository {
  constructor(private readonly database: Database) {}

  listByUserId(userId: string): TodoItem[] {
    const rows = this.database
      .prepare(
        `
        SELECT * FROM todo_items
        WHERE user_id = ?
        ORDER BY completed ASC, due_at ASC, created_at DESC
      `,
      )
      .all(userId) as TodoRow[];

    return rows.map(toTodoItem);
  }

  create(userId: string, input: CreateTodoInput): TodoItem {
    const now = new Date().toISOString();
    const todo: TodoItem = {
      id: randomUUID(),
      userId,
      title: input.title,
      completed: false,
      priority: input.priority ?? 'normal',
      createdAt: now,
      updatedAt: now,
      ...(input.description ? { description: input.description } : {}),
      ...(input.dueAt ? { dueAt: input.dueAt } : {}),
    };

    this.database
      .prepare(
        `
        INSERT INTO todo_items (
          id, user_id, title, description, due_at, completed, priority, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        todo.id,
        todo.userId,
        todo.title,
        todo.description ?? null,
        todo.dueAt ?? null,
        todo.completed ? 1 : 0,
        todo.priority,
        todo.createdAt,
        todo.updatedAt,
      );

    return todo;
  }

  setCompleted(userId: string, todoId: string, completed: boolean): TodoItem | null {
    const updatedAt = new Date().toISOString();

    this.database
      .prepare(
        `
        UPDATE todo_items
        SET completed = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `,
      )
      .run(completed ? 1 : 0, updatedAt, todoId, userId);

    return this.findById(userId, todoId);
  }

  update(userId: string, todoId: string, input: UpdateTodoInput): TodoItem | null {
    const existing = this.findById(userId, todoId);

    if (!existing) {
      return null;
    }

    const updated = {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description ?? null,
      dueAt: input.dueAt ?? existing.dueAt ?? null,
      priority: input.priority ?? existing.priority,
      updatedAt: new Date().toISOString(),
    };

    this.database
      .prepare(
        `
        UPDATE todo_items
        SET title = ?, description = ?, due_at = ?, priority = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `,
      )
      .run(
        updated.title,
        updated.description,
        updated.dueAt,
        updated.priority,
        updated.updatedAt,
        todoId,
        userId,
      );

    return this.findById(userId, todoId);
  }

  delete(userId: string, todoId: string): boolean {
    const result = this.database
      .prepare('DELETE FROM todo_items WHERE id = ? AND user_id = ?')
      .run(todoId, userId);

    return result.changes > 0;
  }

  findById(userId: string, todoId: string): TodoItem | null {
    const row = this.database
      .prepare('SELECT * FROM todo_items WHERE id = ? AND user_id = ?')
      .get(todoId, userId) as TodoRow | undefined;

    return row ? toTodoItem(row) : null;
  }
}

function toTodoItem(row: TodoRow): TodoItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    completed: row.completed === 1,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.description ? { description: row.description } : {}),
    ...(row.due_at ? { dueAt: row.due_at } : {}),
  };
}
