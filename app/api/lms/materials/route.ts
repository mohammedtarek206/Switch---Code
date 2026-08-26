import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSMaterial from '@/models/LMSMaterial';
import LMSEnrollment from '@/models/LMSEnrollment';
import MaterialProgress from '@/models/MaterialProgress';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch materials for the student's enrolled track
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const enrollment = await LMSEnrollment.findOne({ userId: user.userId, status: 'active' });
        if (!enrollment) {
            return NextResponse.json({ materials: [], noTrack: true });
        }

        const materials = await LMSMaterial.find({
            trackId: enrollment.trackId,
            published: true,
        }).sort({ order: 1, createdAt: 1 });

        const materialIds = materials.map((m) => m._id);
        const progressList = await MaterialProgress.find({
            userId: user.userId,
            materialId: { $in: materialIds },
        });

        const progressMap = new Map(progressList.map((p) => [p.materialId.toString(), p]));

        const materialsWithProgress = materials.map((material) => {
            const progress = progressMap.get(material._id.toString());
            return {
                ...material.toObject(),
                progress: progress ? { completed: progress.completed, openedAt: progress.openedAt } : null,
            };
        });

        return NextResponse.json({ materials: materialsWithProgress, trackId: enrollment.trackId });
    } catch (error: any) {
        console.error('Materials GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}

// POST - Admin creates material
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: Token expired or missing. Please log in again.' }, { status: 401 });
        }
        if (!isLMSAdmin(user.role)) {
            return NextResponse.json({ error: `Unauthorized: Role '${user.role}' is not allowed to manage materials.` }, { status: 403 });
        }

        const data = await request.json();
        await connectDB();

        const material = new LMSMaterial({ ...data, createdBy: user.userId });
        await material.save();

        return NextResponse.json({ material, message: 'Material created successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Materials POST error:', error);
        return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
    }
}
