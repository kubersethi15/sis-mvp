# Kaya — User Testing Bug Tracker
## Jakarta Summit Deadline: April 13, 2026

### CRITICAL — Blocks demo or user flow

| # | Issue | Reported by | Status | Notes |
|---|-------|------------|--------|-------|
| BUG-001 | Email confirmation redirects to localhost | Jinalie, Cynthia, Angel (5+ reports) | ✅ Fixed | Code fixed + Supabase dashboard Site URL and Redirect URLs configured by Kuber. |
| BUG-002 | Profile data not saving after "Save Progress" | Mayleen, Angel, Cynthia | ✅ Fixed | Root cause: `updateProfile` passed user-level fields (full_name, email, phone) to `jobseeker_profiles` table which rejected unknown columns. Fix: separated user_profiles vs jobseeker_profiles fields, updates both tables, whitelists valid columns. Also surfaced errors to UI instead of silent failure. |
| BUG-003 | Employer flow hardcoded to Cebuana Lhuillier | Sweet Angel | ✅ Fixed | Company name input added. No more hardcoded employer. |
| BUG-004 | Resume auto-fill only captures name/email | Angel, Cynthia, Jinalie | ✅ Fixed | Root cause: PDF text extraction used crude regex on raw bytes — only captured parenthesized fragments, producing garbage for real resumes. Fix: replaced with `pdf-parse` library for proper PDF text extraction, added `jszip` for .docx support. AI prompt was fine — it just wasn't receiving readable text. NEEDS: `npm install pdf-parse jszip` before deploy. |
| BUG-005 | Vacancy not saving to database | Ryan | ✅ Fixed | Status was always 'draft'. Now saves as 'published'. Error logging added. |

### HIGH — Should fix before Jakarta

| # | Issue | Reported by | Status | Notes |
|---|-------|------------|--------|-------|
| BUG-006 | No forgot password option | Jinalie | ✅ Fixed | Added "Forgot password?" link on sign-in form |
| BUG-007 | No resend confirmation email | Jinalie | ✅ Fixed | Shows "Resend confirmation email" when login fails |
| BUG-008 | Kaya logo click signs user out | Jinalie | ✅ Fixed | Logo now links to /my-dashboard not / |
| BUG-009 | Disability "Other" has no text input | Cynthia | ✅ Fixed | Text input appears when Other selected |
| BUG-010 | No phone/email validation | Jinalie, Cynthia | ✅ Fixed | Phone: strips non-numeric, warns if <10 digits |
| BUG-011 | Aya response time slow | Angel | ✅ Improved | Reduced chat timeout from 60s→15s for faster Gemini fallback. Reduced max_tokens 500→300 for shorter responses. Routed gap scan through callLLM for proper fallback. Full streaming is post-Jakarta. |
| BUG-012 | No option to upload certs as files | Angel | ⬜ Post-Jakarta | Text input for now |

### MEDIUM — Nice to have

| # | Issue | Reported by | Status | Notes |
|---|-------|------------|--------|-------|
| BUG-013 | Separate Analyze vs Create Vacancy buttons | Sweet Angel | ⬜ Post-Jakarta | UX improvement |
| BUG-014 | No chat history / previous conversations | Angela | ✅ Already built | Multi-session with "Continue with Aya" |
| BUG-015 | No read-only profile view | Angel | ⬜ Post-Jakarta | Only edit mode exists |
| BUG-016 | Aya can't answer platform questions | Cynthia | ✅ Fixed | Created /faq page with 18 FAQs across 5 categories. Added "Help" link to dashboard nav. Aya stays focused on stories. |
| BUG-017 | Add profile picture option | Ramir | ⬜ Post-Jakarta | |
| BUG-018 | Resume upload should specify format needed | Angel | ✅ Fixed | Added helper text: "Supported: PDF, Word (.docx), or plain text (.txt)" |
| BUG-019 | Changing uploaded resume doesn't update name | Cynthia | ✅ Fixed | Root cause: `!fullName` guard prevented overwrite on re-upload. Fix: removed guards so re-upload always overwrites all fields. Also resets resumeExtracted state. |

### FROM RYAN CALL (April 8)

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| RYAN-001 | Vacancy save broken | ✅ Fixed | Status + employer_name + error logging |
| RYAN-002 | Employer portal needs placeholder vacancy | ✅ Fixed | Company name input, vacancy saves properly |
| RYAN-003 | Talent matches show validated candidates | ✅ Already working | Shows all candidates with extracted skills |
| RYAN-004 | Voice mode | ✅ Built | /chat-voice — STT input + TTS output |
| RYAN-005 | Multi-psychologist review (3 reviewers) | ⬜ Post-Jakarta | Psychologist feedback from certification session |
| RYAN-006 | Screen recording for demo | ⬜ Ryan doing | Loom videos of each portal |

### SUPABASE DASHBOARD CHANGES — All Done ✅

1. ~~**Site URL**: Set to `https://sis-mvp.vercel.app`~~ ✅
2. ~~**Redirect URLs**: Added `https://sis-mvp.vercel.app/**`~~ ✅
3. **Email templates**: Branded Kaya templates (Confirm signup done)

---

### DEPLOYMENT INFO
- **Live URL**: https://sis-mvp.vercel.app
- **Repo**: https://github.com/kubersethi15/sis-mvp
- **Vercel Team**: virtualahan
- **Supabase**: ftdnpsrbnjkvazspmenv.supabase.co

### KEY FILES
```
src/app/auth/page.tsx              — Sign in/up, forgot password, resend confirmation
src/app/profile/page.tsx           — Profile form, resume upload, disability, validation
src/app/chat/page.tsx              — Aya conversation (LEEE chatbot)
src/app/skills/page.tsx            — Skills profile dashboard (superpowers reveal)
src/app/vacancy/page.tsx           — Browse vacancies, AI Q&A, check alignment, apply
src/app/employer/page.tsx          — Vacancy creation, JD parse, company name
src/app/employer-dashboard/page.tsx — Overview, vacancies, talent matches, settings
src/app/reviewer/page.tsx          — Three-gate pipeline review (approve/hold/stop)
src/app/psychologist/page.tsx      — Audit trail, methodology, validate & sign
src/app/my-dashboard/page.tsx      — Jobseeker hub (profile, Aya, skills, vacancies)
src/app/faq/page.tsx               — FAQ page (18 questions across 5 categories)
src/app/feedback/page.tsx          — Candidate feedback (not-selected)
src/app/onboarding/page.tsx        — Skills-informed onboarding (selected)
src/app/api/chat/route.ts         — Aya chat + extraction + merge logic
src/app/api/gate1/route.ts        — Employer profile + vacancy + alignment engine
src/app/api/gate3/route.ts        — Simulation + interview + readiness
src/app/api/demo/route.ts         — Apply + gate decisions + state management
src/app/api/resume/route.ts       — Resume upload + AI extraction (pdf-parse + jszip)
src/app/api/profile/route.ts      — Jobseeker profile CRUD
src/app/api/match/route.ts        — Vacancy ↔ jobseeker matching engine
src/app/api/psychologist/route.ts — Extraction retrieval + candidate names
src/components/LEEEChat.tsx        — Main chat UI (Moth stages, living landscape)
src/lib/extraction-pipeline.ts    — 5-stage extraction with SP cultural lens
src/lib/calibration.ts            — Session calibration + returning user context
src/lib/prompts.ts                — Aya system prompt + SP grounding
src/lib/llm.ts                    — Claude primary + Gemini fallback (15s timeout)
```

*Last updated: April 9, 2026 — All bugs fixed, full E2E pipeline verified, mobile polish done*
