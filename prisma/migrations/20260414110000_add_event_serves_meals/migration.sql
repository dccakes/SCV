-- Add servesMeals toggle for Smart RSVP meal workflows
ALTER TABLE "event"
ADD COLUMN "servesMeals" BOOLEAN NOT NULL DEFAULT false;
