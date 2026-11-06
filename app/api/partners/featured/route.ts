import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';

// GET /api/partners/featured - Public: featured published partners
// Uses $ne: false to include legacy docs without the field
export async function GET() {
  try {
    await connectDB();
    const partnersRaw = await Partner.find({
      isPublished: { $ne: false },
      isFeatured: true,
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    // Normalize: fallback to old logoUrl field for legacy data
    const partners = partnersRaw.map((p: any) => ({
      ...p,
      logo: p.logo || p.logoUrl || '',
    }));

    return NextResponse.json(partners);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch featured partners' }, { status: 500 });
  }
}
