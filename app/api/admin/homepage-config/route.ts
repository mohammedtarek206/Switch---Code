import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomepageConfig from '@/models/HomepageConfig';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        let config = await HomepageConfig.findOne();
        if (!config) {
            config = await HomepageConfig.create({});
        }

        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();

        let config = await HomepageConfig.findOne();
        if (!config) {
            config = new HomepageConfig(body);
        } else {
            Object.assign(config, body);
        }

        await config.save();
        return NextResponse.json({ message: 'Homepage configuration updated successfully', config });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
