import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const AUTH_COOKIE_NAME = 'sc_token';

export interface TokenPayload {
  userId: string;
  role: string;
  roles?: string[];
  email?: string;
  username?: string;
  committeeId?: string;
  teamId?: string;
  position?: string;
  permissions?: string[];
  accountStatus?: string;
  canPublishDirectly?: boolean;
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
  } catch {
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
    const bearer = authHeader.substring(7).trim();
    if (bearer && bearer !== 'null' && bearer !== 'undefined') {
      return bearer;
    }
  }
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  return null;
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function authenticateRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;

  try {
    await connectDB();
    const dbUser = await User.findById(payload.userId)
      .select('role roles email username committeeId teamId position permissions isActive accountStatus canPublishDirectly')
      .lean() as {
        _id: unknown;
        role?: string;
        roles?: string[];
        email?: string;
        username?: string;
        committeeId?: { toString(): string };
        teamId?: { toString(): string };
        position?: string;
        permissions?: string[];
        isActive?: boolean;
        accountStatus?: string;
        canPublishDirectly?: boolean;
      } | null;

    if (!dbUser) return null;
    if (dbUser.isActive === false) return null;
    if (dbUser.accountStatus === 'suspended' || dbUser.accountStatus === 'rejected') {
      return null;
    }

    const primaryRole = dbUser.role || payload.role;
    const roles = Array.isArray(dbUser.roles) && dbUser.roles.length > 0
      ? Array.from(new Set([primaryRole, ...dbUser.roles]))
      : [primaryRole];

    return {
      userId: payload.userId,
      role: primaryRole,
      roles,
      email: dbUser.email || payload.email,
      username: dbUser.username || payload.username,
      committeeId: dbUser.committeeId?.toString() || payload.committeeId,
      teamId: dbUser.teamId?.toString() || payload.teamId,
      position: dbUser.position || payload.position,
      permissions: dbUser.permissions || [],
      accountStatus: dbUser.accountStatus || 'active',
      canPublishDirectly: Boolean(dbUser.canPublishDirectly),
    };
  } catch {
    return payload;
  }
}

export function isLMSAdmin(role?: string, roles?: string[]): boolean {
  const all = [role, ...(roles || [])].filter(Boolean) as string[];
  const ALLOWED_ROLES = [
    'admin', 'super_admin', 'superadmin', 'president', 'vice_president',
    'instructor', 'mentor',
  ];
  return all.some((r) =>
    ALLOWED_ROLES.includes(String(r).toLowerCase().trim().replace(/[\s_-]+/g, '_'))
  );
}
