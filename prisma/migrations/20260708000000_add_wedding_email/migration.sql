-- CreateTable: wedding_email_inboxes (one dedicated inbound address per wedding)
CREATE TABLE "wedding_email_inboxes" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "local_part" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "provisioned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMP(3),

    CONSTRAINT "wedding_email_inboxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wedding_email_inboxes_wedding_id_key" ON "wedding_email_inboxes"("wedding_id");
CREATE UNIQUE INDEX "wedding_email_inboxes_local_part_key" ON "wedding_email_inboxes"("local_part");
CREATE UNIQUE INDEX "wedding_email_inboxes_address_key" ON "wedding_email_inboxes"("address");

-- AddForeignKey
ALTER TABLE "wedding_email_inboxes" ADD CONSTRAINT "wedding_email_inboxes_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: email_threads (one conversation per counterparty)
CREATE TABLE "email_threads" (
    "id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "counterparty_email" TEXT NOT NULL,
    "counterparty_name" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'open',
    "vendor_id" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_threads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_threads_wedding_id_counterparty_email_key" ON "email_threads"("wedding_id", "counterparty_email");
CREATE INDEX "email_threads_wedding_id_last_message_at_idx" ON "email_threads"("wedding_id", "last_message_at" DESC);
CREATE INDEX "email_threads_wedding_id_status_idx" ON "email_threads"("wedding_id", "status");

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: email_messages (inbound + outbound verbatim record)
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "from_name" TEXT,
    "to_addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cc_addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "text" TEXT,
    "html" TEXT,
    "provider_id" TEXT,
    "message_id_header" TEXT,
    "in_reply_to" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_provider_id_key" ON "email_messages"("provider_id");
CREATE INDEX "email_messages_thread_id_created_at_idx" ON "email_messages"("thread_id", "created_at");
CREATE INDEX "email_messages_wedding_id_created_at_idx" ON "email_messages"("wedding_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "email_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: email_triage (AI verdict per inbound message)
CREATE TABLE "email_triage" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "wedding_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "suggested_actions" JSONB NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_triage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_triage_message_id_key" ON "email_triage"("message_id");
CREATE INDEX "email_triage_wedding_id_status_idx" ON "email_triage"("wedding_id", "status");

-- AddForeignKey
ALTER TABLE "email_triage" ADD CONSTRAINT "email_triage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
