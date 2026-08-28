# DB Table and Column Rename Matrix

Generated from `prisma/schema.prisma` on 2026-04-20.

- `Current table`: physical table today (`@@map` if present, otherwise model name).
- `Target table`: proposed canonical plural `snake_case`.
- Column matrix includes scalar and enum DB columns only (relation fields excluded).

## Table Matrix

| Model | Current table | Target table |
|---|---|---|
| Wedding | `Wedding` | `weddings` |
| UserWedding | `UserWedding` | `user_weddings` |
| Website | `Website` | `websites` |
| User | `User` | `users` |
| Session | `Session` | `sessions` |
| Account | `Account` | `accounts` |
| Organization | `organization` | `organizations` |
| Member | `member` | `members` |
| OrganizationInvitation | `invitation` | `organization_invitations` |
| Verification | `Verification` | `verifications` |
| Household | `Household` | `households` |
| Gift | `Gift` | `gifts` |
| Guest | `Guest` | `guests` |
| Event | `Event` | `events` |
| Question | `Question` | `questions` |
| Option | `Option` | `options` |
| OptionResponse | `OptionResponse` | `option_responses` |
| Answer | `Answer` | `answers` |
| Invitation | `Invitation` | `invitations` |
| GuestTag | `GuestTag` | `guest_tags` |
| GuestTagAssignment | `GuestTagAssignment` | `guest_tag_assignments` |
| Vendor | `Vendor` | `vendors` |
| VendorQuote | `VendorQuote` | `vendor_quotes` |
| VendorQuoteFile | `VendorQuoteFile` | `vendor_quote_files` |
| EttaActor | `etta_actors` | `etta_actors` |
| EttaSuggestion | `etta_suggestions` | `etta_suggestions` |
| EttaMemory | `etta_memory` | `etta_memories` |
| AuditLog | `audit_log` | `audit_logs` |
| GuestQuestion | `guest_questions` | `guest_questions` |
| Faq | `faqs` | `faqs` |
| Notification | `notifications` | `notifications` |
| HouseholdNote | `household_notes` | `household_notes` |

## Wedding (`Wedding` -> `weddings`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `organizationId` | `organizationId` | `organization_id` |
| `groomFirstName` | `groomFirstName` | `groom_first_name` |
| `groomLastName` | `groomLastName` | `groom_last_name` |
| `brideFirstName` | `brideFirstName` | `bride_first_name` |
| `brideLastName` | `brideLastName` | `bride_last_name` |
| `enabledAddOns` | `enabledAddOns` | `enabled_add_ons` |
| `selfFillToken` | `selfFillToken` | `self_fill_token` |
| `selfFillTokenGeneratedAt` | `selfFillTokenGeneratedAt` | `self_fill_token_generated_at` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## UserWedding (`UserWedding` -> `user_weddings`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `userId` | `userId` | `user_id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `role` | `role` | `role` |
| `isPrimary` | `isPrimary` | `is_primary` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Website (`Website` -> `websites`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `url` | `url` | `url` |
| `subUrl` | `subUrl` | `sub_url` |
| `isPasswordEnabled` | `isPasswordEnabled` | `is_password_enabled` |
| `password` | `password` | `password` |
| `isRsvpEnabled` | `isRsvpEnabled` | `is_rsvp_enabled` |
| `coverPhotoUrl` | `coverPhotoUrl` | `cover_photo_url` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## User (`User` -> `users`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `name` | `name` | `name` |
| `email` | `email` | `email` |
| `emailVerified` | `emailVerified` | `email_verified` |
| `image` | `image` | `image` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |
| `websiteUrl` | `websiteUrl` | `website_url` |
| `groomFirstName` | `groomFirstName` | `groom_first_name` |
| `groomLastName` | `groomLastName` | `groom_last_name` |
| `brideFirstName` | `brideFirstName` | `bride_first_name` |
| `brideLastName` | `brideLastName` | `bride_last_name` |

## Session (`Session` -> `sessions`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `expiresAt` | `expiresAt` | `expires_at` |
| `token` | `token` | `token` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |
| `ipAddress` | `ipAddress` | `ip_address` |
| `userAgent` | `userAgent` | `user_agent` |
| `userId` | `userId` | `user_id` |
| `activeOrganizationId` | `activeOrganizationId` | `active_organization_id` |

## Account (`Account` -> `accounts`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `accountId` | `accountId` | `account_id` |
| `providerId` | `providerId` | `provider_id` |
| `userId` | `userId` | `user_id` |
| `accessToken` | `accessToken` | `access_token` |
| `refreshToken` | `refreshToken` | `refresh_token` |
| `idToken` | `idToken` | `id_token` |
| `accessTokenExpiresAt` | `accessTokenExpiresAt` | `access_token_expires_at` |
| `refreshTokenExpiresAt` | `refreshTokenExpiresAt` | `refresh_token_expires_at` |
| `scope` | `scope` | `scope` |
| `password` | `password` | `password` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Organization (`organization` -> `organizations`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `name` | `name` | `name` |
| `slug` | `slug` | `slug` |
| `logo` | `logo` | `logo` |
| `metadata` | `metadata` | `metadata` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Member (`member` -> `members`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `organizationId` | `organizationId` | `organization_id` |
| `userId` | `userId` | `user_id` |
| `role` | `role` | `role` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## OrganizationInvitation (`invitation` -> `organization_invitations`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `organizationId` | `organizationId` | `organization_id` |
| `email` | `email` | `email` |
| `role` | `role` | `role` |
| `status` | `status` | `status` |
| `expiresAt` | `expiresAt` | `expires_at` |
| `createdAt` | `createdAt` | `created_at` |
| `inviterId` | `inviterId` | `inviter_id` |

## Verification (`Verification` -> `verifications`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `identifier` | `identifier` | `identifier` |
| `value` | `value` | `value` |
| `expiresAt` | `expiresAt` | `expires_at` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Household (`Household` -> `households`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `address1` | `address1` | `address1` |
| `address2` | `address2` | `address2` |
| `city` | `city` | `city` |
| `state` | `state` | `state` |
| `zipCode` | `zipCode` | `zip_code` |
| `country` | `country` | `country` |
| `likelihoodOfAttending` | `likelihoodOfAttending` | `likelihood_of_attending` |
| `notes` | `notes` | `notes` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Gift (`Gift` -> `gifts`)

| Prisma field | Current column | Target column |
|---|---|---|
| `householdId` | `householdId` | `household_id` |
| `eventId` | `eventId` | `event_id` |
| `description` | `description` | `description` |
| `thankyou` | `thankyou` | `thankyou` |
| `thankYouSentAt` | `thankYouSentAt` | `thank_you_sent_at` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Guest (`Guest` -> `guests`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `firstName` | `firstName` | `first_name` |
| `lastName` | `lastName` | `last_name` |
| `email` | `email` | `email` |
| `phone` | `phone` | `phone` |
| `householdId` | `householdId` | `household_id` |
| `isPrimaryContact` | `isPrimaryContact` | `is_primary_contact` |
| `ageGroup` | `ageGroup` | `age_group` |
| `isTagAlong` | `isTagAlong` | `is_tag_along` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Event (`Event` -> `events`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `name` | `name` | `name` |
| `date` | `date` | `date` |
| `startTime` | `startTime` | `start_time` |
| `endTime` | `endTime` | `end_time` |
| `venue` | `venue` | `venue` |
| `attire` | `attire` | `attire` |
| `description` | `description` | `description` |
| `collectRsvp` | `collectRsvp` | `collect_rsvp` |
| `allowTagAlongs` | `allowTagAlongs` | `allow_tag_alongs` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Question (`Question` -> `questions`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `eventId` | `eventId` | `event_id` |
| `websiteId` | `websiteId` | `website_id` |
| `text` | `text` | `text` |
| `type` | `type` | `type` |
| `isRequired` | `isRequired` | `is_required` |
| `allowOther` | `allowOther` | `allow_other` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Option (`Option` -> `options`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `responseCount` | `responseCount` | `response_count` |
| `text` | `text` | `text` |
| `description` | `description` | `description` |
| `questionId` | `questionId` | `question_id` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## OptionResponse (`OptionResponse` -> `option_responses`)

| Prisma field | Current column | Target column |
|---|---|---|
| `questionId` | `questionId` | `question_id` |
| `optionId` | `optionId` | `option_id` |
| `guestId` | `guestId` | `guest_id` |
| `householdId` | `householdId` | `household_id` |
| `guestFirstName` | `guestFirstName` | `guest_first_name` |
| `guestLastName` | `guestLastName` | `guest_last_name` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Answer (`Answer` -> `answers`)

| Prisma field | Current column | Target column |
|---|---|---|
| `response` | `response` | `response` |
| `questionId` | `questionId` | `question_id` |
| `guestId` | `guestId` | `guest_id` |
| `householdId` | `householdId` | `household_id` |
| `guestFirstName` | `guestFirstName` | `guest_first_name` |
| `guestLastName` | `guestLastName` | `guest_last_name` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## Invitation (`Invitation` -> `invitations`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `guestId` | `guestId` | `guest_id` |
| `eventId` | `eventId` | `event_id` |
| `rsvp` | `rsvp` | `rsvp` |
| `dietaryRestrictions` | `dietaryRestrictions` | `dietary_restrictions` |
| `submittedBy` | `submittedBy` | `submitted_by` |
| `submittedAt` | `submittedAt` | `submitted_at` |
| `invitedAt` | `invitedAt` | `invited_at` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## GuestTag (`GuestTag` -> `guest_tags`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `name` | `name` | `name` |
| `color` | `color` | `color` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## GuestTagAssignment (`GuestTagAssignment` -> `guest_tag_assignments`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `guestId` | `guestId` | `guest_id` |
| `guestTagId` | `guestTagId` | `guest_tag_id` |
| `createdAt` | `createdAt` | `created_at` |

## Vendor (`Vendor` -> `vendors`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `weddingId` | `wedding_id` |
| `category` | `category` | `category` |
| `name` | `name` | `name` |
| `location` | `location` | `location` |
| `website` | `website` | `website` |
| `instagram` | `instagram` | `instagram` |
| `status` | `status` | `status` |
| `contactName` | `contactName` | `contact_name` |
| `contactEmail` | `contactEmail` | `contact_email` |
| `contactPhone` | `contactPhone` | `contact_phone` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## VendorQuote (`VendorQuote` -> `vendor_quotes`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `vendorId` | `vendorId` | `vendor_id` |
| `price` | `price` | `price` |
| `quoteType` | `quoteType` | `quote_type` |
| `quoteDate` | `quoteDate` | `quote_date` |
| `notes` | `notes` | `notes` |
| `createdAt` | `createdAt` | `created_at` |
| `updatedAt` | `updatedAt` | `updated_at` |

## VendorQuoteFile (`VendorQuoteFile` -> `vendor_quote_files`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `quoteId` | `quoteId` | `quote_id` |
| `name` | `name` | `name` |
| `url` | `url` | `url` |
| `key` | `key` | `key` |
| `size` | `size` | `size` |
| `createdAt` | `createdAt` | `created_at` |

## EttaActor (`etta_actors` -> `etta_actors`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `actorType` | `actor_type` | `actor_type` |
| `permissions` | `permissions` | `permissions` |
| `provisionedAt` | `provisioned_at` | `provisioned_at` |
| `lastActiveAt` | `last_active_at` | `last_active_at` |
| `revokedAt` | `revoked_at` | `revoked_at` |

## EttaSuggestion (`etta_suggestions` -> `etta_suggestions`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `actorId` | `actor_id` | `actor_id` |
| `actionType` | `action_type` | `action_type` |
| `tier` | `tier` | `tier` |
| `payload` | `payload` | `payload` |
| `summary` | `summary` | `summary` |
| `status` | `status` | `status` |
| `chatMessageId` | `chat_message_id` | `chat_message_id` |
| `createdAt` | `created_at` | `created_at` |
| `resolvedAt` | `resolved_at` | `resolved_at` |
| `resolvedBy` | `resolved_by` | `resolved_by` |

## EttaMemory (`etta_memory` -> `etta_memories`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `content` | `content` | `content` |
| `createdAt` | `created_at` | `created_at` |

## AuditLog (`audit_log` -> `audit_logs`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `actorId` | `actor_id` | `actor_id` |
| `actorType` | `actor_type` | `actor_type` |
| `action` | `action` | `action` |
| `resourceType` | `resource_type` | `resource_type` |
| `resourceId` | `resource_id` | `resource_id` |
| `tier` | `tier` | `tier` |
| `payloadSnapshot` | `payload_snapshot` | `payload_snapshot` |
| `createdAt` | `created_at` | `created_at` |

## GuestQuestion (`guest_questions` -> `guest_questions`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `guestId` | `guest_id` | `guest_id` |
| `question` | `question` | `question` |
| `context` | `context` | `context` |
| `answered` | `answered` | `answered` |
| `answer` | `answer` | `answer` |
| `createdAt` | `created_at` | `created_at` |
| `answeredAt` | `answered_at` | `answered_at` |

## Faq (`faqs` -> `faqs`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `question` | `question` | `question` |
| `answer` | `answer` | `answer` |
| `published` | `published` | `published` |
| `createdAt` | `created_at` | `created_at` |

## Notification (`notifications` -> `notifications`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `type` | `type` | `type` |
| `payload` | `payload` | `payload` |
| `read` | `read` | `read` |
| `createdAt` | `created_at` | `created_at` |

## HouseholdNote (`household_notes` -> `household_notes`)

| Prisma field | Current column | Target column |
|---|---|---|
| `id` | `id` | `id` |
| `householdId` | `household_id` | `household_id` |
| `weddingId` | `wedding_id` | `wedding_id` |
| `message` | `message` | `message` |
| `actorType` | `actor_type` | `actor_type` |
| `createdAt` | `created_at` | `created_at` |
