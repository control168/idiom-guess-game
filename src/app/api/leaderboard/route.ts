import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const users = await prisma.user.findMany();

        // Calculate success rate and sort
        const rankedUsers = users.map(user => {
            const totalGames = user.wins + user.failures;
            let successRate = 0;
            if (totalGames > 0) {
                successRate = (user.wins / totalGames) * 100;
            }

            return {
                ...user,
                successRate,
            };
        });

        // Sort by success rate descending, then by wins descending
        rankedUsers.sort((a, b) => {
            if (a.successRate === b.successRate) {
                return b.wins - a.wins;
            }
            return b.successRate - a.successRate;
        });

        // Return top 10
        return NextResponse.json(rankedUsers.slice(0, 10));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
