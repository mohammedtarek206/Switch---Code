import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSMaterial from '@/models/LMSMaterial';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser || !isAdminRole(authUser.role, authUser.roles)) {
            return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'all';

        const filter: Record<string, unknown> = {};
        if (status && status !== 'all') {
            if (status === 'pending_review') {
                filter.approvalStatus = { $in: ['pending_review', 'pending_approval'] };
            } else {
                filter.approvalStatus = status;
            }
        }

        const [materials, pendingCount] = await Promise.all([
            LMSMaterial.find(filter)
                .populate('trackId', 'name category')
                .populate('createdBy', 'name email avatar')
                .populate('reviewedBy', 'name')
                .sort({ createdAt: -1 })
                .lean(),
            LMSMaterial.countDocuments({
                approvalStatus: { $in: ['pending_review', 'pending_approval'] },
            }),
        ]);

        return NextResponse.json({ materials, pendingCount });
    } catch (error) {
        console.error('Admin material review GET error:', error);
        return NextResponse.json({ error: 'Failed to load materials' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser || !isAdminRole(authUser.role, authUser.roles)) {
            return NextResponse.json(
                { error: 'Forbidden: Only administrators can review and approve materials.' },
                { status: 403 }
            );
        }

        const { materialId, decision, feedback } = await req.json();
        if (!materialId || !decision) {
            return NextResponse.json({ error: 'materialId and decision are required' }, { status: 400 });
        }

        if (['reject', 'request_changes', 'revoke'].includes(decision) && (!feedback || !String(feedback).trim())) {
            return NextResponse.json(
                { error: 'يجب كتابة سبب / ملاحظات عند الرفض أو طلب التعديل أو إلغاء الاعتماد.' },
                { status: 400 }
            );
        }

        await connectDB();
        const material = await LMSMaterial.findById(materialId);
        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        const prevStatus = material.approvalStatus;

        if (decision === 'approve') {
            material.approvalStatus = 'approved';
            material.published = true;
        } else if (decision === 'reject') {
            material.approvalStatus = 'rejected';
            material.published = false;
        } else if (decision === 'request_changes') {
            material.approvalStatus = 'changes_requested';
            material.published = false;
        } else if (decision === 'revoke') {
            material.approvalStatus = 'rejected';
            material.published = false;
        } else {
            return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
        }

        material.reviewFeedback = typeof feedback === 'string' ? feedback.trim() : '';
        material.reviewedBy = authUser.userId as never;
        material.reviewedAt = new Date();
        await material.save();

        if (material.createdBy) {
            const titleMap: Record<string, string> = {
                approve: 'تم اعتماد المادة التعليمية ونشرها',
                reject: 'تم رفض المادة التعليمية',
                request_changes: 'مطلوب تعديلات على المادة التعليمية',
                revoke: 'تم إلغاء اعتماد المادة التعليمية',
            };
            await createNotification({
                userId: material.createdBy.toString(),
                title: titleMap[decision] || 'تحديث مراجعة المادة التعليمية',
                message: `المادة "${material.title}": ${material.reviewFeedback || 'تمت المراجعة بنجاح.'}`,
                type: decision === 'approve' ? 'success' : 'warning',
                link: '/instructor/dashboard',
            });
        }

        await logActivity(authUser.userId, `MATERIAL_${decision.toUpperCase()}`, 'LMSMaterial', materialId, {
            previousStatus: prevStatus,
            newStatus: material.approvalStatus,
            feedback: material.reviewFeedback,
        });

        return NextResponse.json({
            material,
            message: 'تم حفظ قرار مراجعة المادة بنجاح.',
        });
    } catch (error) {
        console.error('Admin material review PATCH error:', error);
        return NextResponse.json({ error: 'Failed to review material' }, { status: 500 });
    }
}
