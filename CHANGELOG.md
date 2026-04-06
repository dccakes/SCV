# Changelog

## [0.3.0](https://github.com/dccakes/SCV/compare/oswp-v0.2.0...oswp-v0.3.0) (2026-04-06)


### Features

* add table view mode for guest list display ([#47](https://github.com/dccakes/SCV/issues/47)) ([143f659](https://github.com/dccakes/SCV/commit/143f6593c6d946a0361c14f4637bb6b03cf31629))
* add wedding settings page and show location on dashboard ([#50](https://github.com/dccakes/SCV/issues/50)) ([d848e0b](https://github.com/dccakes/SCV/commit/d848e0b62dc241db3a754b36552d2fa5e007fedf))
* **auth:** add dynamic Vercel deployment URLs to auth trusted origins([#27](https://github.com/dccakes/SCV/issues/27)) ([0c1e4ad](https://github.com/dccakes/SCV/commit/0c1e4ad92cda1296780c31c1f81ddb66c9304df3))
* **auth:** add email service integration with OTP, password reset, and verification ([#48](https://github.com/dccakes/SCV/issues/48)) ([b32825f](https://github.com/dccakes/SCV/commit/b32825f3ef071ca37ed3b35f5f168a7cc610f2a1))
* **auth:** add organization-scoped permissions and settings members visibility ([#52](https://github.com/dccakes/SCV/issues/52)) ([60bab22](https://github.com/dccakes/SCV/commit/60bab22b04b499b77583350ddec243fb8525f3d2))
* **ci:** add GitHub Action for pull request tests ([#20](https://github.com/dccakes/SCV/issues/20)) ([44353ca](https://github.com/dccakes/SCV/commit/44353cafcebe8cce3f4e8e794dc136c86ccee0f3))
* cleanup ([#16](https://github.com/dccakes/SCV/issues/16)) ([9e1b6d3](https://github.com/dccakes/SCV/commit/9e1b6d3bf0716de5d90d4fa0602b8939aca5c6d7))
* **db:** inroduce wedding domain ([#11](https://github.com/dccakes/SCV/issues/11)) ([e19507c](https://github.com/dccakes/SCV/commit/e19507cfa81ebc23240d8111bd6175535b3ce842))
* **docs:** implement phase 5 - cleanup old routers and create comprehensive documentation ([#8](https://github.com/dccakes/SCV/issues/8)) ([28d512e](https://github.com/dccakes/SCV/commit/28d512ef38af49ef705710b4e5b47908a6915fc1))
* **etta:** add AI wedding agent with dual-persona chat interface ([#51](https://github.com/dccakes/SCV/issues/51)) ([2bbda9d](https://github.com/dccakes/SCV/commit/2bbda9d4202a7f980b96302b117366cb10b58dc5))
* **events:** feature/event crud ([#13](https://github.com/dccakes/SCV/issues/13)) ([b781417](https://github.com/dccakes/SCV/commit/b78141799c7c90a584cc1f379f1d3ebf7302ac7e))
* **guest:** Improve guest search filtering with case-insensitive full name matching ([#37](https://github.com/dccakes/SCV/issues/37)) ([3bbacc4](https://github.com/dccakes/SCV/commit/3bbacc4590eb99fb3ddd2c16070cbd8c185f1417))
* **guests:** add CSV bulk import for guests with validation and preview ([#31](https://github.com/dccakes/SCV/issues/31)) ([789a35e](https://github.com/dccakes/SCV/commit/789a35edbd34c8c3b5b4c1a824738bdf517be5f6))
* **guests:** add guest filtering by tag and country, improve vendor UI ([#39](https://github.com/dccakes/SCV/issues/39)) ([1283967](https://github.com/dccakes/SCV/commit/128396778482c61281fb32e32e9b21771820a04c))
* **guests:** add tag-along guest support with transaction-based operations ([#35](https://github.com/dccakes/SCV/issues/35)) ([04984f0](https://github.com/dccakes/SCV/commit/04984f0d621114e679471410b608c5745f1072b3))
* **guests:** clenaup guest drawer display edit ([#32](https://github.com/dccakes/SCV/issues/32)) ([0b91e0a](https://github.com/dccakes/SCV/commit/0b91e0a3f003fec64ddf3ab1d25eef9bf0ddba49))
* **guests:** delete household functionality to guest detail panel ([#38](https://github.com/dccakes/SCV/issues/38)) ([0b7b59e](https://github.com/dccakes/SCV/commit/0b7b59e89fde2e08d1ab00878f33f3d81afb68dd))
* **guests:** make lastName optional for guests ([#41](https://github.com/dccakes/SCV/issues/41)) ([46d57c3](https://github.com/dccakes/SCV/commit/46d57c37f82a449139aba7604c1e2862e7867e87))
* **guests:** update add guest form ([#12](https://github.com/dccakes/SCV/issues/12)) ([ab6b51a](https://github.com/dccakes/SCV/commit/ab6b51a56a363e09b159c1b359961f8a0bd28375))
* **invites:** refactor self-fill registration invites to application layer with code quality improvements ([#24](https://github.com/dccakes/SCV/issues/24)) ([f4e84d7](https://github.com/dccakes/SCV/commit/f4e84d75019cebc42c9dad0fbe887e368ed6c210))
* **members:** invite members ([#58](https://github.com/dccakes/SCV/issues/58)) ([6929692](https://github.com/dccakes/SCV/commit/692969203a593e47e18c56ad8690c7cc254ce1db))
* **migrate:** implement phase 4 of domain integration plan ([#6](https://github.com/dccakes/SCV/issues/6)) ([cccf98b](https://github.com/dccakes/SCV/commit/cccf98b96ab9ca7d272de5b4ca4356ff9f07df26))
* **repo:** add OpenTelemetry instrumentation and error logging ([#59](https://github.com/dccakes/SCV/issues/59)) ([3eec723](https://github.com/dccakes/SCV/commit/3eec7231b92c2ee1bd470b9b6e3e415ff6795a04))
* **repo:** add TypeScript type augmentations for Jest mocks ([#23](https://github.com/dccakes/SCV/issues/23)) ([979bd46](https://github.com/dccakes/SCV/commit/979bd46987431259da0f5e1bb2ea1614112e555e))
* **repo:** migrate environment variables to centralized env validation ([#21](https://github.com/dccakes/SCV/issues/21)) ([8b87ea5](https://github.com/dccakes/SCV/commit/8b87ea542007a5248d7e2c732dd66359b1dcc863))
* **repo:** redesign landing page with comprehensive outward-facing layout ([#25](https://github.com/dccakes/SCV/issues/25)) ([0e51111](https://github.com/dccakes/SCV/commit/0e51111b7c3d7a9587bdbb74da89ec49aedbc82f))
* **seed:** add Shrek and Fiona comprehensive demo fixture ([#29](https://github.com/dccakes/SCV/issues/29)) ([63d61ce](https://github.com/dccakes/SCV/commit/63d61cea516a6a4de1709f76a3c200e433cb113b))
* **setup:** update prisma runs ([#7](https://github.com/dccakes/SCV/issues/7)) ([f7b16e7](https://github.com/dccakes/SCV/commit/f7b16e772575943b88ae6f01090c0f2f97de4d68))
* **tests:** add comprehensive E2E test suite with Playwright ([#40](https://github.com/dccakes/SCV/issues/40)) ([ec42068](https://github.com/dccakes/SCV/commit/ec42068d93dbaa625edab342ab1eba290410f54a))
* **ui:** add self-invite link manager for guest self-registration ([#30](https://github.com/dccakes/SCV/issues/30)) ([705e74c](https://github.com/dccakes/SCV/commit/705e74c322243d358c7042bc2938244ffca9c7bf))
* **ui:** add shadcn components ([#9](https://github.com/dccakes/SCV/issues/9)) ([495a2f5](https://github.com/dccakes/SCV/commit/495a2f58f5a52d24f145f049303bf4f7f16fc164))
* **ui:** redesign landing dashboard ([#28](https://github.com/dccakes/SCV/issues/28)) ([fb29031](https://github.com/dccakes/SCV/commit/fb2903164c36856b81cd635959e4511eb3ec19d1))
* **ui:** refactor dashboard UI with modern design system and component library ([#17](https://github.com/dccakes/SCV/issues/17)) ([c49aa97](https://github.com/dccakes/SCV/commit/c49aa977170d55783199403c3f140dd01394ba4a))
* **ui:** update ui fixes ([#33](https://github.com/dccakes/SCV/issues/33)) ([5ed6611](https://github.com/dccakes/SCV/commit/5ed6611e9ff3344e34ac6a6db61de651023b7ea6))
* **vendors:** add file viewer drawer for PDFs and images ([#46](https://github.com/dccakes/SCV/issues/46)) ([b70e05b](https://github.com/dccakes/SCV/commit/b70e05b66bd859f34449e7b3bfa3fa34da69653d))
* **vendors:** add quote type field to vendor quotes (flat fee vs per guest) ([#43](https://github.com/dccakes/SCV/issues/43)) ([3ebf118](https://github.com/dccakes/SCV/commit/3ebf118639d97d9129635b94796e1d601d6a140e))
* **vendors:** add vendor management domain with service, repository, and UI ([#18](https://github.com/dccakes/SCV/issues/18)) ([916eabf](https://github.com/dccakes/SCV/commit/916eabf4f966b1a846e0c4f96d56be7cf0cb9d73))


### Bug Fixes

* **auth:** auth refactor to make wedding_id essentially the same as org_id ([#61](https://github.com/dccakes/SCV/issues/61)) ([574b7c6](https://github.com/dccakes/SCV/commit/574b7c630085dc70ffe1bdcb0bf9dbbfd0be33e4))
* **auth:** fix organization member settings loading ([#60](https://github.com/dccakes/SCV/issues/60)) ([f433279](https://github.com/dccakes/SCV/commit/f4332790a6e7dc09fef2bff71fcf6cfdf52e9ebb))
* **guests:** inline tag editing and age group selector in household members modal ([#49](https://github.com/dccakes/SCV/issues/49)) ([e4d4da9](https://github.com/dccakes/SCV/commit/e4d4da9a833b648d5853930aa67426db0f290688))
* React Server Components CVE vulnerabilities ([#14](https://github.com/dccakes/SCV/issues/14)) ([e41e7a1](https://github.com/dccakes/SCV/commit/e41e7a1bccfe372c4e634aeecdf2eece55cd335b))


### Code Refactoring

* **vendors:** vendor components and add quote file management ([#34](https://github.com/dccakes/SCV/issues/34)) ([e8c81d2](https://github.com/dccakes/SCV/commit/e8c81d25c49802a338f33e411e8d7ce7bb46e636))

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
