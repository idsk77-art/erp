import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { resolve } from 'node:path';
import { ZodError } from 'zod';

import type { AppConfig } from '../config/env.js';
import { GoogleOAuthService } from '../services/google-oauth.js';
import { BusinessCardOcrService } from '../services/ocr.js';
import { SpeechToTextService } from '../services/stt.js';
import {
  AudioReportRepository,
  CalendarEventRepository,
  ContactRepository,
  LocalFileStorage,
  openDatabase,
  runMigrations,
  ScannedDocumentRepository,
  TodoRepository,
  UserRepository,
} from '../storage/index.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCalendarEventRoutes } from './routes/calendar-events.js';
import { registerContactRoutes } from './routes/contacts.js';
import { registerDocumentRoutes } from './routes/documents.js';
import { registerReportRoutes } from './routes/reports.js';
import { registerTodoRoutes } from './routes/todos.js';
import { registerUploadRoutes } from './routes/uploads.js';

export async function buildServer(config: AppConfig): Promise<FastifyInstance> {
  const database = openDatabase(config);
  runMigrations(database);

  const users = new UserRepository(database);
  const todos = new TodoRepository(database);
  const calendarEvents = new CalendarEventRepository(database);
  const contacts = new ContactRepository(database);
  const documents = new ScannedDocumentRepository(database);
  const reports = new AudioReportRepository(database);
  const fileStorage = new LocalFileStorage(config);
  const googleOAuth = new GoogleOAuthService(config);
  const ocr = new BusinessCardOcrService(config);
  const stt = new SpeechToTextService(reports, config);

  const server = Fastify({
    logger: config.env !== 'test',
  });

  await server.register(cors, {
    origin: true,
  });
  await server.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024,
      files: 1,
    },
  });
  await server.register(fastifyStatic, {
    root: resolve('public'),
  });

  server.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: 'Invalid request payload.',
        issues: error.issues,
      });
    }

    server.log.error(error);

    const err = error as any;
    return reply.code(500).send({
      message: 'Internal server error.',
      error: err.message,
      stack: err.stack,
    });
  });

  server.get('/health', async () => ({
    service: 'ruah-note',
    status: 'ok',
    environment: config.env,
  }));

  await registerAuthRoutes(server, { googleOAuth, users });
  await registerTodoRoutes(server, { todos, users });
  await registerCalendarEventRoutes(server, { calendarEvents, users });
  await registerContactRoutes(server, { contacts, users });
  await registerDocumentRoutes(server, { documents, users });
  await registerReportRoutes(server, { reports, users });
  await registerUploadRoutes(server, {
    documents,
    fileStorage,
    reports,
    users,
    ocr,
    stt,
  });

  server.addHook('onClose', async () => {
    database.close();
  });

  return server;
}

