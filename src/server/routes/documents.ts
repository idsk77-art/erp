import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type {
  ScannedDocumentRepository,
  UserRepository,
} from '../../storage/repositories/index.js';
import { getUserIdFromRequest } from '../request-context.js';

const CreateScannedDocumentSchema = z.object({
  title: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
  fileType: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).default([]),
  description: z.string().trim().min(1).optional(),
});
const UpdateScannedDocumentSchema = CreateScannedDocumentSchema.pick({
  title: true,
  tags: true,
  description: true,
}).partial();
const ParamsSchema = z.object({ id: z.string().min(1) });

type DocumentRoutesOptions = {
  documents: ScannedDocumentRepository;
  users: UserRepository;
};

export async function registerDocumentRoutes(
  server: FastifyInstance,
  options: DocumentRoutesOptions,
): Promise<void> {
  server.get('/api/documents', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    options.users.ensureLocalUser(userId);

    return {
      items: options.documents.listByUserId(userId),
    };
  });

  server.post('/api/documents/scan', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const body = CreateScannedDocumentSchema.parse(request.body);
    options.users.ensureLocalUser(userId);

    return reply.code(201).send({
      item: options.documents.create(userId, body),
    });
  });

  server.get('/api/documents/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);
    const item = options.documents.findById(userId, params.id);

    if (!item) {
      return reply.code(404).send({ message: 'Document was not found.' });
    }

    return { item };
  });

  server.patch('/api/documents/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    const body = UpdateScannedDocumentSchema.parse(request.body);
    options.users.ensureLocalUser(userId);
    const item = options.documents.update(userId, params.id, body);

    if (!item) {
      return reply.code(404).send({ message: 'Document was not found.' });
    }

    return { item };
  });

  server.delete('/api/documents/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);

    if (!options.documents.delete(userId, params.id)) {
      return reply.code(404).send({ message: 'Document was not found.' });
    }

    return reply.code(204).send();
  });
}
