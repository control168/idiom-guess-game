import { PrismaClient } from '@prisma/client'
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import * as OpenCC from 'opencc-js';

const prisma = new PrismaClient()

interface EnIdiom { phrase: string; clue: string; difficulty?: string }

async function main() {
    console.log('Start seeding ...')

    // Seed English Idioms from prisma/idioms_en.json
    const enIdiomsPath = path.join(process.cwd(), 'prisma', 'idioms_en.json');
    const enIdioms: EnIdiom[] = JSON.parse(fs.readFileSync(enIdiomsPath, 'utf-8'));
    for (const idiom of enIdioms) {
        await prisma.idiom.upsert({
            where: { phrase: idiom.phrase },
            update: { clue: idiom.clue, difficulty: idiom.difficulty ?? 'medium' },
            create: {
                phrase: idiom.phrase,
                clue: idiom.clue,
                difficulty: idiom.difficulty ?? 'medium',
                language: 'en',
            },
        })
    }
    console.log(`Seeded ${enIdioms.length} English idioms.`);

    // Seed Chinese Idioms
    const zhIdiomsPath = path.join(process.cwd(), 'prisma', 'idioms_zh.json');
    if (fs.existsSync(zhIdiomsPath)) {
        const zhIdiomsRaw = JSON.parse(fs.readFileSync(zhIdiomsPath, 'utf-8'));
        const converter = OpenCC.Converter({ from: 'cn', to: 'hk' }); // Simplified to Traditional (Hong Kong)

        for (const item of zhIdiomsRaw) {
            if (item.phrase.length === 4) {
                const traditionalPhrase = converter(item.phrase);
                await prisma.idiom.upsert({
                    where: { phrase: traditionalPhrase },
                    update: {},
                    create: {
                        phrase: traditionalPhrase,
                        clue: item.clue,
                        language: 'zh',
                        difficulty: 'hard'
                    },
                })
            }
        }
        console.log(`Seeded ${zhIdiomsRaw.length} Chinese idioms.`);
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
