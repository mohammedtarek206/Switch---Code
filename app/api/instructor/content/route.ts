import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstructorAssignment from '@/models/InstructorAssignment';
import LMSVideo from '@/models/LMSVideo';
import LMSMaterial from '@/models/LMSMaterial';
import LMSAssignment from '@/models/LMSAssignment';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole, userHasAnyRole } from '@/lib/permissions';
import { notifyAdmins } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

async function verifyInstructorTrackAccess(userId: string, role: string, roles: string[] | undefined, trackId: string) {
    if (isAdminRole(role, roles)) {
        return { allowed: true, canPublishDirectly: true };
    }
    if (!userHasAnyRole({ role, roles }, ['instructor', 'mentor'])) {
        return { allowed: false, canPublishDirectly: false };
    }
    const [assignment, user] = await Promise.all([
        InstructorAssignment.findOne({ userId, trackId, status: 'approved' }).lean() as Promise<{
            canPublishDirectly?: boolean;
        } | null>,
        User.findById(userId).select('isActive canPublishDirectly').lean() as Promise<{
            isActive?: boolean;
            canPublishDirectly?: boolean;
        } | null>,
    ]);

    if (!assignment || !user || user.isActive === false) {
        return { allowed: false, canPublishDirectly: false };
    }

    return {
        allowed: true,
        canPublishDirectly: true,
    };
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { contentType, trackId } = body;

        if (!contentType || !trackId) {
            return NextResponse.json({ error: 'contentType and trackId are required' }, { status: 400 });
        }

        await connectDB();
        const access = await verifyInstructorTrackAccess(authUser.userId, authUser.role, authUser.roles, trackId);
        if (!access.allowed) {
            return NextResponse.json(
                { error: 'Forbidden: You are not assigned or approved for this track.' },
                { status: 403 }
            );
        }

        const approvalStatus = access.canPublishDirectly ? 'approved' : 'pending_approval';
        const published = access.canPublishDirectly;

        let created: unknown;
        if (contentType === 'video') {
            if (!body.title || !body.videoUrl) {
                return NextResponse.json({ error: 'Title and videoUrl are required' }, { status: 400 });
            }
            created = await LMSVideo.create({
                title: body.title,
                description: body.description || '',
                videoUrl: body.videoUrl,
                trackId,
                instructor: body.instructor || 'Switch Code Instructor',
                duration: body.duration || '',
                order: Number(body.order) || 0,
                published,
                approvalStatus,
                createdBy: authUser.userId,
            });
        } else if (contentType === 'material') {
            if (!body.title || !body.fileUrl) {
                return NextResponse.json({ error: 'Title and fileUrl are required' }, { status: 400 });
            }
            created = await LMSMaterial.create({
                title: body.title,
                description: body.description || '',
                fileUrl: body.fileUrl,
                materialType: body.materialType || 'pdf',
                trackId,
                order: Number(body.order) || 0,
                published,
                approvalStatus,
                allowDownload: body.allowDownload !== false,
                createdBy: authUser.userId,
            });
        } else if (contentType === 'assignment') {
            if (!body.title) {
                return NextResponse.json({ error: 'Assignment title is required' }, { status: 400 });
            }
            created = await LMSAssignment.create({
                title: body.title,
                description: body.description || '',
                instructions: body.instructions || '',
                trackId,
                deadline: body.deadline ? new Date(body.deadline) : undefined,
                attachmentUrl: body.attachmentUrl || undefined,
                maxScore: Number(body.maxScore) || 100,
                order: Number(body.order) || 0,
                published,
                approvalStatus,
                createdBy: authUser.userId,
            });
        } else {
            return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
        }

        if (!access.canPublishDirectly) {
            await notifyAdmins({
                title: 'محتوى تعليمي بانتظار الاعتماد',
                message: `أضاف المحاضر محتوى جديداً (${body.title}) وهو بانتظار المراجعة والنشر.`,
                type: 'info',
                link: '/admin/lms',
            });
        }

        await logActivity(authUser.userId, 'INSTRUCTOR_CREATE_CONTENT', contentType, trackId, {
            title: body.title,
            approvalStatus,
        });

        return NextResponse.json(
            {
                item: created,
                approvalStatus,
                message: access.canPublishDirectly
                    ? 'تم نشر المحتوى بنجاح.'
                    : 'تمت إضافة المحتوى وهو بانتظار اعتماد الإدارة للنشر.',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Instructor content POST error:', error);
        return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
    }
}
