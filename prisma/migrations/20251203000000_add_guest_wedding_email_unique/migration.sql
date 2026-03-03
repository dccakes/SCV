-- Add unique constraint on (weddingId, email) to prevent duplicate email registrations per wedding.
-- PostgreSQL UNIQUE constraints exclude NULL values, so multiple guests without email are allowed.
CREATE UNIQUE INDEX "Guest_weddingId_email_key" ON "Guest"("weddingId", "email");
