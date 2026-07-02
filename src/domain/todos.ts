import type { ISODateTime, OwnedEntity } from './common.js';

export type TodoPriority = 'low' | 'normal' | 'high';

export type TodoItem = OwnedEntity & {
  title: string;
  description?: string;
  dueAt?: ISODateTime;
  completed: boolean;
  priority: TodoPriority;
};

export type CreateTodoInput = {
  title: string;
  description?: string | undefined;
  dueAt?: ISODateTime | undefined;
  priority?: TodoPriority | undefined;
};

export type UpdateTodoInput = {
  title?: string | undefined;
  description?: string | undefined;
  dueAt?: ISODateTime | undefined;
  priority?: TodoPriority | undefined;
};
