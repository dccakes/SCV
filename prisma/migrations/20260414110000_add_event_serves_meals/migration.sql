-- Add servesMeals toggle for Smart RSVP meal workflows
ALTER TABLE "Event"
ADD COLUMN "servesMeals" BOOLEAN NOT NULL DEFAULT false;
