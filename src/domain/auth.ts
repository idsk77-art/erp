import type { EntityId, ISODateTime } from './common.js';

export type UserProfile = {
  id: EntityId;
  email: string;
  name: string;
  profileImageUrl?: string | undefined;
  lastLoginAt: ISODateTime;
  googleAccessToken?: string | undefined;
  googleRefreshToken?: string | undefined;
  googleTokenExpiry?: number | undefined;
};
