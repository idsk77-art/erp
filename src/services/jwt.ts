import { createHmac, timingSafeEqual } from 'node:crypto';

// Use env secret or fallback to secure random/static secret
const JWT_SECRET = process.env.JWT_SECRET || 'nano-erp-development-super-secret-key-change-in-prod';

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str) : str;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signJwt(payload: Record<string, any>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64UrlEncode(signature);
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export function verifyJwt(token: string): Record<string, any> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  const expectedSignature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  // base64url decoding the signature
  let base64Sig = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
  while (base64Sig.length % 4) {
    base64Sig += '=';
  }
  const decodedSignature = Buffer.from(base64Sig, 'base64');

  if (expectedSignature.length !== decodedSignature.length) return null;
  if (!timingSafeEqual(expectedSignature, decodedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    return payload;
  } catch {
    return null;
  }
}
