import type { UserProfile } from '../domain/auth.js';
import type { CalendarEvent } from '../domain/calendar.js';
import type { Contact } from '../domain/contacts.js';
import type { UserRepository } from '../storage/repositories/users.js';
import type { GoogleOAuthService } from './google-oauth.js';

export class GoogleApiService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly googleOAuth: GoogleOAuthService,
  ) {}

  private async getValidAccessToken(userId: string): Promise<string | null> {
    const user = this.usersRepository.findById(userId);
    if (!user || !user.googleAccessToken) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    // If token is expired or expires in less than 60 seconds, refresh it
    if (user.googleTokenExpiry && user.googleTokenExpiry - now < 60) {
      if (!user.googleRefreshToken) {
        console.warn(`Access token expired for user ${userId} but no refresh token is present.`);
        return null;
      }

      try {
        console.log(`Refreshing expired Google token for user ${userId}`);
        const refreshed = await this.googleOAuth.refreshAccessToken(user.googleRefreshToken);
        const newExpiry = Math.floor(Date.now() / 1000) + refreshed.expiresIn;
        this.usersRepository.updateGoogleTokens(userId, refreshed.accessToken, newExpiry);
        return refreshed.accessToken;
      } catch (err) {
        console.error(`Failed to refresh Google token for user ${userId}:`, err);
        return null;
      }
    }

    return user.googleAccessToken;
  }

  // --- Google Calendar Sync ---

  async createCalendarEvent(userId: string, event: CreateCalendarEventParams): Promise<string | null> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) return null;

    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.title,
            description: event.description || '',
            location: event.location || '',
            start: {
              dateTime: event.startsAt,
            },
            end: {
              dateTime: event.endsAt,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create Google Calendar event:', errorText);
        return null;
      }

      const data = (await response.json()) as { id: string };
      return data.id;
    } catch (err) {
      console.error('Error creating Google Calendar event:', err);
      return null;
    }
  }

  async deleteCalendarEvent(userId: string, googleEventId: string): Promise<boolean> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('Failed to delete Google Calendar event:', errorText);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error deleting Google Calendar event:', err);
      return false;
    }
  }

  // --- Google Contacts Sync (People API) ---

  async createContact(userId: string, contact: CreateContactParams): Promise<string | null> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) return null;

    try {
      const response = await fetch(
        'https://people.googleapis.com/v1/people:createContact',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            names: [
              {
                givenName: contact.name,
              },
            ],
            organizations: contact.companyName || contact.jobTitle ? [
              {
                name: contact.companyName || '',
                title: contact.jobTitle || '',
              },
            ] : undefined,
            phoneNumbers: contact.phoneNumber ? [
              {
                value: contact.phoneNumber,
                type: 'mobile',
              },
            ] : undefined,
            emails: contact.email ? [
              {
                value: contact.email,
                type: 'work',
              },
            ] : undefined,
            biographies: contact.memo ? [
              {
                value: contact.memo,
              },
            ] : undefined,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create Google Contact:', errorText);
        return null;
      }

      const data = (await response.json()) as { resourceName: string };
      return data.resourceName; // e.g. "people/c123456789"
    } catch (err) {
      console.error('Error creating Google Contact:', err);
      return null;
    }
  }

  async deleteContact(userId: string, googleResourceName: string): Promise<boolean> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) return false;

    try {
      const response = await fetch(
        `https://people.googleapis.com/v1/${googleResourceName}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('Failed to delete Google Contact:', errorText);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error deleting Google Contact:', err);
      return false;
    }
  }
}

type CreateCalendarEventParams = {
  title: string;
  description?: string | undefined;
  startsAt: string;
  endsAt: string;
  location?: string | undefined;
};

type CreateContactParams = {
  name: string;
  companyName?: string | undefined;
  jobTitle?: string | undefined;
  phoneNumber?: string | undefined;
  email?: string | undefined;
  memo?: string | undefined;
};
