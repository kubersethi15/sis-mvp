# Kaya — UI/UX Issue Tracker
## Pre-Demo Polish — March 2026

### CRITICAL (Must fix before Thursday demo)

| # | Issue | Page | Description | Status |
|---|-------|------|-------------|--------|
| U-01 | Aya doesn't know user's name | /chat | Aya says "I don't know your name" even though profile has it. The calibration context with name is built but may not be injecting into the session. | ⬜ |
| U-02 | Profile page says "My Dashboard" when not logged in | /profile | Fixed for logged-in state but profile page still shows odd nav when no auth. Need to verify auth state check works on Vercel. | ✅ Fixed |
| U-03 | Scenario cards not firing | /chat | Trigger logic updated to message count milestones. Need to verify it fires after 7+ messages on Vercel. | 🔶 Deployed, needs testing |
| U-04 | Confidence bars all show 50% | /skills, /psychologist | Fixed with recalculation from raw pipeline data. New extractions should have correct values. | ✅ Fixed |
| U-05 | "This candidate" third-person language | /skills | Fixed — rewrites to "You demonstrated". Need to verify on fresh extraction. | ✅ Fixed |
| U-06 | Psychologist shows session IDs not names | /psychologist | Fixed — joins to user_profiles for candidate name. | ✅ Fixed |
| U-07 | Employer dashboard shows raw IDs | /employer-dashboard | Fixed — clean cards, no IDs. | ✅ Fixed |
| U-08 | No sign out button | Dashboard, Profile | Fixed — Sign Out in nav clears localStorage + redirects to /auth. | ✅ Fixed |
| U-09 | No approve/reject in reviewer | /reviewer | Fixed — Approve/Hold/Stop buttons at every gate. | ✅ Fixed |
| U-10 | Landing page shows all roles | / | Fixed — clean hero focused on jobseeker. Employer/reviewer accessed via direct URLs. | ✅ Fixed |

### MEDIUM (Should fix, improves demo quality)

| # | Issue | Page | Description | Status |
|---|-------|------|-------------|--------|
| U-11 | Skills page — long flat list | /skills | Could group by vacancy-aligned vs additional. Cards could be more compact. | ⬜ |
| U-12 | Profile "Your Profile" section looks sparse | /my-dashboard | Shows raw data (1 work experience, 2 education). Could be formatted better. | ⬜ |
| U-13 | Employer dashboard — no way to create application from talent match | /employer-dashboard | Talent Matches tab shows candidates but no "Add to Pipeline" button. | ⬜ |
| U-14 | Reviewer — all 3 demo candidates already at "selected" | /reviewer | Old demo data. Need fresh flow for Thursday. | ⬜ |
| U-15 | Chat — "Getting to Know You" badge has emoji square | /chat | The stage indicator shows a colored square emoji instead of clean icon. | ⬜ |
| U-16 | Chat — Aya avatar is butterfly emoji not brand mark | /chat | Should use Kaya bloom mark or clean "A" initial instead of 🦋. | ⬜ |
| U-17 | Chat — story arc progress bar icons are empty circles | /chat | The milestone markers on the progress bar are plain circles — could be numbered or styled. | ⬜ |
| U-18 | Auth page — no Kaya branding | /auth | Plain form, no brand presence. Should have Kaya wordmark. | ⬜ |
| U-19 | Skills profile — "K" icon in header looks random | /skills | The green "K" square doesn't connect to any brand element. | ⬜ |

### LOW (Nice to have, post-demo)

| # | Issue | Page | Description | Status |
|---|-------|------|-------------|--------|
| U-20 | No loading state when profile saves | /profile | Save button changes text but no visual feedback. | ⬜ |
| U-21 | Mobile — chat input area needs safe-area padding | /chat | iPhone users might have input hidden behind home bar. | ⬜ |
| U-22 | No way to start a new conversation | /chat | If user finished one session, no clear way to start another. | ⬜ |
| U-23 | Vacancy page — empty without seeded data | /vacancy | Shows nothing unless employer has posted. Need to seed Cebuana vacancy. | ⬜ |
| U-24 | Demo/demo-day pages — still have emojis | /demo, /demo-day | Internal pages, low priority. | ⬜ |

---
*Last updated: March 2026*
