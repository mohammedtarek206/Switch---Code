import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CommunityCode from '@/models/CommunityCode';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, code } = await request.json();

    if (!name || !email || !password || !code) {
      return NextResponse.json(
        { error: 'Name, email, password, and Invite Code are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Validate Invite Code
    const inviteCode = await CommunityCode.findOne({ code: code.toUpperCase() });

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    if (inviteCode.status !== 'active') {
      return NextResponse.json({ error: 'This invite code is inactive' }, { status: 400 });
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json({ error: 'This invite code has reached its maximum usage limit' }, { status: 400 });
    }

    if (inviteCode.expirationDate && new Date() > new Date(inviteCode.expirationDate)) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 });
    }

    // 2. Check if user email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // 3. Create User with bound code properties
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert permissions to array mapping if it was stored as string[]
    const mappedPermissions = inviteCode.permissions || [];

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: inviteCode.role,
      committeeId: inviteCode.committeeId,
      position: inviteCode.position,
      permissions: mappedPermissions,
    });

    // 4. Update invite code uses constraint
    inviteCode.usedCount += 1;
    await inviteCode.save();

    // 5. Generate token (ensure JWT matches auth schema)
    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        committeeId: newUser.committeeId?.toString()
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Filter sensitive fields for client response
    const clientUser = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions,
      committeeId: newUser.committeeId
    };

    return NextResponse.json(
      { message: 'Registration successful', token, user: clientUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'Registration failed internal server error' },
      { status: 500 }
    );
  }
}
