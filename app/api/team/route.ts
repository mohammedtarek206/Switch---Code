import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import Committee from '@/models/Committee';
import CommunityTeam from '@/models/CommunityTeam';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const _c = Committee;
    const _t = CommunityTeam;

    // Fetch dynamic community members created by Admin (excluding pure students)
    const communityUsers = await User.find({
      isActive: true,
      role: { $ne: 'student' }
    })
      .select('-password -tempPassword -accessCode')
      .populate('committeeId', 'name color type')
      .populate('teamId', 'name color icon')
      .sort({ createdAt: -1 });

    // Fetch legacy manual team entries if any
    const legacyTeam = await Team.find().sort({ createdAt: -1 });

    return NextResponse.json({
      members: communityUsers,
      legacyMembers: legacyTeam
    }, { status: 200 });
  } catch (error: any) {
    console.error('Team API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
