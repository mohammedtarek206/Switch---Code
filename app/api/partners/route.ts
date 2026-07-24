import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Partner from '@/models/Partner';

export async function GET() {
  try {
    await connectDB();
    const partners = await Partner.find().sort({ createdAt: -1 });
    return NextResponse.json(partners);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}
