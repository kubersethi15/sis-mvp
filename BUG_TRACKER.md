# Kaya — User Testing Bug Tracker
## Jakarta Summit Deadline: April 13, 2026

### CRITICAL — Blocks demo or user flow

| # | Issue | Reported by | Status | Notes |
|---|-------|------------|--------|-------|
| BUG-001 | Email confirmation redirects to localhost | Jinalie, Cynthia, Angel (5+ reports) | ✅ Code fixed | NEEDS: Set Site URL in Supabase dashboard to `https://sis-mvp.vercel.app` at `supabase.com/dashboard/project/ftdnpsrbnjkvazspmenv/auth/url-configuration` and add `https://sis-mvp.vercel.app/**` to Redirect URLs |
| BUG-002 | Profile data not saving after "Save Progress" | Mayleen, Angel, Cynthia | 🔍 Investigating | Auto-save after resume works. Manual save may fail silently. Need to check saveProfile function and DB write. |
| BUG-003 | Employer flow hardcoded to Cebuana Lhuillier | Sweet Angel | ✅ Fixed | Company name input added. No more hardcoded employer. |
| BUG-004 | Resume auto-fill only captures name/email | Angel, Cynthia, Jinalie | 🔍 Investigating | AI extraction should map all fields. May be parsing issue or field mapping mismatch. |
| BUG-005 | Vacancy not saving to database | Ryan | ✅ Fixed | Status was always 'draft'. Now saves as 'published'. Error logging added. |

### HIGH — Should fix before Jakarta

| # | Issue | Reported by | Status | Notes |
|---|-------|------------|--------|-------|
| BUG-006 | No forgot password option | Jinalie | ✅ Fixed | Added "Forgot password?" link on sign-in form |
| BUG-007 | No resend confirmation email | Jinalie | ✅ Fixed | Shows "Resend confirmation email" when login fails |
| BUG-008 | Kaya logo click signs user out | Jinalie | ✅ Fixed | Logo now links to /my-dashboard not / |
| BUG-009 | Disability "Other" has no text input | Cynthia | ✅ Fixed | Text input appears when Other selected |
| BUG-010 | No phone/email validation | Jinalie, Cynthia | ✅ Fixed | Phone: strips non-numeric, warns if <10 digits |
| BUG-011 | Aya response time slow | Angel | ⬜ Monitor | Likely API latency. Gemini fallback helps. |
| BUG-012 | No option to upload certs as files | Angel | ⬜ Post-Jakarta | Text input for now |

### MEDIUM — Nice to have

| # | Issue | Reported by | Status | Notes |
|---|-------|------------|--------|-------|
| BUG-013 | Separate Analyze vs Create Vacancy buttons | Sweet Angel | ⬜ Post-Jakarta | UX improvement |
| BUG-014 | No chat history / previous conversations | Angela | ✅ Already built | Multi-session with "Continue with Aya" |
| BUG-015 | No read-only profile view | Angel | ⬜ Post-Jakarta | Only edit mode exists |
| BUG-016 | Aya can't answer platform questions | Cynthia | ⬜ By design | Aya is for stories, not support. Add FAQ page? |
| BUG-017 | Add profile picture option | Ramir | ⬜ Post-Jakarta | |
| BUG-018 | Resume upload should specify format needed | Angel | ⬜ Post-Jakarta | Add helper text about supported formats |
| BUG-019 | Changing uploaded resume doesn't update name | Cynthia | 🔍 Investigating | May need to clear form before re-extraction |

### FROM RYAN CALL (April 8)

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| RYAN-001 | Vacancy save broken | ✅ Fixed | Status + employer_name + error logging |
| RYAN-002 | Employer portal needs placeholder vacancy | ✅ Fixed | Company name input, vacancy saves properly |
| RYAN-003 | Talent matches show validated candidates | ✅ Already working | Shows all candidates with extracted skills |
| RYAN-004 | Voice mode | ✅ Built | /chat-voice — STT input + TTS output |
| RYAN-005 | Multi-psychologist review (3 reviewers) | ⬜ Post-Jakarta | Psychologist feedback from certification session |
| RYAN-006 | Screen recording for demo | ⬜ Ryan doing | Loom videos of each portal |

### SUPABASE DASHBOARD CHANGES NEEDED (not code)

1. **Site URL**: Set to `https://sis-mvp.vercel.app` at Authentication → URL Configuration
2. **Redirect URLs**: Add `https://sis-mvp.vercel.app/**`
3. **Email templates**: Branded Kaya templates (Confirm signup already done)

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
src/app/employer/page.tsx          — Vacancy creation, JD parse, company name
src/app/employer-dashboard/page.tsx — Vacancies, talent matches, applicants, settings
src/app/api/chat/route.ts         — Aya chat + extraction + merge logic
src/app/api/gate1/route.ts        — Employer profile + vacancy + JD parsing
src/app/api/resume/route.ts       — Resume upload + AI extraction
src/components/LEEEChat.tsx        — Main chat UI
src/lib/extraction-pipeline.ts    — 5-stage extraction with SP cultural lens
src/lib/calibration.ts            — Session calibration + returning user context
src/lib/prompts.ts                — Aya system prompt + SP grounding
```

*Last updated: April 8, 2026*
