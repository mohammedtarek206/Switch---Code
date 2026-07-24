import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PerformanceScore from '@/models/PerformanceScore';
import User from '@/models/User';
import Task from '@/models/Task';
import EventRegistration from '@/models/EventRegistration';
import { authenticateRequest } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';

// GET performance details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get('month') || new Date().getMonth().toString()) + 1;
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        // 1. Fetch or initialize the PerformanceScore document
        let scoreDoc = await PerformanceScore.findOne({ userId: params.id, month, year });

        // Recalculate automatic components dynamically if we want fresh statistics
        const attendanceScore = await calculateAttendanceScore(params.id);
        const tasksScore = await calculateTasksScore(params.id);
        const projectsScore = await calculateProjectsScore(params.id);

        const autoTotal = Math.round(attendanceScore + tasksScore + projectsScore);

        if (!scoreDoc) {
            scoreDoc = await PerformanceScore.create({
                userId: params.id,
                month,
                year,
                attendanceScore,
                tasksScore,
                projectsScore,
                total: autoTotal
            });
        } else {
            scoreDoc.attendanceScore = attendanceScore;
            scoreDoc.tasksScore = tasksScore;
            scoreDoc.projectsScore = projectsScore;
            scoreDoc.total = scoreDoc.manualOverride !== undefined
                ? scoreDoc.manualOverride
                : Math.round(autoTotal + scoreDoc.leaderEvaluation + scoreDoc.adminEvaluation);
            await scoreDoc.save();
        }

        // Cache to user profile
        await User.findByIdAndUpdate(params.id, { performanceScore: scoreDoc.total });

        return NextResponse.json(scoreDoc);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT manual score override or leader/admin evaluation
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const isAdmin = ['super_admin', 'admin', 'president', 'vice_president', 'hr'].includes(authUser.role);
        if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await connectDB();
        const body = await req.json();
        const { month, year, manualOverride, leaderEvaluation, adminEvaluation } = body;

        if (!month || !year) {
            return NextResponse.json({ error: 'month and year are required' }, { status: 400 });
        }

        let scoreDoc = await PerformanceScore.findOne({ userId: params.id, month, year });
        if (!scoreDoc) {
            scoreDoc = new PerformanceScore({ userId: params.id, month, year });
        }

        if (manualOverride !== undefined) scoreDoc.manualOverride = manualOverride;
        if (leaderEvaluation !== undefined) scoreDoc.leaderEvaluation = leaderEvaluation;
        if (adminEvaluation !== undefined) scoreDoc.adminEvaluation = adminEvaluation;

        // Recalculate automatic components if updating
        const attendanceScore = await calculateAttendanceScore(params.id);
        const tasksScore = await calculateTasksScore(params.id);
        const projectsScore = await calculateProjectsScore(params.id);

        scoreDoc.attendanceScore = attendanceScore;
        scoreDoc.tasksScore = tasksScore;
        scoreDoc.projectsScore = projectsScore;

        const baseSum = attendanceScore + tasksScore + projectsScore + (scoreDoc.leaderEvaluation || 0) + (scoreDoc.adminEvaluation || 0);
        scoreDoc.total = scoreDoc.manualOverride !== undefined ? scoreDoc.manualOverride : Math.round(baseSum);
        await scoreDoc.save();

        // Update user profile total
        await User.findByIdAndUpdate(params.id, { performanceScore: scoreDoc.total });

        await logActivity(authUser.userId, 'UPDATE_MEMBER_SCORE', 'User', params.id, { month, year, ...body });

        return NextResponse.json(scoreDoc);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Automatic scorer logic helpers
async function calculateAttendanceScore(userId: string): Promise<number> {
    const attended = await EventRegistration.countDocuments({ userId, attended: true });
    const total = await EventRegistration.countDocuments({ userId });
    if (!total) return 100; // Default full score if no events registered
    return Math.round((attended / total) * 100);
}

async function calculateTasksScore(userId: string): Promise<number> {
    const completed = await Task.countDocuments({ assigneeId: userId, status: 'done' });
    const total = await Task.countDocuments({ assigneeId: userId });
    if (!total) return 100; // Default full score if no tasks assigned
    return Math.round((completed / total) * 100);
}

async function calculateProjectsScore(userId: string): Promise<number> {
    // Can be upgraded to check project pull requests or other contributions.
    // Standard full points placeholder.
    return 85;
}
