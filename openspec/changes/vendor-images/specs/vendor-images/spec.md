## ADDED Requirements

### Requirement: Vendor can have up to 5 images
A vendor SHALL support up to 5 images stored in `VendorImage` records, attached to the vendor entity (not to a quote). Images are optional for all vendor categories.

#### Scenario: Image is added within limit
- **WHEN** a couple uploads an image for a vendor that has fewer than 5 images
- **THEN** the image is stored in Vercel Blob and a `VendorImage` record is created with the resulting URL, key, size, and name

#### Scenario: Image upload is rejected at limit
- **WHEN** a couple attempts to upload an image for a vendor that already has 5 images
- **THEN** the system returns a validation error and no image is created

#### Scenario: Vendor with no images is valid
- **WHEN** a vendor is created or retrieved with no associated `VendorImage` records
- **THEN** the vendor is valid and the images list is returned as an empty array

---

### Requirement: One image can be designated as the cover
A vendor SHALL support at most one `VendorImage` with `isPrimary: true`. The cover image is the one displayed as a thumbnail on the vendor card.

#### Scenario: Couple sets a cover image
- **WHEN** a couple designates an image as the cover for a vendor they own
- **THEN** `isPrimary` is set to `true` on that image and `false` on all other images for that vendor, within a single transaction

#### Scenario: Cover image is returned with vendor data
- **WHEN** a vendor is fetched
- **THEN** the response includes the cover image URL (or null if none is designated)

#### Scenario: Deleting the cover image clears the cover
- **WHEN** a couple deletes the image that is currently the cover
- **THEN** the image is removed from storage and the database; no other image is automatically promoted to cover

---

### Requirement: Vendor images are deleted from storage when removed
When a `VendorImage` is deleted, its corresponding file SHALL be removed from Vercel Blob to prevent orphaned storage.

#### Scenario: Couple deletes a single image
- **WHEN** a couple removes an image from a vendor they own
- **THEN** the blob file is deleted and the `VendorImage` record is removed

#### Scenario: Vendor deletion cascades to images
- **WHEN** a vendor is deleted
- **THEN** all associated `VendorImage` blob files are deleted and the records are removed

---

### Requirement: Vendor images are returned with vendor detail
When a vendor is fetched by ID, the response SHALL include the full list of `VendorImage` records ordered by `order` ascending, then `createdAt` ascending.

#### Scenario: Vendor detail includes images
- **WHEN** a couple fetches a vendor by ID
- **THEN** the response includes an `images` array with all associated `VendorImage` records

#### Scenario: Images are ordered consistently
- **WHEN** a vendor has multiple images
- **THEN** images are returned ordered by `order` ascending, then `createdAt` ascending

---

### Requirement: Auto-gather fetches candidate images from vendor website
When a vendor has a `website` URL, the system SHALL fetch candidate images from that URL server-side and return them for the couple to review and select.

#### Scenario: Images are found on the vendor website
- **WHEN** a couple triggers auto-gather for a vendor with a valid website URL
- **THEN** the system returns a list of candidate image URLs extracted from the page (Open Graph images, Twitter card images, and large inline images)

#### Scenario: No usable images found on vendor website
- **WHEN** the vendor website returns no usable images (none meet size thresholds or page is unreachable)
- **THEN** the system returns an empty list and no error is thrown

#### Scenario: Auto-gather is unavailable without a website URL
- **WHEN** a couple attempts auto-gather for a vendor with no website URL set
- **THEN** the system returns a validation error

---

### Requirement: Couple selects images from auto-gather results and they are saved to storage
Images selected from the auto-gather picker SHALL be proxy-downloaded by the server into Vercel Blob, so the resulting URLs are owned by the app.

#### Scenario: Couple confirms selection from picker
- **WHEN** a couple selects one or more candidate images from the auto-gather picker and confirms
- **THEN** the server downloads each selected image and stores it in Vercel Blob, creating a `VendorImage` record for each

#### Scenario: Selection would exceed the 5-image limit
- **WHEN** a couple selects images that would cause the vendor to exceed 5 total images
- **THEN** the system returns a validation error and no images are saved
