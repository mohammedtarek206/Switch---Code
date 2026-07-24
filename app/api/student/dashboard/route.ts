import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExamResult from '@/models/ExamResult';
import Track from '@/models/Track';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const userToken = await authenticateRequest(request);
        if (!userToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Fetch real user info for name
        const fullUser = await User.findById(userToken.userId).select('name role');
        if (!fullUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch recent results for this student
        const recentResults = await ExamResult.find({ studentId: userToken.userId })
            .populate({
                path: 'examId',
                select: 'title',
                populate: { path: 'trackId', select: 'title' }
            })
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch stats
        const results = await ExamResult.find({ studentId: userToken.userId });
        const avgScore = results.length > 0
            ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)
            : 0;

        const totalTracks = await Track.countDocuments();

        return NextResponse.json({
            user: { name: fullUser.name, role: fullUser.role },
            stats: {
                progress: 0,
                completedExams: results.filter(r => r.status === 'Pass').length,
                avgScore
            },
            recentResults,
            totalTracks
        });
    } catch (error: any) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
