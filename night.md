# Night Run: Bug Fix Prompts

## Prompt 1 — Landing Demo Glassmorphism Removal + Tenant Phone Cutout Overflow Fix

```markdown
**Goal:** Remove all lingering glassmorphic CSS styling (`glass-panel`, `backdrop-blur-*`, semi-transparent frosted surfaces) from the landing page demo components in `frontend/src/components/Hero.tsx`, `frontend/src/components/DemoDashboard.tsx`, `frontend/src/components/demo/DemoLandlordView.tsx`, `frontend/src/components/demo/DemoTenantPhone.tsx`, and `frontend/src/app/globals.css`, replacing them with solid, opaque background surfaces matching the modern design tokens. Fix the tenant phone chassis in `frontend/src/components/demo/DemoTenantPhone.tsx` so the top status bar / dynamic island camera cutout and header elements do not overflow or clip awkwardly with the outer chassis viewport.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `ui-ux-pro-max`, `frontend-design`, `high-end-visual-design`, `clean-code`, `react-best-practices`. Do not skip any of these skills.

**Required MCP Servers:** playwright

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(landing): remove demo glassmorphism and fix tenant phone cutout (#1)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 2 — Sand Dune Shapes Made Organic/Irregular

```markdown
**Goal:** Redesign the procedural SVG sand dune generators (`generatePeakPaths`, `generateRidgePaths`, `DUNES_CONFIG`, and `RANDOMIZED_DUNES`) in `frontend/src/components/landing/LandingBackground.tsx` to generate organic, naturally undulating, irregular topographic dunes rather than repetitive, rigid sinusoidal waves. Implement multi-harmonic curve algorithms with varied curvature, natural peak/ridge variance, and optimized SVG rendering without visual artifacts or frame drops.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `ui-ux-pro-max`, `frontend-design`, `high-end-visual-design`, `clean-code`, `react-best-practices`. Do not skip any of these skills.

**Required MCP Servers:** None

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(landing): make background sand dune shapes organic and irregular (#2)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 3 — Feature Cards Opaque Instead of Glassmorphic

```markdown
**Goal:** Refactor the bento grid feature cards in `frontend/src/components/landing/FeatureSection.tsx` by replacing `glass-panel` and translucent/frosted glass styling with clean, solid, opaque surface cards (`bg-card`, `border-border`, elevated solid tokens). Preserve all smooth hover animations, tab transitions between "Property Owners" and "Residents", and icon micro-interactions while eliminating blurred transparency artifacts.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `ui-ux-pro-max`, `frontend-design`, `clean-code`, `react-best-practices`. Do not skip any of these skills.

**Required MCP Servers:** None

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(landing): make feature bento cards opaque (#3)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 4 — Role-Selection Card Proportions Equalized

```markdown
**Goal:** Equalize the geometry, sizing, typography, and layout proportions between the "Property Owner" and "Tenant" selection cards in `frontend/src/app/page.tsx` (`#role-selection`). Eliminate asymmetric scaling (`scale: 1` vs `scale: 0.96`), unequal vertical positioning offsets (`lg:top-0` vs `lg:top-[50px]`), min-height discrepancies (`min-h-[380px]` vs `min-h-[360px]`), and icon container size differences (`w-16 h-16` vs `w-14 h-14`) so both role options possess balanced visual weight, clean alignment, and responsive symmetry.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `ui-ux-pro-max`, `frontend-design`, `clean-code`, `react-best-practices`. Do not skip any of these skills.

**Required MCP Servers:** playwright

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(onboarding): equalize role-selection card proportions (#4)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 5 — Empty-State Flash Gated Behind isLoading Across Landlord Tabs

```markdown
**Goal:** Prevent empty-state UI flashes during initial data queries and network transitions across all landlord tabs. Update `frontend/src/app/landlord/properties/page.tsx`, `frontend/src/app/landlord/units/page.tsx`, `frontend/src/app/landlord/requests/page.tsx`, `frontend/src/app/landlord/announcements/page.tsx`, `frontend/src/app/landlord/documents/page.tsx`, and `frontend/src/app/landlord/access-requests/page.tsx` to ensure empty-state banners/cards only render when `!isLoading && !error && data.length === 0`, and display appropriate skeleton loading states while `isLoading` is true.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `senior-frontend`, `systematic-debugging`, `react-best-practices`, `clean-code`, `test-driven-development`. Do not skip any of these skills.

**Required MCP Servers:** None

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(landlord): gate empty-state flash behind isLoading across all tabs (#5, #8)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 6 — Demo Account Tabs Populated from Database

```markdown
**Goal:** Connect demo sessions to realistic database seeds and backend endpoints rather than solely relying on static hardcoded fixtures in `frontend/src/components/demo/demoData.ts`. Audit and update `frontend/src/components/DemoDashboard.tsx`, demo view components, and backend demo endpoints (`backend/app/routers/` / seed data) to ensure all landlord and tenant demo tabs (properties, units, requests, announcements, documents) dynamically fetch and display populated database records.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `senior-fullstack`, `backend-architect`, `database-design`, `react-best-practices`, `clean-code`. Do not skip any of these skills.

**Required MCP Servers:** playwright

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(demo): populate demo account tabs from database (#6)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 7 — Unit-Specific Announcement Labels Standardized to Unit Name Only

```markdown
**Goal:** Standardize announcement unit targeting badges across `frontend/src/components/landlord/announcements/AnnouncementCard.tsx`, `frontend/src/components/landlord/announcements/CreateAnnouncementForm.tsx`, `frontend/src/app/tenant/announcements/page.tsx`, and `frontend/src/components/tenant/AnnouncementCard.tsx`. Strip redundant prefix noise (such as "Unit: Unit 101" or verbose concatenated strings) and render clean, consistent badges displaying the unit identifier directly (e.g., "Unit 101" or "All Units") across both Landlord and Tenant interfaces.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `senior-frontend`, `ui-ux-pro-max`, `react-best-practices`, `clean-code`. Do not skip any of these skills.

**Required MCP Servers:** None

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(announcements): standardize unit-specific announcement labels to unit name only (#7)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 8 — Real Account Creation Separated from Demo Accounts

```markdown
**Goal:** Enforce strict separation between genuine user registrations and demo sessions across `frontend/src/app/actions/onboarding.ts`, `frontend/src/app/sync-role/page.tsx`, `frontend/src/app/dashboard/page.tsx`, `frontend/src/lib/demo-session.ts`, and backend onboarding/auth routers (`backend/app/routers/onboarding.py`). Ensure real Clerk accounts register genuine database user entities with verified roles (`landlord` / `tenant`), prevent demo cookies (`mock_user_role`, `is_demo_session`) from polluting real user authentication flows, and isolate demo mode cleanly into ephemeral demo storage.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `senior-fullstack`, `backend-security-coder`, `backend-architect`, `clean-code`, `test-driven-development`. Do not skip any of these skills.

**Required MCP Servers:** playwright

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(auth): separate real account creation from demo accounts (#9)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 9 — Account Icon Routes to Correct Portal Instead of Demo/Landing Loop

```markdown
**Goal:** Fix user profile/account avatar navigation and dashboard redirects in `frontend/src/components/RootHeader.tsx`, `frontend/src/app/landlord/layout.tsx`, `frontend/src/app/tenant/layout.tsx`, and `frontend/src/app/dashboard/page.tsx`. Ensure clicking the user avatar or dashboard navigation button routes authenticated users directly to their designated portal (`/landlord/dashboard` for landlords, `/tenant/dashboard` for tenants) based on verified credentials, eliminating loops back to landing page `#role-selection` or `/sync-role` bouncing.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `senior-frontend`, `react-best-practices`, `nextjs-best-practices`, `clean-code`. Do not skip any of these skills.

**Required MCP Servers:** playwright

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `fix(nav): route account icon to correct portal instead of landing loop (#10)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 10 — Regression Test Coverage Audit and Additions for All Fixes

```markdown
**Goal:** Perform a comprehensive regression test audit and implement automated unit, integration, and E2E regression tests for all fixes from bugs #1 through #10. Add component & unit tests in `frontend/__tests__/` (covering opaque styling, dune rendering stability, role card geometry, empty-state isLoading gates, and announcement badge formats), backend pytest tests in `backend/tests/` (covering onboarding separation, demo vs real auth isolation, and database models), and Playwright E2E tests in `frontend/e2e/` (validating end-to-end user navigation, avatar routing, and role onboarding). Ensure all test suites pass with zero regressions.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `test-driven-development`, `test-fixing`, `e2e-testing`, `senior-fullstack`, `clean-code`. Do not skip any of these skills.

**Required MCP Servers:** playwright

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `test(regression): add comprehensive regression coverage for bugs 1-10 (#11)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```

## Prompt 11 — Final Verification Gate + Changelog

```markdown
**Goal:** Execute full verification across the entire repository. Run and pass all verification gates (`npm run build`, frontend unit tests, Playwright E2E tests, and backend `pytest`). Compile a comprehensive `CHANGELOG.md` documenting every bug fix from #1 through #10 with resolved problem statements, affected components, and verified outcomes. Verify that the repository on `fixes/problems` is completely clean, buildable, and ready for production deployment.

**Required Skills:** I want you to explicitly invoke and strictly follow the instructions in these skills: `senior-architect`, `victory_auditor`, `code-review-excellence`, `clean-code`. Do not skip any of these skills.

**Required MCP Servers:** playwright

**Execution Rules:**
- Work on branch `fixes/problems`. Commit locally after the fix with message format `chore(release): final verification gate and changelog (#11)`. Do NOT push.
- Make incremental changes; preserve existing architecture.
- Write failing tests first (TDD) where tests are involved.
- Run relevant gates (`npm run build`, `npm run test`, `npx playwright test`, backend `pytest`) before committing.
```
