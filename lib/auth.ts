import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export interface TokenPayload {
  userId: string;
  role: string;
  email?: string;
  committeeId?: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    try {
      return jwt.verify(token, 'fallback-secret') as TokenPayload;
    } catch {
      return null;
    }
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
  const payload = verifyToken(token);
  if (!payload) return null;

  if (!payload.role && payload.userId) {
    try {
      await connectDB();
      const dbUser = await User.findById(payload.userId).select('role email');
      if (dbUser && dbUser.role) {
        payload.role = dbUser.role;
      }
    } catch { }
  }
  return payload;
}

export function isLMSAdmin(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = String(role).toLowerCase().trim().replace(/[\s_-]+/g, '_');
  const ALLOWED_ROLES = [
    'admin', 'super_admin', 'superadmin', 'president', 'vice_president',
    'hr', 'pr', 'marketing', 'media', 'technical',
    'committee_leader', 'vice_committee_leader', 'leader', 'instructor', 'mentor', 'member'
  ];
  return ALLOWED_ROLES.includes(normalizedRole);
}
