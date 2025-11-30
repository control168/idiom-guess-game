-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Idiom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phrase" TEXT NOT NULL,
    "clue" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Idiom" ("clue", "createdAt", "difficulty", "id", "phrase") SELECT "clue", "createdAt", "difficulty", "id", "phrase" FROM "Idiom";
DROP TABLE "Idiom";
ALTER TABLE "new_Idiom" RENAME TO "Idiom";
CREATE UNIQUE INDEX "Idiom_phrase_key" ON "Idiom"("phrase");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
