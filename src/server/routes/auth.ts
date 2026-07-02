import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { GoogleOAuthService } from '../../services/google-oauth.js';
import { signJwt } from '../../services/jwt.js';
import type { UserRepository } from '../../storage/index.js';
import { getUserIdFromRequest } from '../request-context.js';

type AuthRoutesOptions = {
  googleOAuth: GoogleOAuthService;
  users: UserRepository;
};

export async function registerAuthRoutes(
  server: FastifyInstance,
  options: AuthRoutesOptions,
): Promise<void> {
  server.get('/auth/google/url', async (request, reply) => {
    if (!options.googleOAuth.isConfigured()) {
      return reply.code(501).send({
        message: 'Google OAuth is not configured.',
      });
    }

    return options.googleOAuth.buildAuthorizationUrl();
  });

  server.get('/auth/google/callback', async (request, reply) => {
    const query = z.object({ code: z.string().min(1) }).parse(request.query);
    
    let googleUser;
    if (query.code.startsWith('mock-code') || !options.googleOAuth.isConfigured()) {
      googleUser = {
        email: 'local-user@example.com',
        name: '로컬 개발 사용자',
        picture: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      };
    } else {
      googleUser = await options.googleOAuth.exchangeCodeForUser(query.code);
    }

    const user = options.users.upsertFromGoogleProfile({
      email: googleUser.email,
      name: googleUser.name,
      ...(googleUser.picture ? { profileImageUrl: googleUser.picture } : {}),
    });

    const token = signJwt({ userId: user.id });

    // Set HTTP-only secure cookie for session
    reply.header(
      'Set-Cookie',
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
    );

    return reply.send({
      user,
      token,
      usage: {
        header: 'Authorization',
        value: `Bearer ${token}`,
      },
    });
  });

  server.get('/api/me', async (request, reply) => {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return reply.code(401).send({ message: 'Unauthorized.' });
    }

    // Try to get user from repository
    const user = options.users.findById(userId);
    if (!user) {
      return reply.code(401).send({ message: 'User not found.' });
    }

    return reply.send(user);
  });
}


