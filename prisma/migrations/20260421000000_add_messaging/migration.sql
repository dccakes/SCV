-- Telegram couple-bot + rate-limit infrastructure

CREATE TABLE "messaging_identities" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "external_chat_id" TEXT NOT NULL,
    "external_user_id" TEXT,
    "display_name" TEXT,
    "linked_by_user_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "pending_invoke_seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "messaging_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messaging_identities_channel_external_chat_id_key"
    ON "messaging_identities"("channel", "external_chat_id");

CREATE INDEX "messaging_identities_wedding_id_idx"
    ON "messaging_identities"("wedding_id");

ALTER TABLE "messaging_identities"
    ADD CONSTRAINT "messaging_identities_wedding_id_fkey"
    FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "messaging_pairing_tokens" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "consumed_chat_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messaging_pairing_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messaging_pairing_tokens_token_key"
    ON "messaging_pairing_tokens"("token");

CREATE INDEX "messaging_pairing_tokens_wedding_id_idx"
    ON "messaging_pairing_tokens"("wedding_id");

ALTER TABLE "messaging_pairing_tokens"
    ADD CONSTRAINT "messaging_pairing_tokens_wedding_id_fkey"
    FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachment_url" TEXT,
    "attachment_name" TEXT,
    "external_message_id" TEXT,
    "summarized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_messages_identity_id_external_message_id_key"
    ON "chat_messages"("identity_id", "external_message_id");

CREATE INDEX "chat_messages_identity_id_created_at_idx"
    ON "chat_messages"("identity_id", "created_at");

CREATE INDEX "chat_messages_identity_id_summarized_at_idx"
    ON "chat_messages"("identity_id", "summarized_at");

CREATE INDEX "chat_messages_wedding_id_idx"
    ON "chat_messages"("wedding_id");

ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_identity_id_fkey"
    FOREIGN KEY ("identity_id") REFERENCES "messaging_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_wedding_id_fkey"
    FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "rate_limit_buckets" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rate_limit_buckets_key_key" ON "rate_limit_buckets"("key");
CREATE INDEX "rate_limit_buckets_window_start_idx" ON "rate_limit_buckets"("window_start");
