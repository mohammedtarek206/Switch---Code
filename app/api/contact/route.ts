import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message, subject, phone } = await request.json();

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Save to database
    const contact = new Contact({
      name,
      email,
      message,
      subject: subject || '',
      phone: phone || '',
      responded: false,
    });

    await contact.save();

    return NextResponse.json(
      { message: 'Contact form submitted successfully', id: contact._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return NextResponse.json(contacts, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
