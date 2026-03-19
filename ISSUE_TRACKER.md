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

### FROM RYAN/KUBER FEEDBACK (March 18)

| # | Issue | Page | Description | Priority | Status |
|---|-------|------|-------------|----------|--------|
| U-25 | No back-to-dashboard button on chat page | /chat | Once in chat, no way to navigate back to dashboard. Need a button/link. | CRITICAL | ⬜ |
| U-26 | Scenario pop-up cards need multiple choice answers | /chat | Cards should present 2-3 options. User picks one. Choice feeds into extraction as personality/decision-making evidence. Should be fun and engaging, not just chatting. | CRITICAL | ⬜ |
| U-27 | Micro-simulations in chat | /chat | Beyond pop-up cards — short interactive scenarios, mini-games, decision trees. Goal: make it engaging, not just a chatbot. Post-MVP but design now. | POST-MVP | ⬜ |
| U-28 | Resume upload + AI extraction for profile | /profile | Let user upload resume/CV. AI extracts work history, education, skills and pre-fills the profile form. Reduces manual entry. | MEDIUM | ⬜ |
| U-29 | UI alignment — buttons not aligned properly | Multiple | Edit Profile and Sign Out buttons misaligned in nav. General button alignment issues across pages. Need UI polish pass. | CRITICAL | ⬜ |
| U-30 | Disability fields must actually affect Aya's behavior | /chat | Profile disability context (severity, communication impact, recently diagnosed) must be confirmed to flow into system prompt calibration and change how Aya speaks. Verify end-to-end. | CRITICAL | ⬜ |
| U-31 | No back-to-dashboard after profile save | /profile | After saving profile on step 4, user is stuck. No navigation to dashboard. | CRITICAL | ⬜ |
| U-32 | Chat page — "Save & Talk to Aya" should redirect properly | /profile → /chat | When clicking "Save & Talk to Aya" on step 4, need to ensure profile is saved AND user lands on chat with context loaded. | MEDIUM | ⬜ |
| U-33 | Gemini fallback when Claude is down | /api/chat, extraction | Add Google Gemini as backup LLM. If Anthropic API returns 5xx or times out, automatically fall back to Gemini. Needs: Gemini API key, adapter for message format, fallback logic in callClaude() and extraction pipeline. | MEDIUM | ⬜ |

---
*Last updated: March 18, 2026*
