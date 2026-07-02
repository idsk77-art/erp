import type { EntityId, ISODateTime } from './common.js';

export type UserProfile = {
  id: EntityId;
  email: string;
  name: string;
  profileImageUrl?: string;
  lastLoginAt: ISODateTime;
};
