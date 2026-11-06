import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';

// GET /api/partners - Public: all published partners
// Uses $ne: false so legacy documents (no isPublished field) are included
export async function GET() {
  try {
    await connectDB();
    const partners = await Partner.find({ isPublished: { $ne: false } })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    // Normalize: support old `logoUrl` field for legacy data
    const normalized = partners.map((p: any) => ({
      ...p,
      logo: p.logo || p.logoUrl || '',
    }));

    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}
