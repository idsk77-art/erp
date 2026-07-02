import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AudioReportRepository, UserRepository } from '../../storage/repositories/index.js';
import { getUserIdFromRequest } from '../request-context.js';

const CreateAudioReportSchema = z.object({
  audioFilePath: z.string().trim().min(1),
  title: z.string().trim().min(1).optional(),
});
const UpdateAudioReportSchema = z.object({
  status: z.enum(['queued', 'processing', 'done', 'failed']).optional(),
  transcript: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  summary: z.string().trim().min(1).optional(),
});
const ParamsSchema = z.object({ id: z.string().min(1) });

type ReportRoutesOptions = {
  reports: AudioReportRepository;
  users: UserRepository;
};

export async function registerReportRoutes(
  server: FastifyInstance,
  options: ReportRoutesOptions,
): Promise<void> {
  server.get('/api/reports', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    options.users.ensureLocalUser(userId);

    return {
      items: options.reports.listByUserId(userId),
    };
  });

  server.post('/api/reports/audio', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const body = CreateAudioReportSchema.parse(request.body);
    options.users.ensureLocalUser(userId);

    return reply.code(201).send({
      item: options.reports.create(userId, body),
    });
  });

  server.get('/api/reports/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);
    const item = options.reports.findById(userId, params.id);

    if (!item) {
      return reply.code(404).send({ message: 'Report was not found.' });
    }

    return { item };
  });

  server.patch('/api/reports/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    const body = UpdateAudioReportSchema.parse(request.body);
    options.users.ensureLocalUser(userId);
    const item = options.reports.update(userId, params.id, body);

    if (!item) {
      return reply.code(404).send({ message: 'Report was not found.' });
    }

    return { item };
  });

  server.delete('/api/reports/:id', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const params = ParamsSchema.parse(request.params);
    options.users.ensureLocalUser(userId);

    if (!options.reports.delete(userId, params.id)) {
      return reply.code(404).send({ message: 'Report was not found.' });
    }

    return reply.code(204).send();
  });
}
