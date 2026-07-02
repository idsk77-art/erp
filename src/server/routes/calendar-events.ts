import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getUserIdFromRequest } from '../request-context.js';
import type { CalendarEventRepository, UserRepository } from '../../storage/repositories/index.js';

const CreateCalendarEventSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().trim().min(1).optional(),
});
const UpdateCalendarEventSchema = CreateCalendarEventSchema.partial();
const ParamsSchema = z.object({ id: z.string().min(1) });

type CalendarEventRoutesOptions = {
  calendarEvents: CalendarEventRepository;
  users: UserRepository;
};

export async function registerCalendarEventRoutes(
  server: FastifyInstance,
  options: CalendarEventRoutesOptions,
): Promise<void> {
  server.get('/api/calendar/events', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    options.users.ensureLocalUser(userId);

    return {
      items: options.calendarEvents.listByUserId(userId),
    };
  });

  server.post('/api/calendar/events', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const body = CreateCalendarEventSchema.parse(request.body);
    options.users.ensureLocalUser(userId);

    return reply.code(201).send({
      item: options.calendarEvents.create(userId, body),
    });
  });

  server.get('/api/calendar/events/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);
    const item = options.calendarEvents.findById(userId, params.id);

    if (!item) {
      return reply.code(404).send({ message: 'Calendar event was not found.' });
    }

    return { item };
  });

  server.patch('/api/calendar/events/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    const body = UpdateCalendarEventSchema.parse(request.body);
    options.users.ensureLocalUser(userId);
    const item = options.calendarEvents.update(userId, params.id, body);

    if (!item) {
      return reply.code(404).send({ message: 'Calendar event was not found.' });
    }

    return { item };
  });

  server.delete('/api/calendar/events/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);

    if (!options.calendarEvents.delete(userId, params.id)) {
      return reply.code(404).send({ message: 'Calendar event was not found.' });
    }

    return reply.code(204).send();
  });
}
