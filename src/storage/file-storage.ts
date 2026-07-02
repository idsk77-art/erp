import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

import type { AppConfig } from '../config/env.js';

export type StoredFile = {
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
};

export class LocalFileStorage {
  private readonly uploadRoot: string;

  constructor(config: AppConfig) {
    this.uploadRoot = resolve(config.uploadDir);
    mkdirSync(this.uploadRoot, { recursive: true });
  }

  async saveBuffer(
    namespace: 'business-cards' | 'documents' | 'audio',
    originalName: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<StoredFile> {
    const safeExtension = extname(originalName).toLowerCase();
    const fileName = `${randomUUID()}${safeExtension}`;
    const directory = join(this.uploadRoot, namespace);
    const absolutePath = join(directory, fileName);

    mkdirSync(directory, { recursive: true });
    await writeFile(absolutePath, buffer);

    return {
      originalName,
      fileName,
      filePath: join(namespace, fileName).replaceAll('\\', '/'),
      mimeType,
      size: buffer.byteLength,
    };
  }
}
