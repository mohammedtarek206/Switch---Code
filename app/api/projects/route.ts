import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const projects = await Project.find()
      .sort({ featured: -1, createdAt: -1 });
    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
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

    const project = new Project(data);
    await project.save();

    return NextResponse.json(
      { message: 'Project added successfully', id: project._id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add project' },
      { status: 500 }
    );
  }
}
