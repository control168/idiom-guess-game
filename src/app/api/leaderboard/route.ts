import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: { nickname: true, wins: true, failures: true },
        });

        const ranked = users.map((u) => {
            const total = u.wins + u.failures;
            const successRate = total > 0 ? (u.wins / total) * 100 : 0;
            return { ...u, successRate };
        });

        ranked.sort((a, b) => {
            if (a.successRate === b.successRate) return b.wins - a.wins;
            return b.successRate - a.successRate;
        });

        return NextResponse.json(ranked.slice(0, 10));
    } catch {
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
