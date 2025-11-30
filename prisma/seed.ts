import { PrismaClient } from '@prisma/client'
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import * as OpenCC from 'opencc-js';

const prisma = new PrismaClient()

const enIdioms = [
    { phrase: "break the ice", clue: "To start a conversation in a social setting" },
    { phrase: "bite the bullet", clue: "To decide to do something difficult or unpleasant" },
    { phrase: "piece of cake", clue: "Something very easy to do" },
    { phrase: "hit the sack", clue: "To go to bed" },
    { phrase: "miss the boat", clue: "To be too late to take advantage of an opportunity" },
    { phrase: "under the weather", clue: "Feeling slightly sick or unwell" },
    { phrase: "spill the beans", clue: "To reveal a secret" },
    { phrase: "break a leg", clue: "Good luck (often said to actors)" },
    { phrase: "sat on the fence", clue: "Undecided about something" },
    { phrase: "through thick and thin", clue: "Under all circumstances, no matter how difficult" }
]

async function main() {
    console.log('Start seeding ...')

    // Seed English Idioms
    for (const idiom of enIdioms) {
        await prisma.idiom.upsert({
            where: { phrase: idiom.phrase },
            update: {},
            create: { ...idiom, language: 'en' },
        })
    }

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
