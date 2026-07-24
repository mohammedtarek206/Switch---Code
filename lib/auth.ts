import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface TokenPayload {
  userId: string;
  role: string;
  email?: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
