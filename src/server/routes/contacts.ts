import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { ContactRepository, UserRepository } from '../../storage/repositories/index.js';
import { getUserIdFromRequest } from '../request-context.js';

const CreateContactSchema = z.object({
  name: z.string().trim().min(1),
  companyName: z.string().trim().min(1).optional(),
  jobTitle: z.string().trim().min(1).optional(),
  phoneNumber: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  memo: z.string().trim().min(1).optional(),
  businessCardImagePath: z.string().trim().min(1).optional(),
});
const UpdateContactSchema = CreateContactSchema.partial();
const ParamsSchema = z.object({ id: z.string().min(1) });

type ContactRoutesOptions = {
  contacts: ContactRepository;
  users: UserRepository;
};

export async function registerContactRoutes(
  server: FastifyInstance,
  options: ContactRoutesOptions,
): Promise<void> {
  server.get('/api/contacts', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    options.users.ensureLocalUser(userId);

    return {
      items: options.contacts.listByUserId(userId),
    };
  });

  server.post('/api/contacts', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const body = CreateContactSchema.parse(request.body);
    options.users.ensureLocalUser(userId);

    return reply.code(201).send({
      item: options.contacts.create(userId, body),
    });
  });

  server.get('/api/contacts/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);
    const item = options.contacts.findById(userId, params.id);

    if (!item) {
      return reply.code(404).send({ message: 'Contact was not found.' });
    }

    return { item };
  });

  server.patch('/api/contacts/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    const body = UpdateContactSchema.parse(request.body);
    options.users.ensureLocalUser(userId);
    const item = options.contacts.update(userId, params.id, body);

    if (!item) {
      return reply.code(404).send({ message: 'Contact was not found.' });
    }

    return { item };
  });

  server.delete('/api/contacts/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);

    if (!options.contacts.delete(userId, params.id)) {
      return reply.code(404).send({ message: 'Contact was not found.' });
    }

    return reply.code(204).send();
  });

  server.post('/api/contacts/business-card-scan', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const body = CreateContactSchema.extend({
      rawText: z.string().trim().min(1).optional(),
    }).parse(request.body);
    options.users.ensureLocalUser(userId);

    return reply.code(201).send({
      item: options.contacts.create(userId, body),
      scan: {
        status: 'reviewed',
        rawText: body.rawText ?? '',
      },
    });
  });
}
