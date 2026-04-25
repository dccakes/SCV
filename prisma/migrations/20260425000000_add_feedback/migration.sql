-- User feedback on Etta (open-ended + reactions on chat messages and suggestions)

CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "user_id" TEXT,
    "messaging_identity_id" TEXT,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reaction" TEXT,
    "body" TEXT,
    "chat_message_id" TEXT,
    "etta_suggestion_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedback_wedding_id_created_at_idx"
    ON "feedback"("wedding_id", "created_at");

CREATE INDEX "feedback_kind_source_idx"
    ON "feedback"("kind", "source");

ALTER TABLE "feedback"
    ADD CONSTRAINT "feedback_wedding_id_fkey"
    FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
