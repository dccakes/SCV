-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "cursor" TEXT,
    "pageToken" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "vendorId" TEXT,
    "provider" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "externalThreadId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "snippet" TEXT,
    "senderAddress" TEXT NOT NULL,
    "senderName" TEXT,
    "recipientAddresses" TEXT[],
    "direction" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_connectionId_key" ON "SyncState"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunicationMessage_connectionId_externalMessageId_key" ON "CommunicationMessage"("connectionId", "externalMessageId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_weddingId_vendorId_idx" ON "CommunicationMessage"("weddingId", "vendorId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_externalThreadId_idx" ON "CommunicationMessage"("externalThreadId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_weddingId_sentAt_idx" ON "CommunicationMessage"("weddingId", "sentAt");

-- CreateIndex
CREATE INDEX "CommunicationMessage_connectionId_idx" ON "CommunicationMessage"("connectionId");

-- AddForeignKey
ALTER TABLE "SyncState" ADD CONSTRAINT "SyncState_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
