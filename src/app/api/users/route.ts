import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { signUserToken } from '@/lib/auth';

const prisma = new PrismaClient();

const NICK_RE = /^[\p{L}\p{N}_ \-]{1,20}$/u;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : '';

        if (!nickname) {
            return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
        }
        if (!NICK_RE.test(nickname)) {
            return NextResponse.json({ error: 'Nickname must be 1–20 letters, numbers, spaces, _ or -' }, { status: 400 });
        }

        let user = await prisma.user.findUnique({ where: { nickname } });
        if (!user) {
            user = await prisma.user.create({ data: { nickname } });
        }

        const token = signUserToken(user.id, user.nickname);
        return NextResponse.json({
            id: user.id,
            nickname: user.nickname,
            wins: user.wins,
            failures: user.failures,
            token,
        });
    } catch {
        return NextResponse.json({ error: 'Failed to create/fetch user' }, { status: 500 });
    }
}

// Note: PUT was removed in v4 — stats are now updated server-side from /api/check
// and /api/reveal, gated by the bearer token.
