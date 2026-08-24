-- AlterTable
ALTER TABLE "budget_expenses"
    ADD COLUMN "estimated_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN "due_at" DATE;
