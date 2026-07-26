import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.identifier || body.email || body.username;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required' }, { status: 400 });
    }

    const cleanIdentifier = String(identifier).trim();
    const cleanPassword = String(password).trim();

    await connectDB();

    // Find active user by username, email (case-insensitive), or phone
    const user = await User.findOne({
      $or: [
        { username: cleanIdentifier },
        { username: cleanIdentifier.toLowerCase() },
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier }
      ],
      isActive: true
    }).populate('committeeId', 'name').populate('teamId', 'name');

    if (!user) {
      return NextResponse.json({ error: 'Invalid Username/Email or Password (or account deactivated)' }, { status: 401 });
    }

    let isMatch = false;

    // Check hashed password using bcrypt
    if (user.password) {
      isMatch = await bcrypt.compare(cleanPassword, user.password);
    }

    // Fallback check against tempPassword plain text if bcrypt fails
    if (!isMatch && user.tempPassword && cleanPassword === user.tempPassword) {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid Username/Email or Password' }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        committeeId: user.committeeId?._id?.toString() || user.committeeId?.toString(),
        teamId: user.teamId?._id?.toString() || user.teamId?.toString(),
        position: user.position
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        mustChangePassword: !!user.mustChangePassword,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          committeeId: user.committeeId,
          teamId: user.teamId,
          position: user.position,
          avatar: user.avatar,
          performanceScore: user.performanceScore,
          badges: user.badges
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Login failed due to server error' }, { status: 500 });
  }
}
