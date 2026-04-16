-- Add planner-controlled toggle for exposing "Other" write-in in multiple-choice RSVP questions
ALTER TABLE "Question"
ADD COLUMN "allowOther" BOOLEAN NOT NULL DEFAULT false;
