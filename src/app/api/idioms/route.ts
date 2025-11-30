import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    try {
        const count = await prisma.idiom.count({
            where: { language: lang },
        });

        if (count === 0) {
            return NextResponse.json({ error: 'No idioms found for this language' }, { status: 404 });
        }

        const skip = Math.floor(Math.random() * count);
        const randomIdiom = await prisma.idiom.findFirst({
            where: { language: lang },
            skip: skip,
        });

        if (!randomIdiom) {
            return NextResponse.json({ error: 'No idioms found' }, { status: 404 });
        }

        return NextResponse.json(randomIdiom);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch idiom' }, { status: 500 });
    }
}
