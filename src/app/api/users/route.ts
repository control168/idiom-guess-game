import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { nickname } = await request.json();

        if (!nickname) {
            return NextResponse.json({ error: 'Nickname is required' }, { status: 400 });
        }

        let user = await prisma.user.findUnique({
            where: { nickname },
        });

        if (!user) {
            user = await prisma.user.create({
                data: { nickname },
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create/fetch user' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, action } = await request.json(); // action: 'win' or 'loss'

        if (!id || !action) {
            return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
        }

        let updateData = {};
        if (action === 'win') {
            updateData = { wins: { increment: 1 } };
        } else if (action === 'loss') {
            updateData = { failures: { increment: 1 } };
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
    }
}
