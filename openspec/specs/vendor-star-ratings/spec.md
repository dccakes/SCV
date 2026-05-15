### Requirement: Users can submit a vendor star rating
The system SHALL allow an authenticated wedding member to create or update their own star rating for any vendor in their wedding. Ratings MUST be integers from 1 through 5 when provided.

#### Scenario: User rates a vendor
- **WHEN** a wedding member submits a star value between 1 and 5 for a vendor in their wedding
- **THEN** the system stores that value as the member's current rating for that vendor

#### Scenario: User updates an existing rating
- **WHEN** a wedding member who has already rated a vendor submits a different star value between 1 and 5
- **THEN** the system updates the existing rating for that `(vendor, user)` pair instead of creating a duplicate

#### Scenario: Unauthorized rating attempt is rejected
- **WHEN** a user submits a rating for a vendor outside their wedding
- **THEN** the system rejects the request and does not persist any rating

### Requirement: Vendor ratings support an unrated state
The system SHALL support vendors with no ratings and users with no rating for a vendor. Missing ratings MUST be treated as unrated, not as numeric zero.

#### Scenario: Vendor has no submitted ratings
- **WHEN** a vendor has no rating entries
- **THEN** the system returns the vendor as unrated and no average rating value

#### Scenario: Some users have not rated
- **WHEN** a vendor has ratings from only a subset of wedding members
- **THEN** the system treats non-submissions as unrated and excludes them from numeric calculations

### Requirement: Vendor average rating is computed from submitted ratings only
The system SHALL compute vendor average rating using only submitted non-null user ratings for that vendor.

#### Scenario: Average is based on available ratings
- **WHEN** a vendor has ratings from multiple users
- **THEN** the returned average equals the arithmetic mean of those submitted ratings only

#### Scenario: No average for unrated vendor
- **WHEN** a vendor has no submitted ratings
- **THEN** the system does not return an average star value

### Requirement: Vendor rating views expose aggregate and per-user data
The system SHALL provide vendor rating data for UI display as both an aggregate average and a per-user breakdown for authorized wedding members.

#### Scenario: Vendor list shows aggregate rating
- **WHEN** vendor data is requested for list or card rendering
- **THEN** each vendor includes an aggregate average rating when at least one rating exists

#### Scenario: User inspects rating breakdown
- **WHEN** an authorized wedding member requests or reveals rating details for a vendor
- **THEN** the system provides each submitted user rating for that vendor so the UI can show who rated what
