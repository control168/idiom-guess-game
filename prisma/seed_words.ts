import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORDS_RAW = [
  "apple", "beach", "chair", "dance", "eagle", "flame", "grape", "house", "image", "juice",
  "knife", "lemon", "mouse", "nurse", "ocean", "piano", "queen", "radio", "snake", "table",
  "uncle", "video", "whale", "xenon", "yacht", "zebra", "alarm", "bread", "clock", "dream",
  "earth", "fruit", "glass", "heart", "jelly", "light", "money", "night",
  "onion", "paper", "quiet", "river", "sheep", "tiger", "umbra", "voice", "water", "xerox",
  "young", "actor", "baker", "clean", "drive", "exist", "field", "green", "happy",
  "irony", "joint", "knock", "laugh", "magic", "noble", "orbit", "party", "quick", "ready",
  "share", "touch", "unity", "visit", "waste", "yield", "zesty", "abide", "bacon", "camel",
  "dairy", "early", "fairy", "giant", "habit", "ideal", "jewel", "karma", "label", "macro",
  "naive", "oasis", "paint", "quest", "radar", "saint", "taste", "urban", "valid", "wagon",
  "yeast", "abuse", "badge", "cable", "daily", "eager", "fable", "gamma", "hairy",
  "idiom", "joust", "kebab", "labor", "macho", "nacho", "oaken", "paddy", "quail", "racer",
  "saber", "taboo", "udder", "vague", "wacky", "yearn", "zonal", "acorn", "bagel", "caddy",
  "daddy", "easel", "facet", "gaily", "haiku", "ladle", "madam",
  "nadir", "oases", "pager", "quake", "rabbi", "saggy", "tacit", "ulcer", "valve", "wafer",
  "zones", "about", "above", "acute", "admit", "adopt", "adult",
  "after", "again", "agent", "agree", "ahead", "album", "alert", "alike", "alive",
  "allow", "alone", "along", "alter", "among", "anger", "angle", "angry", "apart",
  "apply", "arena", "argue", "arise", "array", "aside", "asset", "audio", "audit", "avoid",
  "award", "aware", "badly", "bases", "basic", "basis", "began", "begin",
  "begun", "being", "below", "bench", "billy", "birth", "black", "blame", "blind", "block",
  "blood", "board", "boost", "booth", "bound", "brain", "brand", "break", "breed",
  "brief", "bring", "broad", "broke", "brown", "build", "built", "buyer", "calm",
  "candy", "carry", "catch", "cause",
  "chain", "chart", "chase", "cheap", "check", "chest", "chief", "child", "china",
  "chose", "civil", "claim", "class", "clear", "click", "close", "coach",
  "coast", "could", "count", "court", "cover", "craft", "crash", "cream", "crime", "cross",
  "crowd", "crown", "curve", "cycle", "dated", "dealt", "death", "debut",
  "delay", "depth", "doing", "doubt", "dozen", "draft", "drama", "drawn", "dress",
  "drill", "drink", "drove", "dying", "eight", "elite",
  "empty", "enemy", "enjoy", "enter", "entry", "equal", "error", "event", "every", "exact",
  "extra", "faith", "false", "fault", "fiber", "fifth", "fifty", "fight",
  "final", "first", "fixed", "flash", "fleet", "floor", "fluid", "focus", "force", "forth",
  "forty", "forum", "found", "frame", "frank", "fraud", "fresh", "front", "fully",
  "funny", "given", "globe", "going", "grace", "grade", "grand", "grant",
  "grass", "gross", "group", "grown", "guard", "guess", "guest", "guide",
  "harry", "heavy", "hence", "henry", "horse", "hotel", "human",
  "index", "inner", "input", "issue",
  "judge", "label", "large", "laser",
  "later", "layer", "learn", "lease", "least", "leave", "legal", "level", "lewis",
  "limit", "links", "lives", "local", "logic", "loose", "lower", "lucky", "lunch",
  "lying", "major", "maker", "march", "maria", "match", "maybe", "mayor", "meant",
  "media", "metal", "might", "minor", "minus", "mixed", "model", "month", "moral",
  "motor", "mouth", "movie", "music", "needs", "never", "newly",
  "noise", "north", "novel", "occur", "offer", "often",
  "order", "other", "ought", "panel", "peace", "peter", "phase",
  "phone", "photo", "piece", "pilot", "pitch", "place", "plain", "plane", "plant", "plate",
  "plaza", "point", "polar", "pound", "power", "press", "price", "pride", "prime",
  "print", "prior", "prize", "proof", "proud", "prove", "quite",
  "raise", "range", "rapid", "ratio", "reach", "refer", "right", "rival",
  "robin", "roger", "roman", "rough", "round", "route", "royal", "rural", "scale",
  "scene", "scope", "score", "sense", "serve", "seven", "shall", "shape", "sharp",
  "sheet", "shelf", "shell", "shift", "shirt", "shock", "shoot", "short", "shown", "sight",
  "since", "sixth", "sixty", "sized", "skill", "sleep", "slide", "small", "smart", "smile",
  "smith", "smoke", "solid", "solve", "sorry", "sound", "south",
  "space", "spare", "speak", "speed", "spend", "spent", "split", "spoke", "sport", "staff",
  "stage", "stake", "stand", "start", "state", "steam", "steel", "stick", "still", "stock",
  "stone", "stood", "store", "storm", "story", "strip", "stuck", "study", "stuff", "style",
  "sugar", "suite", "super", "sweet", "taken", "taxes", "teach", "teeth",
  "terry", "texas", "thank", "theft", "their", "theme", "there", "these", "thick", "thing",
  "think", "third", "those", "three", "threw", "throw", "tight", "times", "tired", "title",
  "today", "topic", "total", "tough", "tower", "track", "trade", "train", "treat",
  "trend", "trial", "tried", "tries", "truck", "truly", "trust", "truth", "twice", "under",
  "undue", "union", "until", "upper", "upset", "usage", "usual",
  "value", "virus", "vital", "watch", "wheel",
  "where", "which", "while", "white", "whole", "whose", "woman", "women", "world", "worry",
  "worse", "worst", "worth", "would", "wound", "write", "wrong", "wrote", "youth"
];

interface DictionaryEntry {
  meanings?: { definitions?: { definition?: string }[] }[];
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchDefinition(word: string, attempt = 1): Promise<string | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (res.status === 429 && attempt <= 3) {
      await sleep(1500 * attempt);
      return fetchDefinition(word, attempt + 1);
    }
    if (!res.ok) return null;
    const data = (await res.json()) as DictionaryEntry[];
    const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    return typeof def === 'string' && def.length > 0 ? def : null;
  } catch {
    if (attempt <= 2) {
      await sleep(800 * attempt);
      return fetchDefinition(word, attempt + 1);
    }
    return null;
  }
}

async function inBatches<T, U>(items: T[], size: number, fn: (item: T) => Promise<U>, gapMs = 250): Promise<U[]> {
  const out: U[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const results = await Promise.all(batch.map(fn));
    out.push(...results);
    process.stdout.write(`  …processed ${Math.min(i + size, items.length)}/${items.length}\r`);
    if (i + size < items.length) await sleep(gapMs);
  }
  process.stdout.write('\n');
  return out;
}

async function main() {
  const unique = [...new Set(WORDS_RAW.map((w) => w.toLowerCase().trim()))]
    .filter((w) => w.length === 5 && /^[a-z]+$/.test(w));

  // Skip words already in DB so re-runs only fetch missing ones
  const existingRows = await prisma.idiom.findMany({
    where: { phrase: { in: unique } },
    select: { phrase: true },
  });
  const existingSet = new Set(existingRows.map((r) => r.phrase));
  const todo = unique.filter((w) => !existingSet.has(w));

  console.log(`Total unique words: ${unique.length}. Already in DB: ${existingSet.size}. Fetching: ${todo.length}.`);

  const resolved = await inBatches(todo, 3, async (word) => {
    const definition = await fetchDefinition(word);
    return { word, definition };
  });

  const withDef = resolved.filter((r): r is { word: string; definition: string } => r.definition !== null);
  console.log(`Got definitions for ${withDef.length}/${todo.length} new words.`);

  let inserted = 0;
  for (const { word, definition } of withDef) {
    await prisma.idiom.create({
      data: {
        phrase: word,
        clue: definition,
        difficulty: 'easy',
        language: 'word',
      },
    });
    inserted++;
  }

  console.log(`Inserted ${inserted} new word rows. ${todo.length - inserted} words had no available definition.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
