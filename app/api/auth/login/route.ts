import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { getDashboardRouteForRole } from '@/lib/permissions';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const identifier = body.identifier || body.email || body.username;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required' }, { status: 400 });
    }

    const cleanIdentifier = String(identifier).trim();
    const cleanPassword = String(password).trim();

    await connectDB();

    const user = await User.findOne({
      $or: [
        { username: cleanIdentifier },
        { username: cleanIdentifier.toLowerCase() },
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier }
      ],
    }).populate('committeeId', 'name').populate('teamId', 'name');

    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
    }

    if (user.isActive === false || user.accountStatus === 'suspended') {
      return NextResponse.json({ error: 'تم إيقاف هذا الحساب. يرجى التواصل مع الإدارة.' }, { status: 403 });
    }

    if (user.accountStatus === 'rejected') {
      return NextResponse.json({ error: 'تم إغلاق هذا الحساب.' }, { status: 403 });
    }

    let isMatch = false;
    if (user.password) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    }
    if (!isMatch && user.tempPassword && cleanPassword === user.tempPassword) {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
    }

    // Automatically activate legacy pending accounts on successful login
    if (user.accountStatus === 'pending_review' || user.accountStatus === 'pending_verification') {
      user.accountStatus = 'active';
      user.isActive = true;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const roles = Array.isArray(user.roles) && user.roles.length > 0
      ? Array.from(new Set([user.role, ...user.roles]))
      : [user.role];

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      roles,
      committeeId: user.committeeId?._id?.toString() || user.committeeId?.toString(),
      teamId: user.teamId?._id?.toString() || user.teamId?.toString(),
      position: user.position,
      permissions: user.permissions || [],
      accountStatus: 'active',
      canPublishDirectly: Boolean(user.canPublishDirectly),
    });

    const dashboardRoute = getDashboardRouteForRole(user.role, roles);

    const response = NextResponse.json(
      {
        message: 'Login successful',
        token,
        mustChangePassword: !!user.mustChangePassword,
        dashboardRoute,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roles,
          accountType: user.accountType,
          accountStatus: 'active',
          permissions: user.permissions || [],
          committeeId: user.committeeId,
          teamId: user.teamId,
          position: user.position,
          avatar: user.avatar,
          canPublishDirectly: Boolean(user.canPublishDirectly),
          performanceScore: user.performanceScore,
          badges: user.badges,
        }
      },
      { status: 200 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Login failed due to server error' }, { status: 500 });
  }
}
