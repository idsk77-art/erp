import type { OwnedEntity } from './common.js';

export type ScannedDocument = OwnedEntity & {
  title: string;
  filePath: string;
  fileType: string;
  tags: string[];
  description?: string;
};
