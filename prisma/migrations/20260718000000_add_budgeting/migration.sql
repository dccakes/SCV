-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "target_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_categories" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planned_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_expenses" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_deposit" BOOLEAN NOT NULL DEFAULT false,
    "is_refundable" BOOLEAN NOT NULL DEFAULT false,
    "refunded_at" TIMESTAMP(3),
    "paid_at" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budgets_wedding_id_key" ON "budgets"("wedding_id");

-- CreateIndex
CREATE INDEX "budgets_wedding_id_idx" ON "budgets"("wedding_id");

-- CreateIndex
CREATE INDEX "budget_categories_wedding_id_idx" ON "budget_categories"("wedding_id");

-- CreateIndex
CREATE INDEX "budget_categories_wedding_id_position_idx" ON "budget_categories"("wedding_id", "position");

-- CreateIndex
CREATE INDEX "budget_expenses_wedding_id_idx" ON "budget_expenses"("wedding_id");

-- CreateIndex
CREATE INDEX "budget_expenses_category_id_idx" ON "budget_expenses"("category_id");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_wedding_id_fkey"
    FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_wedding_id_fkey"
    FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_expenses" ADD CONSTRAINT "budget_expenses_wedding_id_fkey"
    FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_expenses" ADD CONSTRAINT "budget_expenses_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "budget_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
