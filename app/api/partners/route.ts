import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';

// GET /api/partners - Public: all non-explicitly-unpublished partners
// $ne: false means: show docs where isPublished is true OR undefined (legacy docs)
export async function GET() {
  try {
    await connectDB();

    // Fetch ALL partners without any filter first to debug
    const all = await Partner.find({}).lean();

    // Then normalize and filter
    const normalized = all.map((p: any) => ({
      ...p,
      logo: p.logo || (p as any).logoUrl || '',
      isPublished: p.isPublished ?? true,
      showOnHomepage: p.showOnHomepage ?? true,
      isFeatured: p.isFeatured ?? false,
      displayOrder: p.displayOrder ?? 0,
    }));

    // Only exclude explicitly unpublished
    const visible = normalized.filter((p) => p.isPublished !== false);

    return NextResponse.json(visible);
  } catch (err: any) {
    console.error('Partners API error:', err);
    return NextResponse.json({ error: 'Failed to fetch partners', detail: err?.message }, { status: 500 });
  }
}
