# Changelog

## [0.2.0](https://github.com/dccakes/SCV/compare/oswp-v0.1.0...oswp-v0.2.0) (2025-11-25)


### Features

* add better auth ui ([647028f](https://github.com/dccakes/SCV/commit/647028f643f71598fd56f7f51529c6e4702b7c9b))
* **build:** cleanup build ([b7c0b00](https://github.com/dccakes/SCV/commit/b7c0b00618f5a71ed69b036873ecffef6604f4c9))
* **domain:** implement Phase 1 domain-driven architecture ([c25f39c](https://github.com/dccakes/SCV/commit/c25f39cd673ce91ed8596782928040975fd4e6c8))
* **domain:** implement Phase 2-3 domain-driven architecture migration ([0bf1b39](https://github.com/dccakes/SCV/commit/0bf1b39ed6b36bd911859bf07679cb86e77ba050))
* make Clerk and S3 optional for local development ([8449e2d](https://github.com/dccakes/SCV/commit/8449e2d9a692d6ec2abb03fbfaaea8e57ddd4d6c))


### Bug Fixes

* add question form submission throwing error - client always passing questionOptions which is rejected by zod when type is Text ([d4fdcdb](https://github.com/dccakes/SCV/commit/d4fdcdb60092b27155d27147b947845bb389bc87))
* cast Object.entries rsvp values to string type ([bc44e78](https://github.com/dccakes/SCV/commit/bc44e786642f0f287b39647cc87d7d86ff753af3))
* **ci:** skip env validation in test env ([35dba16](https://github.com/dccakes/SCV/commit/35dba16d34e7aece800d35260fb85f8817b0c451))
* **ci:** update unit tests to node 22 ([1901f3a](https://github.com/dccakes/SCV/commit/1901f3a77fbc2aa6fa2f66faaaec868812920758))
* complete Next.js 15 downgrade and resolve all breaking changes ([f8b34a9](https://github.com/dccakes/SCV/commit/f8b34a9ff77ad9e4adfa8ea10009c2ddfeafc052))
* couldnt exit on first step of rsvp form ([647370a](https://github.com/dccakes/SCV/commit/647370a5c5f2140486c4babddfa4ee31f7432d11))
* **domain:** fix lint errors and update test configuration ([661f1c9](https://github.com/dccakes/SCV/commit/661f1c93b5feaba390bc38515f76c57535888425))
* event date field was not in accepted format to be prefilled by HTML5 form ([d13af50](https://github.com/dccakes/SCV/commit/d13af50016b4db6fc233ff4a1f278af5695afab4))
* inconsistent behavior with next-url header returning null - replace with custom header contaning url pathname  added by afterAuth logic in middleware ([e9a8268](https://github.com/dccakes/SCV/commit/e9a8268b434859bb9c3db75b2c9433aa1f676ad0))
* **invitation:** remove inferrable type annotations ([ba4712d](https://github.com/dccakes/SCV/commit/ba4712dbb5123f4b8500894be09fa3d63f1d2430))
* issue with referer header as path when navigating from the rsvp form back to the wedding website home page ([c92ad56](https://github.com/dccakes/SCV/commit/c92ad56fdf9a8f675d6f3fc990a4af1a27fe45e3))
* missing key for conditional event badges on dashboard page ([b47ca93](https://github.com/dccakes/SCV/commit/b47ca93590b097ed3108d0a43c21c42a67eb8a41))
* npm install @types/pg to resolve typescript issue with postgres driver in db.ts ([e3d4889](https://github.com/dccakes/SCV/commit/e3d4889eb7a39c0dd6fd4a8c8f3520d1bdd6f4f9))
* question option input fields error when typing ([f33ed68](https://github.com/dccakes/SCV/commit/f33ed68e663e7777bd4194620639557c1ed96b5a))
* recentAnswer was not fetching latest records ([f4e4ea4](https://github.com/dccakes/SCV/commit/f4e4ea471a652e4dc77c1fc31d7db367d70edd31))
* resolve HouseholdSearch type issue in confirm-name component ([dd77213](https://github.com/dccakes/SCV/commit/dd77213f160b26444a30aae0826a7d8bf0310285))
* rsvp dropdowns in guest table had duplicate ids ([de1b75f](https://github.com/dccakes/SCV/commit/de1b75f21d57d3858fcd3c9b039c3d90074fc032))
* rsvp form progress not completing on last step ([3a2e0af](https://github.com/dccakes/SCV/commit/3a2e0afed13e98b59f4b9d760ec7d4addb0a39af))
* set checked state of event checkboxes from guest names form to use RSVP values ([8592b20](https://github.com/dccakes/SCV/commit/8592b206bca2124f6ec1225be314c5f572f6e7c1))
* SSR mismatch warning with table element and dashboard section toggle bug ([3558493](https://github.com/dccakes/SCV/commit/35584934aeeeea91380d5f7492bf796d282e7cc9))
* submitRsvpForm errors due to Answer and OptionResponse tables not having unique relational ids ([4a372f9](https://github.com/dccakes/SCV/commit/4a372f9f2a5cfd187289095969ea208d06638dfb))
* **tests:** resolve ESLint errors in Phase 2-3 domain tests ([b1ad546](https://github.com/dccakes/SCV/commit/b1ad54613359ca9fdb6430a016abc3ac015f63db))
* undefined page title on rsvp page for unauthenticated users, so use website dependency instead ([b7218c0](https://github.com/dccakes/SCV/commit/b7218c044a3be98e232943929e66d4422e3e374b))
* update Prisma schema for Prisma 7 compatibility ([b7d2b3a](https://github.com/dccakes/SCV/commit/b7d2b3a84bebfaa188f48844f14894da39e42bf5))
* using wrong question type in question creation client logic ([e043876](https://github.com/dccakes/SCV/commit/e043876b2b0df03014d83422e7900e53f3e0629a))
* wrap GuestList in Suspense boundary for useSearchParams ([e134dcf](https://github.com/dccakes/SCV/commit/e134dcf6c47fa4af81c15b8203db4d12dc86aa6b))


### Documentation

* add comprehensive local development setup guide ([32f30dc](https://github.com/dccakes/SCV/commit/32f30dc601df8977a96498f3b91cf0930869d536))
* document Next.js 16 Turbopack limitation ([c806b27](https://github.com/dccakes/SCV/commit/c806b279b3fc150d1f60585c4652cbfa95a9acad))
* update Jest manual mocks pattern in claude.md ([0b2dbb2](https://github.com/dccakes/SCV/commit/0b2dbb2d6f18170f75d4ce4c88cfdd9418ea64a5))


### Code Refactoring

* extract db calls from form components into custom action hooks and wrap form components in SidePaneWrapper component ([689fc4b](https://github.com/dccakes/SCV/commit/689fc4b3b628121fb0136ddb3c7732894dab4e86))
* **tests:** implement Jest manual mocks pattern ([c915839](https://github.com/dccakes/SCV/commit/c9158390f732a565558a3cdc055778af2599026d))
* **ts:** add restrictive typescript types ([1cf4671](https://github.com/dccakes/SCV/commit/1cf4671457fe91100e2634681bc618b4e306b306))
* **ts:** add restrictive typescript types ([788dbd8](https://github.com/dccakes/SCV/commit/788dbd81307121a8a8681ec3f6f77efa1ed4c073))
