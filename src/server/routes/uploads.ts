import type { FastifyInstance } from 'fastify';

import type {
  AudioReportRepository,
  ScannedDocumentRepository,
  UserRepository,
} from '../../storage/repositories/index.js';
import type { LocalFileStorage } from '../../storage/index.js';
import type { BusinessCardOcrService } from '../../services/ocr.js';
import type { SpeechToTextService } from '../../services/stt.js';
import { getUserIdFromRequest } from '../request-context.js';

type UploadRoutesOptions = {
  documents: ScannedDocumentRepository;
  fileStorage: LocalFileStorage;
  reports: AudioReportRepository;
  users: UserRepository;
  ocr: BusinessCardOcrService;
  stt: SpeechToTextService;
};

export async function registerUploadRoutes(
  server: FastifyInstance,
  options: UploadRoutesOptions,
): Promise<void> {
  server.post('/api/uploads/business-card', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const file = await request.file();

    if (!file) {
      return reply.code(400).send({ message: 'A multipart file is required.' });
    }

    const buffer = await file.toBuffer();
    const storedFile = await options.fileStorage.saveBuffer(
      'business-cards',
      file.filename,
      file.mimetype,
      buffer,
    );
    options.users.ensureLocalUser(userId);

    const scanResult = await options.ocr.scanBusinessCard(storedFile.filePath, file.filename);

    return reply.code(201).send({
      file: storedFile,
      scan: {
        status: 'done',
        result: scanResult,
      },
    });
  });

  server.post('/api/uploads/document', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const file = await request.file();

    if (!file) {
      return reply.code(400).send({ message: 'A multipart file is required.' });
    }

    const buffer = await file.toBuffer();
    const storedFile = await options.fileStorage.saveBuffer(
      'documents',
      file.filename,
      file.mimetype,
      buffer,
    );
    options.users.ensureLocalUser(userId);

    return reply.code(201).send({
      item: options.documents.create(userId, {
        title: file.filename,
        filePath: storedFile.filePath,
        fileType: storedFile.mimeType,
      }),
      file: storedFile,
    });
  });

  server.post('/api/uploads/audio', async (request, reply) => {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return reply.code(401).send({ message: 'x-user-id header is required.' });
    }

    const file = await request.file();

    if (!file) {
      return reply.code(400).send({ message: 'A multipart file is required.' });
    }

    const buffer = await file.toBuffer();
    const storedFile = await options.fileStorage.saveBuffer(
      'audio',
      file.filename,
      file.mimetype,
      buffer,
    );
    options.users.ensureLocalUser(userId);

    const report = options.reports.create(userId, {
      title: file.filename,
      audioFilePath: storedFile.filePath,
    });

    // Start async conversion process
    options.stt.transcribeAndGenerateReport(userId, report.id, file.filename, storedFile.filePath);

    return reply.code(201).send({
      item: report,
      file: storedFile,
    });
  });
}

