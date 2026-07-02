import type { OwnedEntity } from './common.js';

export type Contact = OwnedEntity & {
  name: string;
  companyName?: string;
  jobTitle?: string;
  phoneNumber?: string;
  email?: string;
  memo?: string;
  businessCardImagePath?: string;
};

export type BusinessCardScanResult = {
  name?: string;
  companyName?: string;
  jobTitle?: string;
  phoneNumber?: string;
  email?: string;
  rawText: string;
};
