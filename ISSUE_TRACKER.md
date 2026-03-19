# Kaya — UI/UX Issue Tracker
## Pre-Demo Polish — March 2026

### CRITICAL (Must fix before Thursday demo)

| # | Issue | Page | Status |
|---|-------|------|--------|
| U-01 | Aya doesn't know user's name | /chat | ✅ Fixed — fallback profile lookup by user_id |
| U-02 | Profile nav wrong when not logged in | /profile | ✅ Fixed — shows Sign In when not auth'd |
| U-03 | Scenario cards not firing | /chat | ✅ Fixed — message count milestones (7-9 and 14-16) |
| U-04 | Confidence bars all 50% | /skills, /psychologist | ✅ Fixed — recalculate from raw pipeline |
| U-05 | Third-person language | /skills | ✅ Fixed — "You demonstrated" not "This candidate" |
| U-06 | Psychologist shows session IDs | /psychologist | ✅ Fixed — joins to user_profiles for name |
| U-07 | Employer shows raw IDs | /employer-dashboard | ✅ Fixed — clean cards |
| U-08 | No sign out button | Multiple | ✅ Fixed — all pages |
| U-09 | No approve/reject in reviewer | /reviewer | ✅ Fixed — Approve/Hold/Stop buttons |
| U-10 | Landing page shows all roles | / | ✅ Fixed — clean hero + portal links |
| U-25 | No back button on chat | /chat | ✅ Fixed — back arrow to dashboard |
| U-29 | Nav alignment broken | Multiple | ✅ Fixed — flex-nowrap + pipe separators |
| U-30 | Disability fields don't affect Aya | /chat | ✅ Verified — flows into calibration |
| U-31 | No back after profile save | /profile | ✅ Fixed — Dashboard button on step 4 |

### MEDIUM (Improves demo quality)

| # | Issue | Page | Status |
|---|-------|------|--------|
| U-11 | Skills page long flat list | /skills | ✅ Fixed — compact cards |
| U-12 | Dashboard profile sparse | /my-dashboard | ✅ Fixed — clean text, no emojis |
| U-13 | No "Add to Pipeline" on talent | /employer-dashboard | ✅ Fixed — button added |
| U-15 | Chat stage badge emojis | /chat | ✅ Fixed — restored living icons |
| U-16 | Aya avatar | /chat | ✅ Fixed — butterfly 🦋 restored |
| U-17 | Progress bar icons | /chat | ✅ Fixed — 🌅🌿🦋🔮💎✨ restored |
| U-18 | Auth page branding | /auth | ✅ Already has Kaya wordmark |
| U-19 | Skills header K icon | /skills | ✅ Fixed — removed random icon |
| U-26 | Scenario cards multiple choice | /chat | ✅ Already built — ScenarioCard component |
| U-28 | Resume upload + AI extraction | /profile | ✅ Built — /api/resume endpoint |
| U-32 | Save & Talk to Aya redirect | /profile | ✅ Verified — works correctly |
| U-33 | Gemini fallback | /api/chat, extraction | ✅ Built — src/lib/llm.ts |

### LOW / POST-MVP

| # | Issue | Page | Status |
|---|-------|------|--------|
| U-14 | Old demo data in reviewer | /reviewer | ✅ DB cleared — fresh flow |
| U-20 | Loading state on profile save | /profile | ⬜ Minor |
| U-21 | Mobile safe-area padding | /chat | ⬜ Post-demo |
| U-22 | New conversation button | /chat | ⬜ Post-demo |
| U-23 | Seed Cebuana vacancy | /vacancy | ⬜ Ryan will create during demo |
| U-24 | Demo pages have emojis | /demo | ⬜ Internal pages |
| U-27 | Micro-simulations | /chat | ⬜ Post-MVP design |

---
*Last updated: March 19, 2026*
*Build: ✅ Passes | Deploy: kaya-mvp-rose.vercel.app*
