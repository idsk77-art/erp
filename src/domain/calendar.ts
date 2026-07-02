import type { ISODateTime, OwnedEntity } from './common.js';

export type CalendarEvent = OwnedEntity & {
  title: string;
  description?: string;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  location?: string;
  googleEventId?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  description?: string | undefined;
  location?: string | undefined;
};

export type UpdateCalendarEventInput = {
  title?: string | undefined;
  startsAt?: ISODateTime | undefined;
  endsAt?: ISODateTime | undefined;
  description?: string | undefined;
  location?: string | undefined;
};
