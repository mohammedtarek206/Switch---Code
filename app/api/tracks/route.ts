import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Track from '@/models/Track';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const tracks = await Track.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json(tracks, { status: 200 });
  } catch (error: any) {
    console.error('Tracks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await connectDB();

    const track = new Track(data);
    await track.save();

    return NextResponse.json(
      { message: 'Track added successfully', id: track._id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add track' },
      { status: 500 }
    );
  }
}
