import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authedUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    const auth = authedUser(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { idiomId?: number };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const idiomId = Number(body.idiomId);
    if (!Number.isFinite(idiomId) || idiomId <= 0) {
        return NextResponse.json({ error: 'idiomId is required' }, { status: 400 });
    }

    try {
        const idiom = await prisma.idiom.findUnique({ where: { id: idiomId } });
        if (!idiom) {
            return NextResponse.json({ error: 'Idiom not found' }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where: { id: auth.uid },
            data: { failures: { increment: 1 } },
            select: { wins: true, failures: true },
        });

        return NextResponse.json({
            phrase: idiom.phrase,
            stats: updated,
        });
    } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code === 'P2025') {
            return NextResponse.json({ error: 'User no longer exists' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to reveal' }, { status: 500 });
    }
}
