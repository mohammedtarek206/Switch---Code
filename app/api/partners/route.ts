import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';

// GET /api/partners - Public: all published partners
export async function GET() {
  try {
    await connectDB();
    const partners = await Partner.find({ isPublished: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    return NextResponse.json(partners);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}
