import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Performance from '@/models/Performance';
import Warning from '@/models/Warning';
import Reward from '@/models/Reward';
import Meeting from '@/models/Meeting';
import User from '@/models/User';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';

const LEADER_ROLES = ['committee_leader', 'vice_committee_leader', 'admin', 'super_admin', 'president', 'vice_president', 'hr'];

/* ─── Evaluations ─── */
export async function POST(request: NextRequest) {
    try {
        const authUser = await authenticateRequest(request);
        if (!authUser || !LEADER_ROLES.includes(authUser.role)) {
            return NextResponse.json({ error: 'Forbidden: Leaders only' }, { status: 403 });
        }

        const { type, ...data } = await request.json();
        await connectDB();

        if (!type) return NextResponse.json({ error: 'Action type required' }, { status: 400 });

        // Ensure committee models registered
        const _c = Committee;

        if (type === 'EVALUATE') {
            if (!data.memberId || !data.committeeId) {
                return NextResponse.json({ error: 'memberId and committeeId required' }, { status: 400 });
            }
            const scores = [
                data.commitment, data.attendance, data.workQuality, data.executionSpeed,
                data.cooperation, data.communication, data.creativity, data.responsibility,
                data.punctuality, data.teamwork,
            ];
            const avg = scores.reduce((a: number, b: number) => a + Number(b), 0) / scores.length;
            const totalScore = Math.round(avg * 10);

            const evaluation = new Performance({
                ...data,
                evaluatorId: authUser.userId,
                totalScore,
                year: new Date().getFullYear(),
                month: data.month || new Date().getMonth() + 1,
            });
            await evaluation.save();

            // Update user performanceScore (rolling average)
            const allEvals = await Performance.find({ memberId: data.memberId });
            const rollingAvg = Math.round(allEvals.reduce((a, b) => a + b.totalScore, 0) / allEvals.length);
            await User.findByIdAndUpdate(data.memberId, { performanceScore: rollingAvg });

            return NextResponse.json(evaluation, { status: 201 });
        }

        if (type === 'WARN') {
            if (!data.memberId || !data.committeeId || !data.reason) {
                return NextResponse.json({ error: 'memberId, committeeId, reason required' }, { status: 400 });
            }
            const warning = new Warning({ ...data, issuedBy: authUser.userId });
            await warning.save();
            return NextResponse.json(warning, { status: 201 });
        }

        if (type === 'REWARD') {
            if (!data.memberId || !data.committeeId || !data.rewardType) {
                return NextResponse.json({ error: 'memberId, committeeId, rewardType required' }, { status: 400 });
            }
            const reward = new Reward({ ...data, grantedBy: authUser.userId });
            await reward.save();
            return NextResponse.json(reward, { status: 201 });
        }

        if (type === 'MEETING') {
            if (!data.committeeId || !data.title || !data.date) {
                return NextResponse.json({ error: 'committeeId, title, date required' }, { status: 400 });
            }
            const meeting = new Meeting({ ...data, createdBy: authUser.userId });
            await meeting.save();
            return NextResponse.json(meeting, { status: 201 });
        }

        return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
    } catch (error: any) {
        console.error('Committee actions POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/* ─── Delete Warning/Reward/Meeting ─── */
export async function DELETE(request: NextRequest) {
    try {
        const authUser = await authenticateRequest(request);
        if (!authUser || !LEADER_ROLES.includes(authUser.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const id = searchParams.get('id');
        if (!type || !id) return NextResponse.json({ error: 'type and id required' }, { status: 400 });

        await connectDB();

        if (type === 'warning') await Warning.findByIdAndDelete(id);
        else if (type === 'reward') await Reward.findByIdAndDelete(id);
        else if (type === 'meeting') await Meeting.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
