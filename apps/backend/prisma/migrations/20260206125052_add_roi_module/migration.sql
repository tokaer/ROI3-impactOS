-- CreateTable
CREATE TABLE "RoiSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "discountRate" REAL NOT NULL DEFAULT 0.08,
    "taxRate" REAL NOT NULL DEFAULT 0.30,
    "cashflowHorizonYears" INTEGER NOT NULL DEFAULT 10
);

-- CreateTable
CREATE TABLE "Variable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT '',
    "method" TEXT NOT NULL DEFAULT 'fix',
    "startYear" INTEGER NOT NULL,
    "horizonYears" INTEGER NOT NULL DEFAULT 10,
    "startValue" REAL NOT NULL DEFAULT 0,
    "cagr" REAL NOT NULL DEFAULT 0,
    "manualValues" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFEN',
    "assigneeId" TEXT,
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "progressNote" TEXT,
    "kpiName" TEXT,
    "kpiUnit" TEXT,
    "kpiBaselinePerYear" REAL,
    "impactType" TEXT,
    "impactValue" REAL,
    "monetizationFixedEurPerUnit" REAL,
    "monetizationVariableId" TEXT,
    "capexEquipment" REAL,
    "capexInstallation" REAL,
    "capexSoftware" REAL,
    "capexConsulting" REAL,
    "capexOther" REAL,
    "grantAmount" REAL,
    "grantPercent" REAL,
    "opexMaintenance" REAL,
    "opexLicenses" REAL,
    "opexPersonnel" REAL,
    "opexOther" REAL,
    "otherBenefitsPerYear" REAL,
    "otherCostsPerYear" REAL,
    "depreciationYears" INTEGER,
    "justification" TEXT,
    CONSTRAINT "Action_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Action_monetizationVariableId_fkey" FOREIGN KEY ("monetizationVariableId") REFERENCES "Variable" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Action" ("assigneeId", "createdAt", "description", "dueDate", "id", "progressNote", "startDate", "status", "title", "updatedAt") SELECT "assigneeId", "createdAt", "description", "dueDate", "id", "progressNote", "startDate", "status", "title", "updatedAt" FROM "Action";
DROP TABLE "Action";
ALTER TABLE "new_Action" RENAME TO "Action";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
