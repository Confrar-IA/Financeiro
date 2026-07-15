-- CreateEnum
-- SQLite stores enums as TEXT; Prisma tracks PaymentMethod in schema.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "categoryId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceMonths" INTEGER,
    "installments" INTEGER,
    "installmentIndex" INTEGER,
    "seriesId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "new_Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "new_Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Transaction" (
    "id",
    "description",
    "amount",
    "type",
    "date",
    "categoryId",
    "paymentMethod",
    "userId",
    "isRecurring",
    "recurrenceMonths",
    "installments",
    "installmentIndex",
    "seriesId",
    "createdAt",
    "updatedAt"
)
SELECT
    t."id",
    t."description",
    t."amount",
    t."type",
    t."date",
    t."categoryId",
    CASE
        WHEN t."type" = 'income' AND a."type" = 'bank' THEN 'account'
        WHEN t."type" = 'income' THEN 'cash'
        WHEN a."type" = 'card' THEN 'credit'
        WHEN a."type" = 'bank' THEN 'debit'
        WHEN a."type" = 'wallet' THEN 'cash'
        ELSE 'pix'
    END,
    t."userId",
    t."isRecurring",
    t."recurrenceMonths",
    t."installments",
    t."installmentIndex",
    t."seriesId",
    t."createdAt",
    t."updatedAt"
FROM "Transaction" AS t
LEFT JOIN "Account" AS a ON a."id" = t."accountId";

DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";

CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
CREATE INDEX "Transaction_paymentMethod_idx" ON "Transaction"("paymentMethod");
CREATE INDEX "Transaction_seriesId_idx" ON "Transaction"("seriesId");

DROP TABLE "Account";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
