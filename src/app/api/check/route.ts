import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authedUser } from '@/lib/auth';

const prisma = new PrismaClient();

interface CheckBody {
    idiomId?: number;
    guess?: string;
}

export async function POST(request: Request) {
    const auth = authedUser(request);
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: CheckBody;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const idiomId = Number(body.idiomId);
    const guess = typeof body.guess === 'string' ? body.guess.trim() : '';
    if (!Number.isFinite(idiomId) || idiomId <= 0 || !guess) {
        return NextResponse.json({ error: 'idiomId and guess are required' }, { status: 400 });
    }
    if (guess.length > 100) {
        return NextResponse.json({ error: 'Guess too long' }, { status: 400 });
    }

    try {
        const idiom = await prisma.idiom.findUnique({ where: { id: idiomId } });
        if (!idiom) {
            return NextResponse.json({ error: 'Idiom not found' }, { status: 404 });
        }

        const correct = guess.toLowerCase() === idiom.phrase.toLowerCase();

        // Server-side stat update — replaces the old client-trusted PUT /api/users.
        const updated = await prisma.user.update({
            where: { id: auth.uid },
            data: correct
                ? { wins: { increment: 1 } }
                : { failures: { increment: 1 } },
            select: { wins: true, failures: true },
        });

        // Reveal phrase only on a correct guess. Wrong guesses get no leak.
        return NextResponse.json({
            correct,
            phrase: correct ? idiom.phrase : null,
            stats: updated,
        });
    } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code === 'P2025') {
            return NextResponse.json({ error: 'User no longer exists' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to check guess' }, { status: 500 });
    }
}
