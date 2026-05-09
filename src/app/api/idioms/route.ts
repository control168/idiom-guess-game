import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLOWED_LANGS = new Set(['en', 'zh', 'word']);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    if (!ALLOWED_LANGS.has(lang)) {
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    try {
        const count = await prisma.idiom.count({ where: { language: lang } });
        if (count === 0) {
            return NextResponse.json({ error: 'No idioms found for this language' }, { status: 404 });
        }

        const skip = Math.floor(Math.random() * count);
        const row = await prisma.idiom.findFirst({
            where: { language: lang },
            skip,
        });
        if (!row) {
            return NextResponse.json({ error: 'No idioms found' }, { status: 404 });
        }

        // Never return `phrase` to the client. Expose lengths so the UI can
        // render letter slots, and a small `hintPrefix` (first word for EN,
        // first char otherwise) so the Hint button still works without the
        // client ever holding the full answer.
        const wordLengths = lang === 'en'
            ? row.phrase.split(' ').map((w) => w.length)
            : [row.phrase.length];
        const hintPrefix = lang === 'en'
            ? row.phrase.split(' ')[0]
            : row.phrase[0];

        return NextResponse.json({
            id: row.id,
            clue: row.clue,
            difficulty: row.difficulty,
            language: row.language,
            phraseLength: row.phrase.length,
            wordLengths,
            hintPrefix,
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch idiom' }, { status: 500 });
    }
}
