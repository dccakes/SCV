-- Add deterministic ordering and meal-choice marker for event questions
ALTER TABLE "question"
ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isMealChoiceQuestion" BOOLEAN NOT NULL DEFAULT false;
