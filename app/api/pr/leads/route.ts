import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PartnerLead from '@/models/PartnerLead';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, isAdminRole, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

function canUsePRTools(role: string, permissions: string[] = []): boolean {
    return (
        isAdminRole(role) ||
        role === 'pr' ||
        hasPermission(role, permissions, PERMISSIONS.MANAGE_PARTNER_LEADS)
    );
}

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !canUsePRTools(user.role, user.permissions)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const leads = await PartnerLead.find({})
            .populate('createdBy', 'name')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ leads });
    } catch (error) {
        console.error('PR leads GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch partner leads' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !canUsePRTools(user.role, user.permissions)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        if (!body.organizationName) {
            return NextResponse.json({ error: 'organizationName is required' }, { status: 400 });
        }

        await connectDB();
        const lead = await PartnerLead.create({
            organizationName: body.organizationName,
            contactPerson: body.contactPerson,
            email: body.email,
            phone: body.phone,
            type: body.type || 'company',
            status: body.status || 'new',
            notes: body.notes,
            createdBy: user.userId,
        });

        await logActivity(user.userId, 'CREATE_PARTNER_LEAD', 'PartnerLead', lead._id.toString());
        return NextResponse.json({ lead, message: 'تمت إضافة جهة التواصل بنجاح.' }, { status: 201 });
    } catch (error) {
        console.error('PR leads POST error:', error);
        return NextResponse.json({ error: 'Failed to create partner lead' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !canUsePRTools(user.role, user.permissions)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { leadId, status, notes, meetingSummary, meetingDate } = await req.json();
        if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });

        await connectDB();
        const lead = await PartnerLead.findById(leadId);
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        if (status) lead.status = status;
        if (notes !== undefined) lead.notes = notes;
        if (meetingSummary) {
            lead.meetings.push({
                date: meetingDate ? new Date(meetingDate) : new Date(),
                summary: meetingSummary,
                recordedBy: user.userId as never,
            });
        }

        await lead.save();
        return NextResponse.json({ lead, message: 'تم تحديث بيانات الشراكة.' });
    } catch (error) {
        console.error('PR leads PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update partner lead' }, { status: 500 });
    }
}
