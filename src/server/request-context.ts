import type { FastifyRequest } from 'fastify';
import { verifyJwt } from '../services/jwt.js';

export function getUserIdFromRequest(request: FastifyRequest): string {
  // 1. Try to get token from Authorization header: Bearer <token>
  const authHeader = request.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyJwt(token);
    if (decoded && typeof decoded.userId === 'string') {
      return decoded.userId;
    }
  }

  // 2. Try to get token from Cookie if present (e.g. cookie name: token)
  const cookieHeader = request.headers['cookie'];
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((cookie) => {
        const [key, ...val] = cookie.trim().split('=');
        return [key, val.join('=')];
      }),
    );
    if (cookies.token) {
      const decoded = verifyJwt(cookies.token);
      if (decoded && typeof decoded.userId === 'string') {
        return decoded.userId;
      }
    }
  }

  // 3. Fallback to x-user-id header for development/legacy compatibility
  const userId = request.headers['x-user-id'];
  if (Array.isArray(userId)) {
    return userId[0] ?? '';
  }
  return userId ?? '';
}

