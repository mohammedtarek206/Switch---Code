import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';
import { authenticateRequest } from '@/lib/auth';

export async function GET() {
    try {
        await connectDB();
        const partners = await Partner.find().sort({ createdAt: -1 });
        return NextResponse.json(partners);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
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
        const partner = await Partner.create(data);
        return NextResponse.json(partner, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await connectDB();
        await Partner.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
