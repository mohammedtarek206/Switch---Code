import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';

// GET /api/partners/featured - Public: featured partners
export async function GET() {
  try {
    await connectDB();
    const partners = await Partner.find({ isPublished: true, isFeatured: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    return NextResponse.json(partners);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch featured partners' }, { status: 500 });
  }
}
