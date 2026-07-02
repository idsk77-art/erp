import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getUserIdFromRequest } from '../request-context.js';
import type { TodoRepository, UserRepository } from '../../storage/repositories/index.js';

const CreateTodoSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  dueAt: z.string().datetime().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

const CompleteTodoSchema = z.object({
  completed: z.boolean(),
});
const UpdateTodoSchema = CreateTodoSchema.partial();
const ParamsSchema = z.object({ id: z.string().min(1) });

type TodoRoutesOptions = {
  todos: TodoRepository;
  users: UserRepository;
};

export async function registerTodoRoutes(
  server: FastifyInstance,
  options: TodoRoutesOptions,
): Promise<void> {
  server.get('/api/todos', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    options.users.ensureLocalUser(userId);

    return {
      items: options.todos.listByUserId(userId),
    };
  });

  server.post('/api/todos', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const body = CreateTodoSchema.parse(request.body);
    options.users.ensureLocalUser(userId);

    return reply.code(201).send({
      item: options.todos.create(userId, body),
    });
  });

  server.get('/api/todos/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);
    const item = options.todos.findById(userId, params.id);

    if (!item) {
      return reply.code(404).send({ message: 'Todo item was not found.' });
    }

    return { item };
  });

  server.patch('/api/todos/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    const body = UpdateTodoSchema.parse(request.body);
    options.users.ensureLocalUser(userId);
    const item = options.todos.update(userId, params.id, body);

    if (!item) {
      return reply.code(404).send({ message: 'Todo item was not found.' });
    }

    return { item };
  });

  server.patch('/api/todos/:id/completion', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    const body = CompleteTodoSchema.parse(request.body);
    options.users.ensureLocalUser(userId);

    const item = options.todos.setCompleted(userId, params.id, body.completed);

    if (!item) {
      return reply.code(404).send({ message: 'Todo item was not found.' });
    }

    return { item };
  });

  server.delete('/api/todos/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);

    if (!options.todos.delete(userId, params.id)) {
      return reply.code(404).send({ message: 'Todo item was not found.' });
    }

    return reply.code(204).send();
  });
}
