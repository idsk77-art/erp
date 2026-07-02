import type { OwnedEntity } from './common.js';

export type ReportConversionStatus = 'queued' | 'processing' | 'done' | 'failed';

export type AudioReport = OwnedEntity & {
  audioFilePath: string;
  status: ReportConversionStatus;
  transcript?: string;
  title?: string;
  summary?: string;
};
