import { randomUUID } from 'node:crypto';

import type { AppConfig } from '../config/env.js';

export type GoogleUserInfo = {
  email: string;
  name: string;
  picture?: string | undefined;
};

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export type GoogleOAuthExchangeResult = {
  userInfo: GoogleUserInfo;
  accessToken: string;
  refreshToken?: string | undefined;
  expiresIn: number;
};

export class GoogleOAuthService {
  constructor(private readonly config: AppConfig) {}

  isConfigured(): boolean {
    return Boolean(this.config.googleClientId && this.config.googleClientSecret);
  }

  buildAuthorizationUrl(): { url: string; state: string } {
    if (!this.config.googleClientId) {
      throw new Error('Google OAuth client id is not configured.');
    }

    const state = randomUUID();
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', this.config.googleClientId);
    url.searchParams.set('redirect_uri', this.config.googleCallbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set(
      'scope',
      'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts',
    );
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);

    return {
      url: url.toString(),
      state,
    };
  }

  async exchangeCodeForUser(code: string): Promise<GoogleOAuthExchangeResult> {
    if (!this.config.googleClientId || !this.config.googleClientSecret) {
      throw new Error('Google OAuth is not configured.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.googleClientId,
        client_secret: this.config.googleClientSecret,
        redirect_uri: this.config.googleCallbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new Error(`Failed to exchange Google OAuth code. Response: ${errorBody}`);
    }

    const token = (await tokenResponse.json()) as GoogleTokenResponse;
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        authorization: `Bearer ${token.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch Google user info.');
    }

    const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
    return {
      userInfo,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    if (!this.config.googleClientId || !this.config.googleClientSecret) {
      throw new Error('Google OAuth is not configured.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.googleClientId,
        client_secret: this.config.googleClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google OAuth token.');
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }
}
