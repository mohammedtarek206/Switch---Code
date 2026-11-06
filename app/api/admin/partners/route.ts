import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';
import { authenticateRequest } from '@/lib/auth';

const ADMIN_ROLES = ['admin', 'super_admin', 'president', 'vice_president'];

function isAdmin(role?: string) {
  return role && ADMIN_ROLES.includes(role);
}

// GET /api/admin/partners - All partners (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: Record<string, unknown> = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (status === 'published') query.isPublished = true;
    if (status === 'unpublished') query.isPublished = false;
    if (status === 'featured') query.isFeatured = true;
    if (status === 'homepage') query.showOnHomepage = true;

    const [partners, total] = await Promise.all([
      Partner.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Partner.countDocuments(query),
    ]);

    // Stats
    const [totalCount, publishedCount, featuredCount, homepageCount] = await Promise.all([
      Partner.countDocuments(),
      Partner.countDocuments({ isPublished: true }),
      Partner.countDocuments({ isFeatured: true }),
      Partner.countDocuments({ showOnHomepage: true }),
    ]);

    return NextResponse.json({
      partners,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: { total: totalCount, published: publishedCount, featured: featuredCount, homepage: homepageCount },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

// POST /api/admin/partners - Create partner
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validation
    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
    }
    if (!data.logo?.trim()) {
      return NextResponse.json({ error: 'Partner logo is required' }, { status: 400 });
    }

    // Sanitize URL
    if (data.websiteUrl && !data.websiteUrl.startsWith('http')) {
      data.websiteUrl = `https://${data.websiteUrl}`;
    }

    await connectDB();
    const partner = await Partner.create({
      name: data.name.trim(),
      logo: data.logo.trim(),
      driveFileId: data.driveFileId || '',
      sourceType: data.sourceType || 'url',
      description: data.description?.trim() || '',
      websiteUrl: data.websiteUrl?.trim() || '',
      partnershipType: data.partnershipType?.trim() || '',
      isFeatured: Boolean(data.isFeatured),
      showOnHomepage: data.showOnHomepage !== false,
      isPublished: Boolean(data.isPublished),
      displayOrder: Number(data.displayOrder) || 0,
    });

    return NextResponse.json(partner, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
  }
}

// DELETE /api/admin/partners?id=... - Delete partner
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await connectDB();
    const deleted = await Partner.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

    return NextResponse.json({ message: 'Partner deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
  }
}
