-- Enforce at most one meal-choice question per event
CREATE UNIQUE INDEX "question_event_meal_choice_unique"
ON "Question" ("eventId")
WHERE "isMealChoiceQuestion" = true;
