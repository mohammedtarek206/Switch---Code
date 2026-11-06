import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';

// GET /api/partners/homepage - Public: partners shown on homepage
export async function GET() {
  try {
    await connectDB();
    const partners = await Partner.find({ isPublished: true, showOnHomepage: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    return NextResponse.json(partners);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch homepage partners' }, { status: 500 });
  }
}
