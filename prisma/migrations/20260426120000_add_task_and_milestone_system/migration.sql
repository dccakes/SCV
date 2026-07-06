-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM (
    'VENUE',
    'VENDORS',
    'ATTIRE',
    'STATIONERY',
    'GUESTS',
    'LEGAL',
    'CEREMONY',
    'RECEPTION',
    'BEAUTY',
    'HONEYMOON',
    'BUDGET',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "MilestoneCategory" AS ENUM (
    'SETUP',
    'VENDORS',
    'INVITATIONS',
    'LEGAL',
    'FINALE'
);

-- CreateEnum
CREATE TYPE "MilestoneOverrideStatus" AS ENUM (
    'attested',
    'dismissed'
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "MilestoneCategory" NOT NULL,
    "position" INTEGER NOT NULL,
    "targetDate" DATE,
    "userOverrideStatus" "MilestoneOverrideStatus",
    "attestedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Milestone_override_state_check" CHECK (
        ("userOverrideStatus" IS NULL AND "attestedAt" IS NULL AND "dismissedAt" IS NULL)
        OR ("userOverrideStatus" = 'attested' AND "attestedAt" IS NOT NULL AND "dismissedAt" IS NULL)
        OR ("userOverrideStatus" = 'dismissed' AND "dismissedAt" IS NOT NULL AND "attestedAt" IS NULL)
    )
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "vendorId" TEXT,
    "milestoneId" TEXT,
    "seedKey" TEXT,
    "title" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "monthsBeforeWedding" INTEGER NOT NULL,
    "dueDate" DATE,
    "description" TEXT,
    "notes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Task_completion_state_check" CHECK (
        ("completed" = false AND "completedAt" IS NULL)
        OR ("completed" = true AND "completedAt" IS NOT NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_weddingId_key_key" ON "Milestone"("weddingId", "key");

-- CreateIndex
CREATE INDEX "Milestone_weddingId_idx" ON "Milestone"("weddingId");

-- CreateIndex
CREATE INDEX "Milestone_weddingId_category_position_idx" ON "Milestone"("weddingId", "category", "position");

-- CreateIndex
CREATE INDEX "Milestone_weddingId_userOverrideStatus_idx" ON "Milestone"("weddingId", "userOverrideStatus");

-- CreateIndex
CREATE INDEX "Milestone_weddingId_targetDate_idx" ON "Milestone"("weddingId", "targetDate");

-- CreateIndex
CREATE INDEX "Task_weddingId_idx" ON "Task"("weddingId");

-- CreateIndex
CREATE INDEX "Task_eventId_idx" ON "Task"("eventId");

-- CreateIndex
CREATE INDEX "Task_weddingId_eventId_idx" ON "Task"("weddingId", "eventId");

-- CreateIndex
CREATE INDEX "Task_vendorId_idx" ON "Task"("vendorId");

-- CreateIndex
CREATE INDEX "Task_weddingId_vendorId_idx" ON "Task"("weddingId", "vendorId");

-- CreateIndex
CREATE INDEX "Task_milestoneId_idx" ON "Task"("milestoneId");

-- CreateIndex
CREATE INDEX "Task_weddingId_milestoneId_idx" ON "Task"("weddingId", "milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_weddingId_seedKey_key" ON "Task"("weddingId", "seedKey");

-- CreateIndex
CREATE INDEX "Task_weddingId_category_completed_position_idx" ON "Task"("weddingId", "category", "completed", "position");

-- CreateIndex
CREATE INDEX "Task_weddingId_eventId_completed_dueDate_idx" ON "Task"("weddingId", "eventId", "completed", "dueDate");

-- CreateIndex
CREATE INDEX "Task_weddingId_monthsBeforeWedding_position_idx" ON "Task"("weddingId", "monthsBeforeWedding", "position");

-- CreateIndex
CREATE INDEX "Task_weddingId_completed_completedAt_idx" ON "Task"("weddingId", "completed", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_weddingId_id_key" ON "Event"("weddingId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_weddingId_id_key" ON "Vendor"("weddingId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_weddingId_id_key" ON "Milestone"("weddingId", "id");

-- AddForeignKey
ALTER TABLE "Milestone"
    ADD CONSTRAINT "Milestone_weddingId_fkey"
    FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task"
    ADD CONSTRAINT "Task_weddingId_fkey"
    FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task"
    ADD CONSTRAINT "Task_weddingId_eventId_fkey"
    FOREIGN KEY ("weddingId", "eventId") REFERENCES "Event"("weddingId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task"
    ADD CONSTRAINT "Task_weddingId_vendorId_fkey"
    FOREIGN KEY ("weddingId", "vendorId") REFERENCES "Vendor"("weddingId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task"
    ADD CONSTRAINT "Task_weddingId_milestoneId_fkey"
    FOREIGN KEY ("weddingId", "milestoneId") REFERENCES "Milestone"("weddingId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill the checklist add-on for weddings that can actually use it.
UPDATE "Wedding" AS w
SET "enabledAddOns" = array_append(COALESCE(w."enabledAddOns", ARRAY[]::TEXT[]), 'tasks')
WHERE EXISTS (
    SELECT 1
    FROM "Event" AS e
    WHERE e."weddingId" = w."id"
)
AND NOT ('tasks' = ANY(COALESCE(w."enabledAddOns", ARRAY[]::TEXT[])));

-- Backfill default milestones for existing weddings with at least one event.
-- The canonical seed list is duplicated here intentionally because application seed constants are not available inside migration SQL.
WITH milestone_seed("seedKey", "title", "category", "position") AS (
    VALUES
        ('date_set', 'Date set', 'SETUP'::"MilestoneCategory", 0),
        ('guest_list_drafted', 'Guest list drafted', 'SETUP'::"MilestoneCategory", 1),
        ('venue_booked', 'Venue booked', 'VENDORS'::"MilestoneCategory", 2),
        ('photographer_booked', 'Photographer booked', 'VENDORS'::"MilestoneCategory", 3),
        ('caterer_booked', 'Caterer booked', 'VENDORS'::"MilestoneCategory", 4),
        ('florist_booked', 'Florist booked', 'VENDORS'::"MilestoneCategory", 5),
        ('save_the_dates_sent', 'Save-the-dates sent', 'INVITATIONS'::"MilestoneCategory", 6),
        ('invitations_sent', 'Invitations sent', 'INVITATIONS'::"MilestoneCategory", 7),
        ('rsvps_collected', 'RSVPs collected', 'INVITATIONS'::"MilestoneCategory", 8),
        ('officiant_chosen', 'Officiant chosen', 'LEGAL'::"MilestoneCategory", 9),
        ('marriage_license_obtained', 'Marriage license obtained', 'LEGAL'::"MilestoneCategory", 10),
        ('final_headcount_sent', 'Final headcount sent to caterer', 'FINALE'::"MilestoneCategory", 11),
        ('wedding_day', 'Wedding day', 'FINALE'::"MilestoneCategory", 12)
),
eligible_weddings AS (
    SELECT w."id"
    FROM "Wedding" AS w
    WHERE EXISTS (
        SELECT 1
        FROM "Event" AS e
        WHERE e."weddingId" = w."id"
    )
)
INSERT INTO "Milestone" (
    "id",
    "weddingId",
    "key",
    "title",
    "category",
    "position",
    "targetDate",
    "userOverrideStatus",
    "attestedAt",
    "dismissedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::TEXT,
    ew."id",
    ms."seedKey",
    ms."title",
    ms."category",
    ms."position",
    NULL,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM eligible_weddings AS ew
CROSS JOIN milestone_seed AS ms
LEFT JOIN "Milestone" AS existing_milestone
    ON existing_milestone."weddingId" = ew."id"
   AND existing_milestone."key" = ms."seedKey"
WHERE existing_milestone."id" IS NULL;

-- Backfill default tasks for existing weddings with at least one event.
-- Tasks are assigned to the primary event, resolved as the first event by createdAt then id.
WITH primary_events AS (
    SELECT DISTINCT ON (e."weddingId")
        e."weddingId",
        e."id" AS "eventId"
    FROM "Event" AS e
    ORDER BY e."weddingId", e."createdAt" ASC, e."id" ASC
),
task_seed(
    "seedKey",
    "position",
    "monthsBeforeWedding",
    "category",
    "title",
    "milestoneKey"
) AS (
    VALUES
        ('set_wedding_budget', 0, 12, 'BUDGET'::"TaskCategory", 'Set the wedding budget', NULL),
        ('decide_rough_guest_count', 1, 12, 'GUESTS'::"TaskCategory", 'Decide rough guest count', NULL),
        ('decide_ceremony_location_region', 2, 12, 'VENUE'::"TaskCategory", 'Decide ceremony location/region', NULL),
        ('tour_ceremony_venues', 3, 12, 'VENUE'::"TaskCategory", 'Tour ceremony venues', NULL),
        ('tour_reception_venues', 4, 12, 'VENUE'::"TaskCategory", 'Tour reception venues (if separate from ceremony)', NULL),
        ('book_ceremony_venue', 5, 12, 'VENUE'::"TaskCategory", 'Book ceremony venue', 'venue_booked'),
        ('book_reception_venue', 6, 12, 'VENUE'::"TaskCategory", 'Book reception venue (if separate)', 'venue_booked'),
        ('hire_wedding_planner', 7, 12, 'VENDORS'::"TaskCategory", 'Hire wedding planner (optional)', NULL),
        ('decide_overall_vision_style', 8, 12, 'OTHER'::"TaskCategory", 'Decide on overall vision and style', NULL),
        ('start_attire_research', 9, 12, 'ATTIRE'::"TaskCategory", 'Start research on dress / suit options', NULL),
        ('finalize_guest_list_first_pass', 10, 9, 'GUESTS'::"TaskCategory", 'Finalize guest list (first pass)', 'guest_list_drafted'),
        ('book_photographer', 11, 9, 'VENDORS'::"TaskCategory", 'Book photographer', 'photographer_booked'),
        ('book_videographer', 12, 9, 'VENDORS'::"TaskCategory", 'Book videographer (optional)', NULL),
        ('book_caterer', 13, 9, 'VENDORS'::"TaskCategory", 'Book caterer', 'caterer_booked'),
        ('choose_officiant', 14, 9, 'CEREMONY'::"TaskCategory", 'Choose officiant', 'officiant_chosen'),
        ('send_save_the_dates', 15, 9, 'STATIONERY'::"TaskCategory", 'Send save-the-dates', 'save_the_dates_sent'),
        ('order_wedding_attire', 16, 9, 'ATTIRE'::"TaskCategory", 'Order or buy wedding dress / suit', NULL),
        ('book_dj_or_band', 17, 9, 'VENDORS'::"TaskCategory", 'Book DJ or band', NULL),
        ('set_up_wedding_website', 18, 9, 'OTHER'::"TaskCategory", 'Set up wedding website', NULL),
        ('block_hotel_rooms', 19, 9, 'GUESTS'::"TaskCategory", 'Block hotel rooms for out-of-town guests', NULL),
        ('book_florist', 20, 6, 'VENDORS'::"TaskCategory", 'Book florist', 'florist_booked'),
        ('book_hair_makeup_artist', 21, 6, 'BEAUTY'::"TaskCategory", 'Book hair & makeup artist', NULL),
        ('choose_wedding_party', 22, 6, 'OTHER'::"TaskCategory", 'Choose wedding party', NULL),
        ('order_wedding_party_attire', 23, 6, 'ATTIRE'::"TaskCategory", 'Order wedding party attire', NULL),
        ('plan_honeymoon', 24, 6, 'HONEYMOON'::"TaskCategory", 'Plan honeymoon', NULL),
        ('choose_ceremony_readings_music', 25, 6, 'CEREMONY'::"TaskCategory", 'Choose ceremony readings and music', NULL),
        ('order_wedding_bands', 26, 6, 'OTHER'::"TaskCategory", 'Order wedding bands', NULL),
        ('decide_invitation_design', 27, 6, 'STATIONERY'::"TaskCategory", 'Decide on invitation design', NULL),
        ('order_stationery_suite', 28, 6, 'STATIONERY'::"TaskCategory", 'Order full stationery suite', NULL),
        ('send_formal_invitations', 29, 3, 'STATIONERY'::"TaskCategory", 'Send formal invitations', 'invitations_sent'),
        ('schedule_attire_fittings', 30, 3, 'ATTIRE'::"TaskCategory", 'Schedule dress / suit fittings', NULL),
        ('write_vows', 31, 3, 'CEREMONY'::"TaskCategory", 'Write vows', NULL),
        ('plan_rehearsal_dinner', 32, 3, 'RECEPTION'::"TaskCategory", 'Plan rehearsal dinner', NULL),
        ('research_marriage_license_requirements', 33, 3, 'LEGAL'::"TaskCategory", 'Research marriage license requirements', NULL),
        ('confirm_vendor_details', 34, 3, 'VENDORS'::"TaskCategory", 'Confirm details with all booked vendors', NULL),
        ('plan_ceremony_order_timing', 35, 3, 'CEREMONY'::"TaskCategory", 'Plan ceremony order and timing', NULL),
        ('buy_wedding_rings', 36, 3, 'OTHER'::"TaskCategory", 'Buy wedding rings (if not already done)', NULL),
        ('collect_outstanding_rsvps', 37, 1, 'GUESTS'::"TaskCategory", 'Collect outstanding RSVPs', 'rsvps_collected'),
        ('send_final_headcount_to_caterer', 38, 1, 'RECEPTION'::"TaskCategory", 'Send final headcount to caterer', 'final_headcount_sent'),
        ('create_seating_chart', 39, 1, 'GUESTS'::"TaskCategory", 'Create seating chart', NULL),
        ('final_attire_fitting', 40, 1, 'ATTIRE'::"TaskCategory", 'Final dress / suit fitting', NULL),
        ('confirm_transportation_arrangements', 41, 1, 'OTHER'::"TaskCategory", 'Confirm transportation arrangements', NULL),
        ('confirm_honeymoon_details', 42, 1, 'HONEYMOON'::"TaskCategory", 'Confirm honeymoon details', NULL),
        ('get_marriage_license', 43, 1, 'LEGAL'::"TaskCategory", 'Get marriage license', 'marriage_license_obtained'),
        ('pay_remaining_vendor_balances', 44, 1, 'BUDGET'::"TaskCategory", 'Pay remaining vendor balances', NULL),
        ('pack_for_honeymoon', 45, 1, 'HONEYMOON'::"TaskCategory", 'Pack for honeymoon', NULL),
        ('confirm_vendor_arrival_times', 46, 0, 'VENDORS'::"TaskCategory", 'Confirm vendor arrival times', NULL),
        ('provide_shot_list_to_photographer', 47, 0, 'VENDORS'::"TaskCategory", 'Provide shot list to photographer', NULL),
        ('final_venue_walkthrough', 48, 0, 'VENUE'::"TaskCategory", 'Final venue walkthrough', NULL),
        ('pick_up_wedding_rings', 49, 0, 'OTHER'::"TaskCategory", 'Pick up wedding rings', NULL),
        ('break_in_wedding_shoes', 50, 0, 'ATTIRE'::"TaskCategory", 'Break in wedding shoes (if new)', NULL),
        ('wedding_rehearsal', 51, 0, 'CEREMONY'::"TaskCategory", 'Wedding rehearsal', NULL),
        ('rehearsal_dinner', 52, 0, 'RECEPTION'::"TaskCategory", 'Rehearsal dinner', NULL),
        ('pack_overnight_bag', 53, 0, 'OTHER'::"TaskCategory", 'Pack overnight bag', NULL),
        ('hair_and_makeup', 54, 0, 'BEAUTY'::"TaskCategory", 'Hair and makeup', NULL),
        ('hand_off_rings_to_officiant', 55, 0, 'CEREMONY'::"TaskCategory", 'Hand off rings to officiant', NULL),
        ('enjoy_the_day', 56, 0, 'OTHER'::"TaskCategory", 'Enjoy the day', NULL),
        ('send_thank_you_notes', 57, -1, 'GUESTS'::"TaskCategory", 'Send thank-you notes', NULL)
),
eligible_weddings AS (
    SELECT pe."weddingId", pe."eventId"
    FROM primary_events AS pe
),
existing_canonical_candidates AS (
    SELECT
        ew."weddingId",
        ew."eventId",
        ts."seedKey",
        t."id" AS "taskId",
        m."id" AS "canonicalMilestoneId",
        ROW_NUMBER() OVER (
            PARTITION BY ew."weddingId", ts."seedKey"
            ORDER BY
                CASE
                    WHEN (ts."milestoneKey" IS NULL AND t."milestoneId" IS NULL) OR t."milestoneId" = m."id" THEN 0
                    ELSE 1
                END,
                t."createdAt" ASC,
                t."id" ASC
        ) AS "rank"
    FROM eligible_weddings AS ew
    CROSS JOIN task_seed AS ts
    JOIN "Task" AS t
        ON t."weddingId" = ew."weddingId"
       AND t."isDefault" = true
       AND t."title" = ts."title"
       AND t."category" = ts."category"
       AND t."monthsBeforeWedding" = ts."monthsBeforeWedding"
    LEFT JOIN "Milestone" AS m
        ON m."weddingId" = ew."weddingId"
       AND m."key" = ts."milestoneKey"
),
updated_canonical_tasks AS (
    UPDATE "Task" AS t
    SET
        "eventId" = c."eventId",
        "seedKey" = c."seedKey",
        "milestoneId" = c."canonicalMilestoneId"
    FROM existing_canonical_candidates AS c
    WHERE t."id" = c."taskId"
      AND c."rank" = 1
      AND (
            t."eventId" IS DISTINCT FROM c."eventId"
            OR
            t."seedKey" IS DISTINCT FROM c."seedKey"
            OR t."milestoneId" IS DISTINCT FROM c."canonicalMilestoneId"
      )
    RETURNING t."id"
)
INSERT INTO "Task" (
    "id",
    "weddingId",
    "eventId",
    "vendorId",
    "milestoneId",
    "seedKey",
    "title",
    "category",
    "monthsBeforeWedding",
    "dueDate",
    "description",
    "notes",
    "isDefault",
    "position",
    "completed",
    "completedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::TEXT,
    ew."weddingId",
    ew."eventId",
    NULL,
    m."id",
    ts."seedKey",
    ts."title",
    ts."category",
    ts."monthsBeforeWedding",
    NULL,
    NULL,
    NULL,
    true,
    ts."position",
    false,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM eligible_weddings AS ew
CROSS JOIN task_seed AS ts
LEFT JOIN "Milestone" AS m
    ON m."weddingId" = ew."weddingId"
   AND m."key" = ts."milestoneKey"
LEFT JOIN "Task" AS existing_task
    ON existing_task."weddingId" = ew."weddingId"
   AND existing_task."seedKey" = ts."seedKey"
WHERE existing_task."id" IS NULL;
