import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';
import { authenticateRequest } from '@/lib/auth';

const ADMIN_ROLES = ['admin', 'super_admin', 'president', 'vice_president'];

function isAdmin(role?: string) {
  return role && ADMIN_ROLES.includes(role);
}

// PUT /api/admin/partners/[id] - Full update
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
    }
    if (!data.logo?.trim()) {
      return NextResponse.json({ error: 'Partner logo is required' }, { status: 400 });
    }

    if (data.websiteUrl && !data.websiteUrl.startsWith('http')) {
      data.websiteUrl = `https://${data.websiteUrl}`;
    }

    await connectDB();
    const partner = await Partner.findByIdAndUpdate(
      params.id,
      {
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
      },
      { new: true, runValidators: true }
    );

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch {
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}

// PATCH /api/admin/partners/[id] - Partial update (publish, homepage, featured, order)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const allowedFields: Record<string, unknown> = {};

    if (typeof data.isPublished === 'boolean') allowedFields.isPublished = data.isPublished;
    if (typeof data.showOnHomepage === 'boolean') allowedFields.showOnHomepage = data.showOnHomepage;
    if (typeof data.isFeatured === 'boolean') allowedFields.isFeatured = data.isFeatured;
    if (typeof data.displayOrder === 'number') allowedFields.displayOrder = data.displayOrder;

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await connectDB();
    const partner = await Partner.findByIdAndUpdate(
      params.id,
      { $set: allowedFields },
      { new: true }
    );

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch {
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
  }
}
